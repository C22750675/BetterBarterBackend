import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToOne,
  OneToMany,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Dispute } from './dispute.entity';
import { Rating } from './rating.entity';
import { Message } from './message.entity';

export enum TradeStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  COMPLETED = 'completed',
  DISPUTED = 'disputed',
}

@Entity('trades')
export class Trade {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: TradeStatus,
    default: TradeStatus.PENDING,
  })
  status: TradeStatus;

  @CreateDateColumn()
  creationDate: Date;

  @Column({ type: 'timestamp', nullable: true })
  completionDate: Date;

  @ManyToOne(() => User, (user) => user.proposedTrades, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'proposerId' })
  proposer: User;

  @Column()
  proposerId: string;

  @ManyToOne(() => User, (user) => user.receivedTrades, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'recipientId' })
  recipient: User;

  @Column()
  recipientId: string;

  // A trade can have a dispute
  @OneToOne(() => Dispute, (dispute) => dispute.trade)
  dispute: Dispute;

  // A trade can have ratings (one from each party)
  @OneToMany(() => Rating, (rating) => rating.trade)
  ratings: Rating[];

  // A trade has a message thread
  @OneToMany(() => Message, (message) => message.trade, { cascade: true })
  messages: Message[];
}
