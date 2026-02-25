import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { Trade } from './trade.entity';

export enum DisputeStatus {
  OPEN = 'open',
  RESOLVED = 'resolved',
}

export enum DisputeSeverity {
  LOW = 'low', // e.g., Late arrival, minor communication issue
  MEDIUM = 'medium', // e.g., Item not exactly as described
  HIGH = 'high', // e.g., Fraud, No-show, Item completely wrong/broken
}

@Entity()
export class Dispute {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  description: string;

  @Column({
    type: 'enum',
    enum: DisputeStatus,
    default: DisputeStatus.OPEN,
  })
  status: DisputeStatus;

  // New fields for Reputation System
  @Column({ nullable: true })
  culpritId: string; // The User ID found responsible for the dispute

  @Column({
    type: 'enum',
    enum: DisputeSeverity,
    nullable: true,
  })
  severity: DisputeSeverity;

  @Column({ type: 'timestamp', nullable: true })
  resolvedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  // A dispute is always linked to one trade
  @OneToOne(() => Trade, (trade) => trade.dispute, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tradeId' })
  trade: Trade;

  @Column({ unique: true })
  tradeId: string;
}
