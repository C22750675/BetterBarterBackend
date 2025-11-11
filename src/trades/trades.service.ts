import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Item } from 'src/items/entities/item.entity';
import { User } from 'src/users/entities/user.entity';
import { Repository } from 'typeorm';
import { CreateTradeDto } from './dto/create-trade.dto';
import { Trade } from './entities/trade.entity';
import { TradeStatus } from './entities/trade.entity';

@Injectable()
export class TradesService {
  constructor(
    @InjectRepository(Trade)
    private readonly tradeRepository: Repository<Trade>,
    @InjectRepository(Item)
    private readonly itemRepository: Repository<Item>,
  ) {}

  async create(createTradeDto: CreateTradeDto, user: User) {
    const { itemId, circleId, quantity, description } = createTradeDto;

    // 1. Find the item being offered
    const item = await this.itemRepository.findOneBy({ id: itemId });
    if (!item) {
      throw new NotFoundException(`Item with ID ${itemId} not found`);
    }

    // 2. Security Check: Ensure the user owns this item
    if (item.ownerId !== user.id) {
      throw new ForbiddenException('You do not own this item');
    }

    // 3. Stock Check: Ensure they have enough stock
    if (quantity > item.stock) {
      throw new ForbiddenException(
        `Quantity (${quantity}) exceeds available stock (${item.stock})`,
      );
    }

    // 4. Create the new trade proposal
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

  /**
   * (For Android App)
   * Finds all pending trades for a specific circle.
   */
  async findByCircleId(circleId: string): Promise<Trade[]> {
    return this.tradeRepository.find({
      where: {
        circleId,
        status: TradeStatus.PENDING, // Only show active, open trades
      },
      // Eager load all the data the app will need
      relations: [
        'proposer',
        'offeredItem',
        'offeredItem.owner', // In case we need it, though proposer is the owner
      ],
      order: { creationDate: 'DESC' }, // Newest first
    });
  }
}
