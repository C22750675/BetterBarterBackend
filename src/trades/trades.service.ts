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
import { CreateTradeDto } from './dto/create-trade.dto';
import { Trade, TradeStatus } from './entities/trade.entity';
import { CreateRatingDto } from './dto/create-rating.dto';
import { Rating } from './entities/rating.entity';

@Injectable()
export class TradesService {
  constructor(
    @InjectRepository(Trade)
    private readonly tradeRepository: Repository<Trade>,
    @InjectRepository(Item)
    private readonly itemRepository: Repository<Item>,
    @InjectRepository(Rating)
    private readonly ratingRepository: Repository<Rating>,
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

  async findByCircleId(circleId: string): Promise<Trade[]> {
    return this.tradeRepository.find({
      where: { circleId, status: TradeStatus.PENDING },
      relations: ['proposer', 'offeredItem'],
      order: { creationDate: 'DESC' },
    });
  }

  async findMyTrades(userId: string): Promise<Trade[]> {
    return this.tradeRepository.find({
      where: [{ proposerId: userId }, { recipientId: userId }],
      relations: ['proposer', 'recipient', 'offeredItem'],
      order: { creationDate: 'DESC' },
    });
  }

  // Find One Trade
  async findOne(tradeId: string): Promise<Trade> {
    const trade = await this.tradeRepository.findOne({
      where: { id: tradeId },
      relations: ['proposer', 'offeredItem'], // Load items for details page
    });
    if (!trade) throw new NotFoundException('Trade not found');
    return trade;
  }

  async updateStatus(tradeId: string, status: TradeStatus, userId: string) {
    const trade = await this.tradeRepository.findOne({
      where: { id: tradeId },
      relations: ['proposer', 'offeredItem'],
    });

    if (!trade) throw new NotFoundException('Trade not found');

    if (status === TradeStatus.ACCEPTED) {
      if (trade.status !== TradeStatus.PENDING)
        throw new BadRequestException('Trade not pending');
      trade.recipientId = userId;
    }

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
    } else if (rater.id === trade.recipientId) {
      rateeId = trade.proposerId;
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

    return this.ratingRepository.save(rating);
  }
}
