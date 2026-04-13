import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { Item } from '../../items/entities/item.entity.js';
import { Membership } from '../../circles/entities/membership.entity.js';
import { Trade } from '../../trades/entities/trade.entity.js';
import { TradeApplication } from '../../trades/entities/trade-application.entity.js';
import { ReputationLog } from '../../reputation/entities/reputation-log.entity.js';

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  username!: string;

  @Column({ select: false }) // Hide password by default
  passwordHash!: string;

  @Column({ unique: true, nullable: true })
  email!: string;

  @Column({ nullable: true })
  phoneNumber!: string;

  @Column({ default: false })
  isEmailVerified!: boolean;

  @Column({ default: false })
  isPhoneVerified!: boolean;

  @Column({ type: 'text', nullable: true })
  bio!: string;

  @Column({ nullable: true })
  profilePictureUrl!: string;

  @Column({ type: 'float', default: 50 })
  reputationScore!: number;

  @Column({ type: 'float', default: 2 })
  alpha!: number; // Cumulative Successes

  @Column({ type: 'float', default: 1 })
  beta!: number; // Cumulative Failures

  @Column({ type: 'int', default: 0 })
  tradeCount!: number; // For Engagement Component

  @Column({ type: 'float', default: 0 })
  penalties!: number; // Manual severity-based deductions

  @Column({ type: 'timestamp', nullable: true })
  lastReputationUpdate!: Date;

  @CreateDateColumn()
  createdAt!: Date;

  @OneToMany(() => Item, (item) => item.owner)
  items!: Item[];

  @OneToMany(() => Membership, (membership) => membership.user)
  memberships!: Membership[];

  // Trades the user created (as an admin)
  @OneToMany(() => Trade, (trade) => trade.proposer)
  proposedTrades!: Trade[];

  // Trades the user accepted (as a member)
  @OneToMany(() => Trade, (trade) => trade.recipient)
  receivedTrades!: Trade[];

  @OneToMany(() => TradeApplication, (application) => application.applicant)
  tradeApplications!: TradeApplication;

  @OneToMany(() => ReputationLog, (log) => log.user)
  reputationLogs!: ReputationLog;
}
