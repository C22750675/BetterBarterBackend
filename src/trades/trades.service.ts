import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Item } from 'src/items/entities/item.entity';
import { User } from 'src/users/entities/user.entity';
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

@Injectable()
export class TradesService {
  constructor(
    @InjectRepository(Trade)
    private readonly tradeRepository: Repository<Trade>,
    @InjectRepository(Item)
    private readonly itemRepository: Repository<Item>,
    @InjectRepository(Rating)
    private readonly ratingRepository: Repository<Rating>,
    @InjectRepository(TradeApplication)
    private readonly applicationRepository: Repository<TradeApplication>,
    private readonly reputationService: ReputationService,
  ) {}

  async create(createTradeDto: CreateTradeDto, user: User) {
    const { itemId, circleId, quantity, description } = createTradeDto;

    const item = await this.itemRepository.findOneBy({ id: itemId });
    if (!item) throw new NotFoundException(`Item not found`);

    if (item.ownerId !== user.id)
      throw new ForbiddenException('You do not own this item');
    if (quantity > item.stock)
      throw new ForbiddenException(`Quantity exceeds stock`);

    const trade = this.tradeRepository.create({
      proposer: user,
      circleId,
      offeredItem: item,
      offeredItemQuantity: quantity,
      description,
      status: TradeStatus.PENDING,
    });

    return this.tradeRepository.save(trade);
  }

  // Accepts userId to check for existing applications
  async findByCircleId(circleId: string, userId: string): Promise<Trade[]> {
    const trades = await this.tradeRepository.find({
      where: { circleId, status: TradeStatus.PENDING },
      relations: ['proposer', 'offeredItem'],
      order: { creationDate: 'DESC' },
    });

    // Efficiently fetch user's applications for these trades
    const tradeIds = trades.map((t) => t.id);
    if (tradeIds.length === 0) return [];

    const myApplications = await this.applicationRepository
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
    return this.tradeRepository.find({
      where: [{ proposerId: userId }, { recipientId: userId }],
      relations: ['proposer', 'recipient', 'offeredItem'],
      order: { creationDate: 'DESC' },
    });
  }

  // Find One Trade with optional application check
  async findOne(tradeId: string, userId?: string): Promise<Trade> {
    const trade = await this.tradeRepository.findOne({
      where: { id: tradeId },
      relations: ['proposer', 'recipient', 'offeredItem'],
    });
    if (!trade) throw new NotFoundException('Trade not found');

    if (userId) {
      const myApplication = await this.applicationRepository.findOne({
        where: { tradeId, applicantId: userId },
      });
      if (myApplication) {
        trade.myApplication = myApplication;
      }
    }
    return trade;
  }

  async updateStatus(tradeId: string, status: TradeStatus) {
    const trade = await this.tradeRepository.findOne({
      where: { id: tradeId },
      relations: ['proposer', 'offeredItem'],
    });

    if (!trade) throw new NotFoundException('Trade not found');

    trade.status = status;
    if (status === TradeStatus.COMPLETED) {
      trade.completionDate = new Date();
    }

    return this.tradeRepository.save(trade);
  }

  async rateTrade(tradeId: string, dto: CreateRatingDto, rater: User) {
    const trade = await this.tradeRepository.findOne({
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

    const rating = this.ratingRepository.create({
      score: dto.score,
      comment: dto.comment,
      rater: rater,
      rateeId: rateeId,
      trade: trade,
    });

    const savedRating = await this.ratingRepository.save(rating);
    await this.tradeRepository.save(trade);

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
    const trade = await this.tradeRepository.findOneBy({ id: tradeId });
    if (!trade) throw new NotFoundException('Trade listing not found');

    if (trade.proposerId === user.id) {
      throw new BadRequestException('You cannot apply to your own trade');
    }

    const offeredItem = await this.itemRepository.findOneBy({
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
    const existingApplication = await this.applicationRepository.findOne({
      where: { tradeId, applicantId: user.id },
    });

    if (existingApplication) {
      // Update existing application
      existingApplication.offeredItem = offeredItem;
      existingApplication.offeredItemQuantity = dto.offeredItemQuantity;
      existingApplication.message = dto.message;

      return this.applicationRepository.save(existingApplication);
    }

    // Create new application
    const application = this.applicationRepository.create({
      trade,
      applicant: user,
      offeredItem,
      offeredItemQuantity: dto.offeredItemQuantity,
      message: dto.message,
      status: TradeApplicationStatus.PENDING,
    });

    return this.applicationRepository.save(application);
  }

  // Get Applications for a Trade (For the Proposer to see)
  async getApplicationsForTrade(tradeId: string, user: User) {
    const trade = await this.tradeRepository.findOneBy({ id: tradeId });
    if (!trade) throw new NotFoundException('Trade not found');

    // Only the proposer should see the applications (or admins)
    if (trade.proposerId !== user.id) {
      throw new ForbiddenException(
        'Only the trade owner can view applications',
      );
    }

    return this.applicationRepository.find({
      where: { tradeId },
      relations: ['applicant', 'offeredItem'],
      order: { createdAt: 'DESC' },
    });
  }

  // Accept Application
  async acceptApplication(applicationId: string, user: User) {
    const application = await this.applicationRepository.findOne({
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
    await this.applicationRepository.save(application);

    // 3. Update Trade Status and Set Recipient
    const trade = application.trade;
    trade.status = TradeStatus.ACCEPTED;
    trade.recipient = application.applicant; // Set the successful applicant as recipient
    await this.tradeRepository.save(trade);

    return { message: 'Application accepted, chat opened.' };
  }

  // Decline Application (Delete it)
  async declineApplication(applicationId: string, user: User) {
    const application = await this.applicationRepository.findOne({
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
    await this.applicationRepository.remove(application);

    return { message: 'Application declined and removed.' };
  }
}
