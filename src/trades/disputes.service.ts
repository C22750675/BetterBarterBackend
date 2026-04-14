import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Dispute, DisputeStatus } from './entities/dispute.entity.js';
import { Trade, TradeStatus } from './entities/trade.entity.js';
import { Membership } from '../circles/entities/membership.entity.js';
import { CreateDisputeDto } from './dto/create-dispute.dto.js';
import { ResolveDisputeDto } from './dto/resolve-dispute.dto.js';
import { GetDisputesFilterDto } from './dto/get-disputes-filter.dto.js';
import { ReputationService } from '../reputation/reputation.service.js';
import { ReputationChangeType } from '../reputation/entities/reputation-log.entity.js';

@Injectable()
export class DisputesService {
  constructor(
    @InjectRepository(Dispute)
    private readonly disputeRepo: Repository<Dispute>,
    @InjectRepository(Trade)
    private readonly tradeRepo: Repository<Trade>,
    @InjectRepository(Membership)
    private readonly membershipRepo: Repository<Membership>,
    private readonly reputationService: ReputationService,
  ) {}

  /**
   * Fetches a list of disputes for the circles where the user is an admin.
   */
  async findAdminDisputes(adminId: string, filterDto: GetDisputesFilterDto) {
    const { status, circleId } = filterDto;

    const query = this.disputeRepo
      .createQueryBuilder('dispute')
      .innerJoinAndSelect('dispute.trade', 'trade')
      .innerJoin('trade.circle', 'circle')
      .innerJoin('circle.memberships', 'membership')
      // Only fetch if the user is an admin of the circle the trade belongs to
      .where('membership.userId = :adminId', { adminId })
      .andWhere('membership.isAdmin = :isAdmin', { isAdmin: true });

    if (status) {
      query.andWhere('dispute.status = :status', { status });
    }

    if (circleId) {
      query.andWhere('trade.circleId = :circleId', { circleId });
    }

    // Show newest disputes first
    query.orderBy('dispute.createdAt', 'DESC');

    return query.getMany();
  }

  /**
   * Fetches a highly detailed view of a single dispute for the admin dashboard.
   */
  async findOneDetailed(disputeId: string, adminId: string) {
    const dispute = await this.disputeRepo
      .createQueryBuilder('dispute')
      .innerJoinAndSelect('dispute.trade', 'trade')
      .innerJoinAndSelect('trade.proposer', 'proposer')
      .innerJoinAndSelect('trade.recipient', 'recipient')
      .leftJoinAndSelect('trade.offeredItem', 'offeredItem')
      .leftJoinAndSelect('trade.messages', 'messages') // Load chat logs for evidence
      .innerJoin('trade.circle', 'circle')
      .innerJoin('circle.memberships', 'membership')
      .where('dispute.id = :disputeId', { disputeId })
      // Security Check
      .andWhere('membership.userId = :adminId', { adminId })
      .andWhere('membership.isAdmin = :isAdmin', { isAdmin: true })
      // Sort messages chronologically
      .orderBy('dispute.createdAt', 'DESC')
      .addOrderBy('messages.timestamp', 'ASC')
      .getOne();

    if (!dispute) {
      throw new NotFoundException(
        'Dispute not found, or you do not have admin access to view it.',
      );
    }

    return dispute;
  }

  /**
   * Opens a new dispute on a trade.
   */
  async create(dto: CreateDisputeDto, reporterId: string) {
    const trade = await this.tradeRepo.findOne({
      where: { id: dto.tradeId },
    });

    if (!trade) throw new NotFoundException('Trade not found');

    if (trade.proposerId !== reporterId && trade.recipientId !== reporterId) {
      throw new ForbiddenException('You are not a participant in this trade');
    }

    if (trade.status === TradeStatus.DISPUTED) {
      throw new BadRequestException('This trade is already under dispute');
    }

    const dispute = this.disputeRepo.create({
      tradeId: trade.id,
      description: dto.description,
      status: DisputeStatus.OPEN,
      reporterId: reporterId,
    });

    trade.status = TradeStatus.DISPUTED;
    await this.tradeRepo.save(trade);

    return this.disputeRepo.save(dispute);
  }

  /**
   * Allows the reporter to withdraw the dispute before it is settled.
   */
  async withdraw(tradeId: string, userId: string) {
    const trade = await this.tradeRepo.findOne({
      where: { id: tradeId },
      relations: ['dispute'],
    });

    if (!trade?.dispute)
      throw new NotFoundException('Open dispute not found for this trade');

    if (trade.dispute.reporterId !== userId) {
      throw new ForbiddenException(
        'Only the reporter who opened the dispute can withdraw it',
      );
    }

    if (trade.dispute.status !== DisputeStatus.OPEN) {
      throw new BadRequestException('Cannot withdraw a resolved dispute');
    }

    await this.disputeRepo.remove(trade.dispute);

    trade.status = TradeStatus.ACCEPTED;
    await this.tradeRepo.save(trade);

    return { message: 'Dispute withdrawn successfully' };
  }

  /**
   * Resolve a dispute (Circle Admin only).
   * Allows the admin to explicitly select the culprit or defaults to the non-reporting party.
   */
  async resolve(disputeId: string, dto: ResolveDisputeDto, adminId: string) {
    const dispute = await this.disputeRepo.findOne({
      where: { id: disputeId },
      relations: ['trade'],
    });

    if (!dispute) throw new NotFoundException('Dispute not found');
    if (dispute.status === DisputeStatus.RESOLVED) {
      throw new BadRequestException('Dispute is already resolved');
    }

    const membership = await this.membershipRepo.findOne({
      where: {
        circleId: dispute.trade.circleId,
        userId: adminId,
        isAdmin: true,
      },
    });

    if (!membership) {
      throw new ForbiddenException(
        'Only a circle admin can resolve this dispute',
      );
    }

    // Determine Culprit:
    // 1. Use dto.culpritId if provided by the admin.
    // 2. Default to the "other party" (non-reporter) if not provided.
    let targetCulpritId = dto.culpritId;

    if (!targetCulpritId) {
      targetCulpritId =
        dispute.reporterId === dispute.trade.proposerId
          ? dispute.trade.recipientId
          : dispute.trade.proposerId;
    }

    // Validation: Ensure the culprit is actually a participant in the trade
    if (
      targetCulpritId !== dispute.trade.proposerId &&
      targetCulpritId !== dispute.trade.recipientId
    ) {
      throw new BadRequestException(
        'The selected culprit is not a participant in this trade',
      );
    }

    // 1. Update Dispute record
    dispute.status = DisputeStatus.RESOLVED;
    dispute.severity = dto.severity;
    dispute.culpritId = targetCulpritId;
    dispute.resolvedAt = new Date();
    await this.disputeRepo.save(dispute);

    // 2. Finalize the Trade
    const trade = dispute.trade;
    trade.status = TradeStatus.COMPLETED;
    trade.completionDate = new Date();
    await this.tradeRepo.save(trade);

    // 3. Trigger Reputation Penalty
    // Even if severity is NONE, we call this to log the resolution event.
    await this.reputationService.updateReputation(
      targetCulpritId,
      ReputationChangeType.PENALTY,
      dto.resolutionNote || 'Dispute resolved by admin',
      dto.severity,
    );

    return dispute;
  }
}
