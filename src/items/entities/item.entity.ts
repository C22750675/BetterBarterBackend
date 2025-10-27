import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Category } from './category.entity';

@Entity('items')
export class Item {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'varchar', nullable: true })
  imageUrl: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0.0 })
  estimatedValue: number;

  @Column({ type: 'int', default: 1 })
  stock: number;

  @Column({ type: 'date', nullable: true })
  bestBeforeDate: Date;

  @Column({ type: 'date', nullable: true })
  useByDate: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Many items belong to one user (owner)
  @ManyToOne(() => User, (user) => user.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ownerId' })
  owner: User;

  @Column()
  ownerId: string;

  // Many items can belong to one category
  @ManyToOne(() => Category, (category) => category.items, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'categoryId' })
  category: Category;

  @Column({ nullable: true })
  categoryId: string;
}
