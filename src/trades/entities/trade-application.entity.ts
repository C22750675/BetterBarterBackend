import { User } from 'src/users/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Trade } from './trade.entity';

export enum TradeApplicationStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
}

@Entity()
export class TradeApplication {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (user) => user.tradeApplications, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'applicantId' })
  applicant: User;

  @Column()
  applicantId: string;

  @ManyToOne(() => Trade, (trade) => trade.applications, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'tradeId' })
  trade: Trade;

  @Column()
  tradeId: string;

  @Column({ type: 'text', nullable: true })
  message: string; // Applicant's message (e.g., "I have jam!")

  @Column({
    type: 'enum',
    enum: TradeApplicationStatus,
    default: TradeApplicationStatus.PENDING,
  })
  status: TradeApplicationStatus;

  @CreateDateColumn()
  createdAt: Date;
}
