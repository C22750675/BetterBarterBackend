import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  OneToOne,
  Relation,
} from 'typeorm';
import { User } from '../../users/entities/user.entity.js';
import { Item } from '../../items/entities/item.entity.js';
import { Circle } from '../../circles/entities/circle.entity.js';
import { TradeApplication } from './trade-application.entity.js';
import { Dispute } from './dispute.entity.js';
import { Message } from './message.entity.js';

export enum TradeStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  COMPLETED = 'completed',
  DISPUTED = 'disputed',
}

@Entity()
export class Trade {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({
    type: 'enum',
    enum: TradeStatus,
    default: TradeStatus.PENDING,
  })
  status!: TradeStatus;

  @CreateDateColumn()
  creationDate!: Date;

  @Column({ type: 'timestamp', nullable: true })
  completionDate!: Date;

  @Column({ type: 'text', nullable: true })
  description!: string;

  @ManyToOne(() => User, (user) => user.proposedTrades, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'proposerId' })
  proposer!: Relation<User>;

  @Column()
  proposerId!: string;

  @ManyToOne(() => User, (user) => user.receivedTrades, {
    onDelete: 'CASCADE',
    nullable: true,
  })
  @JoinColumn({ name: 'recipientId' })
  recipient!: Relation<User>;

  @Column({ nullable: true })
  recipientId!: string;

  @Column()
  offeredItemQuantity!: number;

  @ManyToOne(() => Item, (item) => item.trades, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'offeredItemId' })
  offeredItem!: Relation<Item>;

  @Column({ nullable: true })
  offeredItemId!: string;

  @ManyToOne(() => Circle, (circle) => circle.trades, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'circleId' })
  circle!: Relation<Circle>;

  @Column()
  circleId!: string;

  @Column({ default: false })
  isRatedByProposer!: boolean;

  @Column({ default: false })
  isRatedByRecipient!: boolean;

  @OneToMany(() => TradeApplication, (application) => application.trade)
  applications!: TradeApplication[];

  @OneToOne(() => Dispute, (dispute) => dispute.trade)
  dispute!: Dispute;

  @OneToMany(() => Message, (message) => message.trade)
  messages!: Message[];

  // Non-database property to hold the current user's application status
  myApplication?: TradeApplication;
}
