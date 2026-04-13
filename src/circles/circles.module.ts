import { Module } from '@nestjs/common';
import { Circle } from './entities/circle.entity.js';
import { CirclesService } from './circles.service.js';
import { CirclesController } from './circles.controller.js';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Membership } from './entities/membership.entity.js';
import { ItemsModule } from '../items/items.module.js';

@Module({
  imports: [TypeOrmModule.forFeature([Circle, Membership]), ItemsModule],
  controllers: [CirclesController],
  providers: [CirclesService],
  exports: [CirclesService],
})
export class CirclesModule {}
