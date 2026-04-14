import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/decorators/jwt-auth.guard.js';
import { GetUser } from '../auth/decorators/get-user.decorator.js';
import { User } from '../users/entities/user.entity.js';
import { DisputesService } from './disputes.service.js';
import { CreateDisputeDto } from './dto/create-dispute.dto.js';
import { ResolveDisputeDto } from './dto/resolve-dispute.dto.js';
import { GetDisputesFilterDto } from './dto/get-disputes-filter.dto.js';

@Controller('disputes')
@UseGuards(JwtAuthGuard)
export class DisputesController {
  constructor(private readonly disputesService: DisputesService) {}

  @Get()
  async getAdminDisputes(
    @Query() filterDto: GetDisputesFilterDto,
    @GetUser() user: User,
  ) {
    return this.disputesService.findAdminDisputes(user.id, filterDto);
  }

  @Get(':id')
  async getDisputeDetails(
    @Param('id', ParseUUIDPipe) id: string,
    @GetUser() user: User,
  ) {
    return this.disputesService.findOneDetailed(id, user.id);
  }

  @Post()
  async create(@Body() dto: CreateDisputeDto, @GetUser() user: User) {
    return this.disputesService.create(dto, user.id);
  }

  @Delete('trade/:tradeId')
  async withdraw(
    @Param('tradeId', ParseUUIDPipe) tradeId: string,
    @GetUser() user: User,
  ) {
    return this.disputesService.withdraw(tradeId, user.id);
  }

  @Patch(':id/resolve')
  async resolve(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ResolveDisputeDto,
    @GetUser() user: User,
  ) {
    return this.disputesService.resolve(id, dto, user.id);
  }
}
