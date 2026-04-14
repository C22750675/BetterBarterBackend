import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Item } from '../items/entities/item.entity.js';
import { User } from '../users/entities/user.entity.js';
import { Repository } from 'typeorm';
import { CreateTradeDto } from './dto/create-trade.dto.js';
import { Trade, TradeStatus } from './entities/trade.entity.js';
import { CreateRatingDto } from './dto/create-rating.dto.js';
import { Rating } from './entities/rating.entity.js';
import { CreateTradeApplicationDto } from './dto/create-trade-application.dto.js';
import {
  TradeApplication,
  TradeApplicationStatus,
} from './entities/trade-application.entity.js';
import { ReputationService } from '../reputation/reputation.service.js';
import { ReputationChangeType } from '../reputation/entities/reputation-log.entity.js';
import { UpdateTradeDto } from './dto/update-trade.dto.js';

@Injectable()
export class TradesService {
  constructor(
    @InjectRepository(Trade)
    private readonly tradeRepo: Repository<Trade>,
    @InjectRepository(Item)
    private readonly itemRepo: Repository<Item>,
    @InjectRepository(Rating)
    private readonly ratingRepo: Repository<Rating>,
    @InjectRepository(TradeApplication)
    private readonly applicationRepo: Repository<TradeApplication>,
    private readonly reputationService: ReputationService,
  ) {}

  async create(createTradeDto: CreateTradeDto, user: User) {
    const { itemId, circleId, quantity, description } = createTradeDto;

    const item = await this.itemRepo.findOneBy({ id: itemId });
    if (!item) throw new NotFoundException(`Item not found`);

    if (item.ownerId !== user.id)
      throw new ForbiddenException('You do not own this item');
    if (quantity > item.stock)
      throw new ForbiddenException(`Quantity exceeds stock`);

    const trade = this.tradeRepo.create({
      proposer: user,
      circleId,
      offeredItem: item,
      offeredItemQuantity: quantity,
      description,
      status: TradeStatus.PENDING,
    });

    return this.tradeRepo.save(trade);
  }

  /**
   * Updates an existing trade proposal.
   * Logic:
   * 1. Ensure trade exists.
   * 2. Ensure the user is the original proposer.
   * 3. Ensure the trade is still PENDING.
   */
  async update(tradeId: string, dto: UpdateTradeDto, userId: string) {
    const trade = await this.tradeRepo.findOne({
      where: { id: tradeId },
    });

    if (!trade) {
      throw new NotFoundException(`Trade with ID ${tradeId} not found`);
    }

    // Security: Only the proposer can edit their own proposal
    if (trade.proposerId !== userId) {
      throw new ForbiddenException('You can only update trades you proposed');
    }

    // Business Logic: Trades cannot be edited once the recipient has interacted with them
    if (trade.status !== TradeStatus.PENDING) {
      throw new BadRequestException(
        `Cannot update a trade that is already ${trade.status}`,
      );
    }

    trade.offeredItemQuantity = dto.quantity;
    if (dto.description !== undefined) {
      trade.description = dto.description;
    }

    return this.tradeRepo.save(trade);
  }

  /**
   * Permanently deletes a trade listing.
   * Only allowed for PENDING trades by the proposer.
   */
  async remove(tradeId: string, userId: string) {
    const trade = await this.tradeRepo.findOne({
      where: { id: tradeId },
    });

    if (!trade) {
      throw new NotFoundException(`Trade with ID ${tradeId} not found`);
    }

    // Security check: only proposer can delete
    if (trade.proposerId !== userId) {
      throw new ForbiddenException('You can only delete trades you proposed');
    }

    // Status check: only pending trades can be deleted
    if (trade.status !== TradeStatus.PENDING) {
      throw new BadRequestException(
        `Cannot delete a trade that is already ${trade.status}`,
      );
    }

    await this.tradeRepo.remove(trade);
    return { message: 'Trade listing deleted successfully' };
  }

  // Accepts userId to check for existing applications
  async findByCircleId(circleId: string, userId: string): Promise<Trade[]> {
    const trades = await this.tradeRepo.find({
      where: { circleId, status: TradeStatus.PENDING },
      relations: ['proposer', 'offeredItem'],
      order: { creationDate: 'DESC' },
    });

    // Efficiently fetch user's applications for these trades
    const tradeIds = trades.map((t) => t.id);
    if (tradeIds.length === 0) return [];

    const myApplications = await this.applicationRepo
      .createQueryBuilder('app')
      .where('app.applicantId = :userId', { userId })
      .andWhere('app.tradeId IN (:...tradeIds)', { tradeIds })
      .getMany();

    // Map applications to trades
    const appMap = new Map(myApplications.map((app) => [app.tradeId, app]));

    trades.forEach((trade) => {
      if (appMap.has(trade.id)) {
        trade.myApplication = appMap.get(trade.id);
      }
    });

    return trades;
  }

  async findMyTrades(userId: string): Promise<Trade[]> {
    return this.tradeRepo.find({
      where: [{ proposerId: userId }, { recipientId: userId }],
      relations: ['proposer', 'recipient', 'offeredItem'],
      order: { creationDate: 'DESC' },
    });
  }

  // Find One Trade with optional application check
  async findOne(tradeId: string, userId?: string): Promise<Trade> {
    const trade = await this.tradeRepo.findOne({
      where: { id: tradeId },
      relations: ['proposer', 'recipient', 'offeredItem'],
    });
    if (!trade) throw new NotFoundException('Trade not found');

    if (userId) {
      const myApplication = await this.applicationRepo.findOne({
        where: { tradeId, applicantId: userId },
      });
      if (myApplication) {
        trade.myApplication = myApplication;
      }
    }
    return trade;
  }

