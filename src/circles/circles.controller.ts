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
import { CirclesService } from './circles.service';
import { CreateCircleDto } from './dtos/create-circle.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { User } from '../users/entities/user.entity';
import { FindNearbyDto } from './dtos/find-nearby.dto';
import { Point } from 'typeorm';

@Controller('circles')
@UseGuards(JwtAuthGuard) // Protect all routes in this controller
export class CirclesController {
  constructor(private readonly circlesService: CirclesService) {}

  /**
   * Creates a new circle. The creator is automatically made an admin.
   */
  @Post()
  @UseInterceptors(ClassSerializerInterceptor) // --- ADDED ---
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
  @UseInterceptors(ClassSerializerInterceptor) // --- ADDED ---
  async findMyCircles(@GetUser() user: User) {
    // We just pass the user ID to the service
    return this.circlesService.findCirclesByUserId(user.id);
  }

  /**
   * (For Map Screen)
   * Finds all circles within a geographic radius.
   * e.g., /api/circles/near?lat=53.34&lon=-6.26&radius=10000
   */
  @Get('near')
  @UseInterceptors(ClassSerializerInterceptor) // --- ADDED ---
  async findNearby(@Query() findNearbyDto: FindNearbyDto) {
    const { lat, lon, radius } = findNearbyDto;
    const origin: Point = {
      type: 'Point',
      coordinates: [lon, lat],
    };
    return this.circlesService.findNearby(origin, radius);
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

  /**
   * (Use Case: Join a Circle)
   * Allows an authenticated user to join a circle.
   */
  @Post(':id/join')
  async joinCircle(
    @Param('id', ParseUUIDPipe) circleId: string,
    @GetUser() user: User,
  ) {
    return this.circlesService.joinCircle(circleId, user);
  }

  /**
   * (Use Case: Leave a Circle)
   * Allows an authenticated user to leave a circle.
   */
  @Delete(':id/leave')
  async leaveCircle(
    @Param('id', ParseUUIDPipe) circleId: string,
    @GetUser() user: User,
  ) {
    return this.circlesService.leaveCircle(circleId, user.id);
  }

  /**
   * (Admin Use Case)
   * Updates a circle's details. (Requires admin privileges)
   * NOTE: The service will handle the authorization logic.
   */
  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) circleId: string,
    @Body() updateCircleDto: /* You'd create an UpdateCircleDto here */ any,
    @GetUser() user: User,
  ) {
    return this.circlesService.update(circleId, updateCircleDto, user.id);
  }

  /**
   * (Admin Use Case)
   * Deletes a circle. (Requires admin privileges)
   */
  @Delete(':id')
  async remove(
    @Param('id', ParseUUIDPipe) circleId: string,
    @GetUser() user: User,
  ) {
    return this.circlesService.remove(circleId, user.id);
  }
}
