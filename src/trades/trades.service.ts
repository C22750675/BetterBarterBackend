import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Item } from '../items/entities/item.entity.js';
import { User } from '../users/entities/user.entity.js';
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
    private readonly dataSource: DataSource,
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

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      item.stock -= quantity;
      await queryRunner.manager.save(item);

      const savedTrade = await queryRunner.manager.save(trade);

      await queryRunner.commitTransaction();
      return savedTrade;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async update(tradeId: string, dto: UpdateTradeDto, userId: string) {
    const trade = await this.tradeRepo.findOne({
      where: { id: tradeId },
      relations: ['offeredItem'],
    });

    if (!trade) {
      throw new NotFoundException(`Trade with ID ${tradeId} not found`);
    }

    if (trade.proposerId !== userId) {
      throw new ForbiddenException('You can only update trades you proposed');
    }

    if (trade.status !== TradeStatus.PENDING) {
      throw new BadRequestException(
        `Cannot update a trade that is already ${trade.status}`,
      );
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      if (
        dto.quantity !== undefined &&
        dto.quantity !== trade.offeredItemQuantity
      ) {
        const stockDiff = dto.quantity - trade.offeredItemQuantity;

        if (trade.offeredItem) {
          if (stockDiff > 0 && trade.offeredItem.stock < stockDiff) {
            throw new BadRequestException(
              'Not enough stock to increase trade quantity',
            );
          }
          trade.offeredItem.stock -= stockDiff;
          await queryRunner.manager.save(trade.offeredItem);
        }
        trade.offeredItemQuantity = dto.quantity;
      }

      if (dto.description !== undefined) {
        trade.description = dto.description;
      }

      const savedTrade = await queryRunner.manager.save(trade);
      await queryRunner.commitTransaction();
      return savedTrade;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Permanently deletes a trade listing.
   * Only allowed for PENDING trades by the proposer.
   */
  async remove(tradeId: string, userId: string) {
    const trade = await this.tradeRepo.findOne({
      where: { id: tradeId },
      relations: ['offeredItem'],
    });

    if (!trade)
      throw new NotFoundException(`Trade with ID ${tradeId} not found`);
    if (trade.proposerId !== userId)
      throw new ForbiddenException('You can only delete trades you proposed');
    if (trade.status !== TradeStatus.PENDING)
      throw new BadRequestException(
        `Cannot delete a trade that is already ${trade.status}`,
      );

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      if (trade.offeredItem) {
        trade.offeredItem.stock += trade.offeredItemQuantity;
        await queryRunner.manager.save(trade.offeredItem);
      }

      await queryRunner.manager.remove(trade);
      await queryRunner.commitTransaction();
      return { message: 'Trade listing deleted successfully' };
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

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

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      if (
        status === TradeStatus.CANCELLED &&
        trade.status === TradeStatus.PENDING
      ) {
        if (trade.offeredItem) {
          trade.offeredItem.stock += trade.offeredItemQuantity;
          await queryRunner.manager.save(trade.offeredItem);
        }

        const apps = await queryRunner.manager.find(TradeApplication, {
          where: { tradeId },
          relations: ['offeredItem'],
        });

        for (const app of apps) {
          if (app.offeredItem) {
            app.offeredItem.stock += app.offeredItemQuantity;
            await queryRunner.manager.save(app.offeredItem);
          }
          await queryRunner.manager.remove(app);
        }
      }

      trade.status = status;
      if (status === TradeStatus.COMPLETED) {
        trade.completionDate = new Date();
      }

      const savedTrade = await queryRunner.manager.save(trade);
      await queryRunner.commitTransaction();
      return savedTrade;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
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
      trade.isRatedByProposer = true;
    } else if (rater.id === trade.recipientId) {
      rateeId = trade.proposerId;
      trade.isRatedByRecipient = true;
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

    const existingApplication = await this.applicationRepo.findOne({
      where: { tradeId, applicantId: user.id },
      relations: ['offeredItem'],
    });

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      if (existingApplication) {
        if (existingApplication.offeredItemId === dto.offeredItemId) {
          const diff =
            dto.offeredItemQuantity - existingApplication.offeredItemQuantity;
          if (diff > 0 && offeredItem.stock < diff)
            throw new BadRequestException(
              'Quantity exceeds your available stock',
            );
          offeredItem.stock -= diff;
          await queryRunner.manager.save(offeredItem);
        } else {
          if (existingApplication.offeredItem) {
            existingApplication.offeredItem.stock +=
              existingApplication.offeredItemQuantity;
            await queryRunner.manager.save(existingApplication.offeredItem);
          }
          if (dto.offeredItemQuantity > offeredItem.stock)
            throw new BadRequestException(
              'Quantity exceeds your available stock',
            );
          offeredItem.stock -= dto.offeredItemQuantity;
          await queryRunner.manager.save(offeredItem);
        }

        existingApplication.offeredItem = offeredItem;
        existingApplication.offeredItemQuantity = dto.offeredItemQuantity;
        existingApplication.message = dto.message;

        const savedApp = await queryRunner.manager.save(existingApplication);
        await queryRunner.commitTransaction();
        return savedApp;
      }

      if (dto.offeredItemQuantity > offeredItem.stock)
        throw new BadRequestException('Quantity exceeds your available stock');
      offeredItem.stock -= dto.offeredItemQuantity;
      await queryRunner.manager.save(offeredItem);

      const application = this.applicationRepo.create({
        trade,
        applicant: user,
        offeredItem,
        offeredItemQuantity: dto.offeredItemQuantity,
        message: dto.message,
        status: TradeApplicationStatus.PENDING,
      });

      const savedApp = await queryRunner.manager.save(application);
      await queryRunner.commitTransaction();
      return savedApp;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
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
      relations: ['trade', 'applicant'],
    });

    if (!application) throw new NotFoundException('Application not found');

    if (application.trade.proposerId !== user.id) {
      throw new ForbiddenException(
        'You do not have permission to accept this application',
      );
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      application.status = TradeApplicationStatus.ACCEPTED;
      await queryRunner.manager.save(application);

      const trade = application.trade;
      trade.status = TradeStatus.ACCEPTED;
      trade.recipient = application.applicant;
      await queryRunner.manager.save(trade);

      const otherApplications = await queryRunner.manager.find(
        TradeApplication,
        {
          where: { tradeId: trade.id, status: TradeApplicationStatus.PENDING },
          relations: ['offeredItem'],
        },
      );

      for (const otherApp of otherApplications) {
        if (otherApp.id !== application.id) {
          if (otherApp.offeredItem) {
            otherApp.offeredItem.stock += otherApp.offeredItemQuantity;
            await queryRunner.manager.save(otherApp.offeredItem);
          }
          await queryRunner.manager.remove(otherApp);
        }
      }

      await queryRunner.commitTransaction();
      return { message: 'Application accepted, chat opened.' };
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async declineApplication(applicationId: string, user: User) {
    const application = await this.applicationRepo.findOne({
      where: { id: applicationId },
      relations: ['trade', 'offeredItem'],
    });

    if (!application) throw new NotFoundException('Application not found');

    if (application.trade.proposerId !== user.id) {
      throw new ForbiddenException(
        'You do not have permission to decline this application',
      );
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      if (application.offeredItem) {
        application.offeredItem.stock += application.offeredItemQuantity;
        await queryRunner.manager.save(application.offeredItem);
      }

      await queryRunner.manager.remove(application);
      await queryRunner.commitTransaction();
      return { message: 'Application declined and removed.' };
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }
}
