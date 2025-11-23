import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Unique,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Trade } from './trade.entity';

@Entity()
@Unique(['raterId', 'tradeId']) // A user can only rate a specific trade once
export class Rating {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'int' }) // e.g., 1 to 5
  score: number;

  @Column({ type: 'text', nullable: true })
  comment: string;

  @CreateDateColumn()
  createdAt: Date;

  // The user who GAVE the rating
  @ManyToOne(() => User, (user) => user.givenRatings, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'raterId' })
  rater: User;

  @Column()
  raterId: string;

  // The user who RECEIVED the rating
  @ManyToOne(() => User, (user) => user.receivedRatings, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'rateeId' })
  ratee: User;

  @Column()
  rateeId: string;

  // The trade this rating is for
  @ManyToOne(() => Trade, (trade) => trade.ratings, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tradeId' })
  trade: Trade;

  @Column()
  tradeId: string;
}
