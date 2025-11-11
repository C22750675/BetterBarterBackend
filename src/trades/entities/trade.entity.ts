import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Item } from 'src/items/entities/item.entity';
import { Circle } from 'src/circles/entities/circle.entity';
import { TradeApplication } from './trade-application.entity';

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
  id: string;

  @Column({
    type: 'enum',
    enum: TradeStatus,
    default: TradeStatus.PENDING,
  })
  status: TradeStatus; // This is the status of the *main* trade listing

  @CreateDateColumn()
  creationDate: Date;

  @Column({ type: 'timestamp', nullable: true })
  completionDate: Date;

  @Column({ type: 'text', nullable: true })
  description: string;

  @ManyToOne(() => User, (user) => user.proposedTrades, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'proposerId' })
  proposer: User; // The admin who created the listing

  @Column()
  proposerId: string;

  @ManyToOne(() => User, (user) => user.receivedTrades, {
    onDelete: 'CASCADE',
    nullable: true,
  })
  @JoinColumn({ name: 'recipientId' })
  recipient: User; // The applicant who was *accepted*

  @Column({ nullable: true })
  recipientId: string;

  @Column()
  offeredItemQuantity: number;

  @ManyToOne(() => Item, (item) => item.trades, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'offeredItemId' })
  offeredItem: Item;

  @Column({ nullable: true })
  offeredItemId: string;

  @ManyToOne(() => Circle, (circle) => circle.trades, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'circleId' })
  circle: Circle;

  @Column()
  circleId: string;

  @OneToMany(() => TradeApplication, (application) => application.trade)
  applications: TradeApplication[];
}