  async updateStatus(tradeId: string, status: TradeStatus) {
    const trade = await this.tradeRepo.findOne({
      where: { id: tradeId },
      relations: ['proposer', 'offeredItem'],
    });

    if (!trade) throw new NotFoundException('Trade not found');

    trade.status = status;
    if (status === TradeStatus.COMPLETED) {
      trade.completionDate = new Date();
    }

    return this.tradeRepo.save(trade);
  }

  async rateTrade(tradeId: string, dto: CreateRatingDto, rater: User) {
    const trade = await this.tradeRepo.findOne({
      where: { id: tradeId },
      relations: ['proposer', 'recipient'],
    });

    if (!trade) throw new NotFoundException('Trade not found');
    if (trade.status !== TradeStatus.COMPLETED)
      throw new BadRequestException('Trade not complete');

    let rateeId: string;
    if (rater.id === trade.proposerId) {
      rateeId = trade.recipientId;
      trade.isRatedByProposer = true; // Set flag for proposer
    } else if (rater.id === trade.recipientId) {
      rateeId = trade.proposerId;
      trade.isRatedByRecipient = true; // Set flag for recipient
    } else {
      throw new ForbiddenException('You were not part of this trade');
    }

    const rating = this.ratingRepo.create({
      score: dto.score,
      comment: dto.comment,
      rater: rater,
      rateeId: rateeId,
      trade: trade,
    });

    const savedRating = await this.ratingRepo.save(rating);
    await this.tradeRepo.save(trade);

    // Map 1-5 star rating to binary Success/Failure for Bayesian parameters
    const changeType =
      dto.score >= 3
        ? ReputationChangeType.SUCCESS
        : ReputationChangeType.FAILURE;

    await this.reputationService.updateReputation(
      rateeId,
      changeType,
      `Rating received for Trade ID: ${tradeId}`,
    );

    return savedRating;
  }

  // Apply for a Trade
  async applyForTrade(
    tradeId: string,
    dto: CreateTradeApplicationDto,
    user: User,
  ) {
    const trade = await this.tradeRepo.findOneBy({ id: tradeId });
    if (!trade) throw new NotFoundException('Trade listing not found');

    if (trade.proposerId === user.id) {
      throw new BadRequestException('You cannot apply to your own trade');
    }

    const offeredItem = await this.itemRepo.findOneBy({
      id: dto.offeredItemId,
    });
    if (!offeredItem) throw new NotFoundException('Offered item not found');

    if (offeredItem.ownerId !== user.id) {
      throw new ForbiddenException('You do not own the item you are offering');
    }

    if (dto.offeredItemQuantity > offeredItem.stock) {
      throw new BadRequestException('Quantity exceeds your available stock');
    }

    // Check if application already exists to update it instead of creating duplicate
    const existingApplication = await this.applicationRepo.findOne({
      where: { tradeId, applicantId: user.id },
    });

    if (existingApplication) {
      // Update existing application
      existingApplication.offeredItem = offeredItem;
      existingApplication.offeredItemQuantity = dto.offeredItemQuantity;
      existingApplication.message = dto.message;

      return this.applicationRepo.save(existingApplication);
    }

    // Create new application
    const application = this.applicationRepo.create({
      trade,
      applicant: user,
      offeredItem,
      offeredItemQuantity: dto.offeredItemQuantity,
      message: dto.message,
      status: TradeApplicationStatus.PENDING,
    });

    return this.applicationRepo.save(application);
  }

  // Get Applications for a Trade (For the Proposer to see)
  async getApplicationsForTrade(tradeId: string, user: User) {
    const trade = await this.tradeRepo.findOneBy({ id: tradeId });
    if (!trade) throw new NotFoundException('Trade not found');

    // Only the proposer should see the applications (or admins)
    if (trade.proposerId !== user.id) {
      throw new ForbiddenException(
        'Only the trade owner can view applications',
      );
    }

    return this.applicationRepo.find({
      where: { tradeId },
      relations: ['applicant', 'offeredItem'],
      order: { createdAt: 'DESC' },
    });
  }

  // Accept Application
  async acceptApplication(applicationId: string, user: User) {
    const application = await this.applicationRepo.findOne({
      where: { id: applicationId },
      relations: ['trade', 'applicant'], // Load relations
    });

    if (!application) throw new NotFoundException('Application not found');

    // 1. Check permission (User must be the trade proposer)
    if (application.trade.proposerId !== user.id) {
      throw new ForbiddenException(
        'You do not have permission to accept this application',
      );
    }

    // 2. Update Application Status
    application.status = TradeApplicationStatus.ACCEPTED;
    await this.applicationRepo.save(application);

    // 3. Update Trade Status and Set Recipient
    const trade = application.trade;
    trade.status = TradeStatus.ACCEPTED;
    trade.recipient = application.applicant; // Set the successful applicant as recipient
    await this.tradeRepo.save(trade);

    return { message: 'Application accepted, chat opened.' };
  }

  // Decline Application (Delete it)
  async declineApplication(applicationId: string, user: User) {
    const application = await this.applicationRepo.findOne({
      where: { id: applicationId },
      relations: ['trade'],
    });

    if (!application) throw new NotFoundException('Application not found');

    if (application.trade.proposerId !== user.id) {
      throw new ForbiddenException(
        'You do not have permission to decline this application',
      );
    }

    // Delete the application
    await this.applicationRepo.remove(application);

    return { message: 'Application declined and removed.' };
  }
}
