import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Delete,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { GetUser } from '../auth/decorators/get-user.decorator.js';
import { JwtAuthGuard } from '../auth/decorators/jwt-auth.guard.js';
import { User } from '../users/entities/user.entity.js';
import { CreateTradeDto } from './dto/create-trade.dto.js';
import { TradesService } from './trades.service.js';
import { CreateRatingDto } from './dto/create-rating.dto.js';
import { UpdateTradeStatusDto } from './dto/update-trade-status.dto.js';
import { CreateTradeApplicationDto } from './dto/create-trade-application.dto.js';
import { UpdateTradeDto } from './dto/update-trade.dto.js';

@Controller('trades')
@UseGuards(JwtAuthGuard)
@UseInterceptors(ClassSerializerInterceptor)
export class TradesController {
  constructor(private readonly tradesService: TradesService) {}

  @Post()
  async create(@Body() createTradeDto: CreateTradeDto, @GetUser() user: User) {
    return this.tradesService.create(createTradeDto, user);
  }

  /**
   * Facilitates the frontend updateTrade request.
   */
  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateTradeDto: UpdateTradeDto,
    @GetUser() user: User,
  ) {
    return this.tradesService.update(id, updateTradeDto, user.id);
  }

  /**
   * Facilitates the frontend deleteTrade request.
   */
  @Delete(':tradeId')
  async remove(
    @Param('tradeId', ParseUUIDPipe) tradeId: string,
    @GetUser() user: User,
  ) {
    return this.tradesService.remove(tradeId, user.id);
  }

  @Get('circle/:circleId')
  async findByCircle(
    @Param('circleId', ParseUUIDPipe) circleId: string,
    @GetUser() user: User,
  ) {
    return this.tradesService.findByCircleId(circleId, user.id);
  }

  // Get trades user is involved in (either as proposer or recipient/item owner)
  @Get('my-trades')
  async findMyTrades(@GetUser() user: User) {
    return this.tradesService.findMyTrades(user.id);
  }

  // Get Single Trade by ID
  @Get(':tradeId')
  async findOne(
    @Param('tradeId', ParseUUIDPipe) tradeId: string,
    @GetUser() user: User, // Inject user
  ) {
    return this.tradesService.findOne(tradeId, user.id);
  }

  // Accept, Reject, or Complete a trade
  @Patch(':tradeId/status')
  async updateStatus(
    @Param('tradeId', ParseUUIDPipe) tradeId: string,
    @Body() updateStatusDto: UpdateTradeStatusDto,
  ) {
    return this.tradesService.updateStatus(tradeId, updateStatusDto.status);
  }

  // Leave a review for a completed trade
  @Post(':tradeId/rate')
  async rateTrade(
    @Param('tradeId', ParseUUIDPipe) tradeId: string,
    @Body() createRatingDto: CreateRatingDto,
    @GetUser() user: User,
  ) {
    return this.tradesService.rateTrade(tradeId, createRatingDto, user);
  }

  // Create a new application
  @Post(':tradeId/apply')
  async createApplication(
    @Param('tradeId', ParseUUIDPipe) tradeId: string,
    @Body() dto: CreateTradeApplicationDto,
    @GetUser() user: User,
  ) {
    return this.tradesService.createApplication(tradeId, dto, user);
  }

  // Edit an existing application
  @Patch('applications/:id')
  async updateApplication(
    @Param('id', ParseUUIDPipe) applicationId: string,
    @Body() dto: CreateTradeApplicationDto,
    @GetUser() user: User,
  ) {
    return this.tradesService.updateApplication(applicationId, dto, user);
  }

  @Get(':tradeId/applications')
  async getApplications(
    @Param('tradeId', ParseUUIDPipe) tradeId: string,
    @GetUser() user: User,
  ) {
    return this.tradesService.getApplicationsForTrade(tradeId, user);
  }

  @Post('applications/:id/accept')
  async acceptApplication(
    @Param('id', ParseUUIDPipe) applicationId: string,
    @GetUser() user: User,
  ) {
    return this.tradesService.acceptApplication(applicationId, user);
  }

  @Delete('applications/:id')
  async declineApplication(
    @Param('id', ParseUUIDPipe) applicationId: string,
    @GetUser() user: User,
  ) {
    return this.tradesService.declineApplication(applicationId, user);
  }
}
