import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  Relation,
} from 'typeorm';

import { User } from './user.entity.js';
import { DisputeSeverity } from '../../trades/entities/dispute.entity.js';

export enum PenaltyType {
  NO_SHOW = 'no_show',
  LATE_RESPONSE = 'late_response',
  INACCURATE_DESCRIPTION = 'inaccurate_description',
  COMMUNICATION_VIOLATION = 'communication_violation',
  ADMIN_MANUAL = 'admin_manual',
}

@Entity()
export class Penalty {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({
    type: 'enum',
    enum: DisputeSeverity,
    default: DisputeSeverity.LOW,
  })
  severity!: DisputeSeverity;

  @Column({ type: 'text', nullable: true })
  reason!: string;

  @Column({ default: true })
  isActive!: boolean; // Allows admins to "forgive" a penalty without deleting the record

  @CreateDateColumn()
  createdAt!: Date;

  @Column({ type: 'timestamp', nullable: true })
  expiresAt!: Date; // For penalties that only impact score for a set duration

  @ManyToOne(() => User, (user) => user.penaltyHistory)
  user!: Relation<User>;

  @Column({ nullable: true })
  relatedTradeId!: string; // Reference to the specific trade that caused the penalty
}
