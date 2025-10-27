import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Trade } from './trade.entity';

@Entity('messages')
export class Message {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  text: string;

  @Column({ type: 'varchar', nullable: true })
  imageUrl: string;

  @CreateDateColumn()
  timestamp: Date;

  // The user who sent the message
  @ManyToOne(() => User, (user) => user.sentMessages, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'senderId' })
  sender: User;

  @Column()
  senderId: string;

  // The trade this message belongs to
  @ManyToOne(() => Trade, (trade) => trade.messages, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tradeId' })
  trade: Trade;

  @Column()
  tradeId: string;
}
