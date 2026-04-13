import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ItemsService } from './items.service.js';
import { CreateItemDto } from './dto/create-item.dto.js';
import { UpdateItemDto } from './dto/update-item.dto.js';
import { JwtAuthGuard } from '../auth/decorators/jwt-auth.guard.js';
import { GetUser } from '../auth/decorators/get-user.decorator.js';
import type { ValidatedUser } from '../auth/interfaces/validated-user.type.js';

@Controller('items')
@UseGuards(JwtAuthGuard)
export class ItemsController {
  constructor(private readonly itemsService: ItemsService) {}

  // GET /items/categories
  @Get('categories')
  findAllCategories() {
    return this.itemsService.findAllCategories();
  }

  // GET /items/my-items
  @Get('my-items')
  findMyItems(@GetUser() user: ValidatedUser) {
    return this.itemsService.findMyItems(user.id);
  }

  // GET /items/:id
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.itemsService.findOne(id);
  }

  /**
   * POST /items
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createItemDto: CreateItemDto, @GetUser('id') ownerId: string) {
    return this.itemsService.create({ ...createItemDto }, ownerId);
  }

  /**
   * PATCH /items/:id
   */
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateItemDto: UpdateItemDto,
    @GetUser('id') ownerId: string,
  ) {
    return this.itemsService.update(id, ownerId, updateItemDto);
  }

  /**
   * DELETE /items/:id
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string, @GetUser('id') ownerId: string) {
    return this.itemsService.remove(id, ownerId);
  }
}
