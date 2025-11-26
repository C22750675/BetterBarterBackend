import { Module } from '@nestjs/common';
import { TradesService } from './trades.service';
import { TradesController } from './trades.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Trade } from './entities/trade.entity';
import { Item } from 'src/items/entities/item.entity';
import { Circle } from 'src/circles/entities/circle.entity';
import { Rating } from './entities/rating.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Trade, Item, Circle, Rating])],
  controllers: [TradesController],
  providers: [TradesService],
})
export class TradesModule {}
