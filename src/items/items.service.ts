import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Item } from './entities/item.entity';
import { CreateItemDto } from './dto/create-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';
import { Category } from './entities/category.entity';

@Injectable()
export class ItemsService {
  constructor(
    @InjectRepository(Item)
    private itemsRepository: Repository<Item>,
    @InjectRepository(Category)
    private categoriesRepository: Repository<Category>,
  ) {}

  /**
   * Creates a new item in the database.
   * @param createItemDto Data for the new item, including ownerId.
   * @returns The created item entity.
   */
  async create(createItemDto: CreateItemDto, ownerId: string): Promise<Item> {
    // Note: The frontend CreateItemRequest maps directly to this DTO.
    // Assuming ownerId is correctly set on the DTO from the Auth Guard/Decorator in the controller.
    const newItem = this.itemsRepository.create({ ...createItemDto, ownerId });
    return this.itemsRepository.save(newItem);
  }

  /**
   * Finds a single item by its ID.
   * @param id The UUID of the item.
   * @returns The item entity.
   */
  async findOne(id: string): Promise<Item> {
    const item = await this.itemsRepository.findOne({ where: { id } });
    if (!item) {
      throw new NotFoundException(`Item with ID "${id}" not found.`);
    }
    return item;
  }

  /**
   * Finds all items belonging to a specific user (My Items endpoint).
   * @param ownerId The UUID of the user.
   * @returns A list of item entities.
   */
  async findMyItems(ownerId: string): Promise<Item[]> {
    return this.itemsRepository.find({
      where: { ownerId },
      // Optionally order by creation date for latest items first
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Updates an existing item.
   * @param id The UUID of the item to update.
   * @param ownerId The ID of the user performing the update (for authorization).
   * @param updateItemDto Data to update.
   * @returns The updated item entity.
   */
  async update(
    id: string,
    ownerId: string,
    updateItemDto: UpdateItemDto,
  ): Promise<Item> {
    const item = await this.findOne(id);

    if (item.ownerId !== ownerId) {
      throw new UnauthorizedException(
        'You do not have permission to edit this item.',
      );
    }

    // Apply updates and save
    Object.assign(item, updateItemDto);
    return this.itemsRepository.save(item);
  }

  /**
   * Deletes an item from the database.
   * @param id The UUID of the item to delete.
   * @param ownerId The ID of the user performing the deletion (for authorization).
   */
  async remove(id: string, ownerId: string): Promise<void> {
    const item = await this.findOne(id);

    if (item.ownerId !== ownerId) {
      throw new UnauthorizedException(
        'You do not have permission to delete this item.',
      );
    }

    await this.itemsRepository.delete(id);
  }

  /**
   * Finds all available item categories.
   */
  async findAllCategories(): Promise<Category[]> {
    // Fetches all categories, ordering by name is often useful for dropdowns.
    return this.categoriesRepository.find({
      order: { name: 'ASC' },
    });
  }
}
