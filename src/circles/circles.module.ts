import { Module } from '@nestjs/common';
import { Circle } from './entities/circle.entity';
import { CirclesService } from './circles.service';
import { CirclesController } from './circles.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Membership } from './entities/membership.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Circle, Membership])],
  controllers: [CirclesController],
  providers: [CirclesService],
  exports: [CirclesService],
})
export class CirclesModule {}
