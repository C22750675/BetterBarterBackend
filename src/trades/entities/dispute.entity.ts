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

@Entity('disputes')
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

  @CreateDateColumn()
  createdAt: Date;

  // A dispute is always linked to one trade
  @OneToOne(() => Trade, (trade) => trade.dispute, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tradeId' })
  trade: Trade;

  @Column({ unique: true })
  tradeId: string;
}
