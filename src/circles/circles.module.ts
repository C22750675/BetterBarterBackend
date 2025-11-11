import { Module } from '@nestjs/common';
import { Circle } from './entities/circle.entity';
import { CirclesService } from './circles.service';
import { CirclesController } from './circles.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Membership } from './entities/membership.entity';
import { ItemsModule } from 'src/items/items.module';

@Module({
  imports: [TypeOrmModule.forFeature([Circle, Membership]), ItemsModule],
  controllers: [CirclesController],
  providers: [CirclesService],
  exports: [CirclesService],
})
export class CirclesModule {}
