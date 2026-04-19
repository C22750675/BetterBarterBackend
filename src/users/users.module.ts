import { Module } from '@nestjs/common';
import { UsersService } from './users.service.js';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity.js';
import { ReputationModule } from '../reputation/reputation.module.js';

@Module({
  imports: [TypeOrmModule.forFeature([User]), ReputationModule],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
