import { User } from '../../users/entities/user.entity.js';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Relation,
} from 'typeorm';
import { Trade } from './trade.entity.js';
import { Item } from '../../items/entities/item.entity.js';

export enum TradeApplicationStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
}

@Entity()
export class TradeApplication {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => User, (user) => user.tradeApplications, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'applicantId' })
  applicant!: Relation<User>;

  @Column()
  applicantId!: string;

  @ManyToOne(() => Trade, (trade) => trade.applications, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'tradeId' })
  trade!: Relation<Trade>;

  @Column()
  tradeId!: string;

  @ManyToOne(() => Item, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'offeredItemId' })
  offeredItem!: Relation<Item>;

  @Column({ nullable: true })
  offeredItemId!: string;

  @Column({ type: 'int', default: 1 })
  offeredItemQuantity!: number;

  @Column({ type: 'text', nullable: true })
  message!: string;

  @Column({
    type: 'enum',
    enum: TradeApplicationStatus,
    default: TradeApplicationStatus.PENDING,
  })
  status!: TradeApplicationStatus;

  @CreateDateColumn()
  createdAt!: Date;
}
