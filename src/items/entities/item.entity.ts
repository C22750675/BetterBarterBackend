import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Category } from './category.entity';
import { Circle } from '../../circles/entities/circle.entity';
import { Trade } from '../../trades/entities/trade.entity';

@Entity()
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

  // Many items can be posted to one circle
  @ManyToOne(() => Circle, (circle) => circle.items, {
    nullable: true, // An item can be in a user's inventory but not posted
    onDelete: 'SET NULL', // If a circle is deleted, the item becomes 'un-posted'
  })
  @JoinColumn({ name: 'circleId' })
  circle: Circle;

  @Column({ nullable: true })
  circleId: string;

  @OneToMany(() => Trade, (trade) => trade.offeredItem)
  trades: Trade[];
}
