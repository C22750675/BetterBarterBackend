import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Relation,
} from 'typeorm';
import { User } from '../../users/entities/user.entity.js';
import { Trade } from './trade.entity.js';

@Entity()
export class Message {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'text' })
  text!: string;

  @Column({ type: 'varchar', nullable: true })
  imageUrl!: string;

  @CreateDateColumn()
  timestamp!: Date;

  // The user who sent the message
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'senderId' })
  sender!: Relation<User>;

  @Column()
  senderId!: string;

  // The trade this message belongs to
  @ManyToOne(() => Trade, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tradeId' })
  trade!: Relation<Trade>;

  @Column()
  tradeId!: string;
}
