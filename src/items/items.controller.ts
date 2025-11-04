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
import { ItemsService } from './items.service';
import { CreateItemDto } from './dto/create-item.dto'; // Assuming DTO structure
import { UpdateItemDto } from './dto/update-item.dto'; // Assuming DTO structure
import { JwtAuthGuard } from '../auth/jwt-auth.guard'; // Path based on your structure
import { GetUser } from '../auth/decorators/get-user.decorator'; // Path based on your structure

@Controller('items')
@UseGuards(JwtAuthGuard) // Protects all item routes by default
export class ItemsController {
  constructor(private readonly itemsService: ItemsService) {}

  /**
   * POST /items
   * Endpoint for creating a new item (P1)
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createItemDto: CreateItemDto, @GetUser('id') ownerId: string) {
    // The ownerId is automatically inserted from the JWT payload by the decorator
    return this.itemsService.create({ ...createItemDto, ownerId });
  }

  /**
   * GET /items/my-items
   * Endpoint for fetching all items owned by the authenticated user (P1)
   */
  @Get('my-items')
  findMyItems(@GetUser('id') ownerId: string) {
    // This directly serves the /items/my-items endpoint used in AuthRepository.kt/ItemRepository.kt
    return this.itemsService.findMyItems(ownerId);
  }

  /**
   * GET /items/:id
   * Endpoint for fetching a single item's details
   */
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.itemsService.findOne(id);
  }

  /**
   * PATCH /items/:id
   * Endpoint for editing an item
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
   * Endpoint for deleting an item
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string, @GetUser('id') ownerId: string) {
    return this.itemsService.remove(id, ownerId);
  }

  /**
   * GET /items/categories
   * Endpoint for fetching all available item categories.
   */
  @Get('categories')
  // We'll keep this protected by JwtAuthGuard, assuming category data isn't needed pre-login.
  findAllCategories() {
    return this.itemsService.findAllCategories();
  }
}
