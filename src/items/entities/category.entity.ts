import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Item } from './item.entity';

@Entity('categories')
export class Category {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  name: string;

  // Self-referencing relationship for sub-categories
  @ManyToOne(() => Category, (category) => category.childCategories, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'parentCategoryId' })
  parentCategory: Category;

  @Column({ nullable: true })
  parentCategoryId: string;

  @OneToMany(() => Category, (category) => category.parentCategory)
  childCategories: Category[];

  @OneToMany(() => Item, (item) => item.category)
  items: Item[];
}
