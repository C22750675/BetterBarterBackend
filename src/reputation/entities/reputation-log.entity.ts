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

export enum ReputationChangeType {
  SUCCESS = 'SUCCESS',
  FAILURE = 'FAILURE',
  PENALTY = 'PENALTY',
  DECAY = 'DECAY',
}

@Entity('reputation_logs')
export class ReputationLog {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  userId!: string;

  @ManyToOne(() => User, (user) => user.reputationLogs, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: Relation<User>;

  @Column({ type: 'enum', enum: ReputationChangeType })
  changeType!: ReputationChangeType;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  resultingScore!: number;

  @Column({ type: 'float', nullable: true })
  alphaSnapshot!: number;

  @Column({ type: 'float', nullable: true })
  betaSnapshot!: number;

  @CreateDateColumn()
  timestamp!: Date;

  @Column({ nullable: true })
  reason!: string;
}
