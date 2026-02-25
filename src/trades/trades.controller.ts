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
import { GetUser } from 'src/auth/decorators/get-user.decorator';
import { JwtAuthGuard } from 'src/auth/decorators/jwt-auth.guard';
import { User } from 'src/users/entities/user.entity';
import { CreateTradeDto } from './dto/create-trade.dto';
import { TradesService } from './trades.service';
import { CreateRatingDto } from './dto/create-rating.dto';
import { UpdateTradeStatusDto } from './dto/update-trade-status.dto';
import { CreateTradeApplicationDto } from './dto/create-trade-application.dto';

@Controller('trades')
@UseGuards(JwtAuthGuard)
@UseInterceptors(ClassSerializerInterceptor)
export class TradesController {
  constructor(private readonly tradesService: TradesService) {}

  @Post()
  async create(@Body() createTradeDto: CreateTradeDto, @GetUser() user: User) {
    return this.tradesService.create(createTradeDto, user);
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
  @Get(':id')
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @GetUser() user: User, // Inject user
  ) {
    return this.tradesService.findOne(id, user.id);
  }

  // Accept, Reject, or Complete a trade
  @Patch(':id/status')
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateStatusDto: UpdateTradeStatusDto,
  ) {
    return this.tradesService.updateStatus(id, updateStatusDto.status);
  }

  // Leave a review for a completed trade
  @Post(':id/rate')
  async rateTrade(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() createRatingDto: CreateRatingDto,
    @GetUser() user: User,
  ) {
    return this.tradesService.rateTrade(id, createRatingDto, user);
  }

  @Post(':id/apply')
  async applyForTrade(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateTradeApplicationDto,
    @GetUser() user: User,
  ) {
    return this.tradesService.applyForTrade(id, dto, user);
  }

  @Get(':id/applications')
  async getApplications(
    @Param('id', ParseUUIDPipe) id: string,
    @GetUser() user: User,
  ) {
    return this.tradesService.getApplicationsForTrade(id, user);
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
