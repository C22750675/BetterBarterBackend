import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  ParseUUIDPipe,
  ClassSerializerInterceptor,
  UseInterceptors,
} from '@nestjs/common';
import { CirclesService } from './circles.service.js';
import { CreateCircleDto } from './dtos/create-circle.dto.js';
import { UpdateCircleDto } from './dtos/update-circle.dto.js'; // Added import
import { JwtAuthGuard } from '../auth/decorators/jwt-auth.guard.js';
import { GetUser } from '../auth/decorators/get-user.decorator.js';
import { User } from '../users/entities/user.entity.js';
import { FindNearbyDto } from './dtos/find-nearby.dto.js';
import { Point } from 'typeorm';

@Controller('circles')
@UseGuards(JwtAuthGuard) // Protect all routes in this controller
export class CirclesController {
  constructor(private readonly circlesService: CirclesService) {}

  /**
   * Creates a new circle. The creator is automatically made an admin.
   */
  @Post()
  @UseInterceptors(ClassSerializerInterceptor)
  async create(
    @Body() createCircleDto: CreateCircleDto,
    @GetUser() user: User,
  ) {
    return this.circlesService.create(createCircleDto, user);
  }

  /**
   * (For Android App)
   * Fetches all circles the authenticated user is a member of.
   */
  @Get('my-circles')
  @UseInterceptors(ClassSerializerInterceptor)
  async findMyCircles(@GetUser() user: User) {
    return this.circlesService.findCirclesByUserId(user.id);
  }

  /**
   * (For Map Screen / Join List)
   * Finds circles within a radius, EXCLUDING ones the user is already in.
   */
  @Get('near')
  @UseInterceptors(ClassSerializerInterceptor)
  async findNearby(
    @Query() findNearbyDto: FindNearbyDto,
    @GetUser() user: User, // Inject the user to get their ID for filtering
  ) {
    const { lat, lon, radius } = findNearbyDto;
    const origin: Point = {
      type: 'Point',
      coordinates: [lon, lat],
    };
    // Pass the user ID to the service
    return this.circlesService.findNearby(origin, radius, user.id);
  }

  /**
   * (For Map Screen)
   * Gets the public details of a single circle by its ID.
   */
  @UseInterceptors(ClassSerializerInterceptor)
  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.circlesService.findOneWithDetails(id);
  }

  @Post(':id/join')
  async joinCircle(
    @Param('id', ParseUUIDPipe) circleId: string,
    @GetUser() user: User,
  ) {
    return this.circlesService.joinCircle(circleId, user);
  }

  @Delete(':id/leave')
  async leaveCircle(
    @Param('id', ParseUUIDPipe) circleId: string,
    @GetUser() user: User,
  ) {
    return this.circlesService.leaveCircle(circleId, user.id);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) circleId: string,
    @Body() updateCircleDto: UpdateCircleDto,
    @GetUser() user: User,
  ) {
    return this.circlesService.update(circleId, updateCircleDto, user.id);
  }

  @Delete(':id')
  async remove(
    @Param('id', ParseUUIDPipe) circleId: string,
    @GetUser() user: User,
  ) {
    return this.circlesService.remove(circleId, user.id);
  }
}
