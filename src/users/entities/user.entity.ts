import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Item } from 'src/items/entities/item.entity';
import { Membership } from '../../circles/entities/membership.entity';
import { Trade } from '../../trades/entities/trade.entity';
import { Rating } from '../../trades/entities/rating.entity';
import { Message } from '../../trades/entities/message.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  username: string;

  @Column({ type: 'varchar' })
  passwordHash: string;

  @Column({ type: 'text', nullable: true })
  bio: string;

  @Column({ type: 'varchar', nullable: true })
  profilePictureUrl: string;

  @Column({ type: 'float', default: 5.0 })
  reputationScore: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // A user can own many items
  @OneToMany(() => Item, (item) => item.owner)
  items: Item[];

  // A user can have many memberships to different circles
  @OneToMany(() => Membership, (membership) => membership.user)
  memberships: Membership[];

  // A user can propose many trades
  @OneToMany(() => Trade, (trade) => trade.proposer)
  proposedTrades: Trade[];

  // A user can be the recipient of many trades
  @OneToMany(() => Trade, (trade) => trade.recipient)
  receivedTrades: Trade[];

  // A user can give many ratings
  @OneToMany(() => Rating, (rating) => rating.rater)
  givenRatings: Rating[];

  // A user can receive many ratings
  @OneToMany(() => Rating, (rating) => rating.ratee)
  receivedRatings: Rating[];

  // A user can send many messages
  @OneToMany(() => Message, (message) => message.sender)
  sentMessages: Message[];
}
