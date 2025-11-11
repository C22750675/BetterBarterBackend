import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { GetUser } from 'src/auth/decorators/get-user.decorator';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { User } from 'src/users/entities/user.entity';
import { CreateTradeDto } from './dto/create-trade.dto';
import { TradesService } from './trades.service';

@Controller('trades')
@UseGuards(JwtAuthGuard)
@UseInterceptors(ClassSerializerInterceptor)
export class TradesController {
  constructor(private readonly tradesService: TradesService) {}

  /**
   * (For Android App)
   * Creates a new trade proposal in a circle.
   */
  @Post()
  async create(@Body() createTradeDto: CreateTradeDto, @GetUser() user: User) {
    return this.tradesService.create(createTradeDto, user);
  }

  /**
   * (For Android App)
   * Gets all active trades for a specific circle.
   */
  @Get('circle/:circleId')
  async findByCircle(@Param('circleId', ParseUUIDPipe) circleId: string) {
    return this.tradesService.findByCircleId(circleId);
  }
}
