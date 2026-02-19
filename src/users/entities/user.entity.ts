import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { Item } from '../../items/entities/item.entity';
import { Membership } from 'src/circles/entities/membership.entity';
import { Trade } from 'src/trades/entities/trade.entity';
import { TradeApplication } from 'src/trades/entities/trade-application.entity';

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  username: string;

  @Column({ select: false }) // Hide password by default
  passwordHash: string;

  @Column({ type: 'text', nullable: true })
  bio: string;

  @Column({ nullable: true })
  profilePictureUrl: string;

  @Column({ type: 'float', default: 50 })
  reputationScore: number;

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => Item, (item) => item.owner)
  items: Item[];

  @OneToMany(() => Membership, (membership) => membership.user)
  memberships: Membership[];

  // Trades the user created (as an admin)
  @OneToMany(() => Trade, (trade) => trade.proposer)
  proposedTrades: Trade[];

  // Trades the user accepted (as a member)
  @OneToMany(() => Trade, (trade) => trade.recipient)
  receivedTrades: Trade[];

  @OneToMany(() => TradeApplication, (application) => application.applicant)
  tradeApplications: TradeApplication[];
}
