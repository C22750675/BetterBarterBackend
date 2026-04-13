import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Unique,
  Relation,
} from 'typeorm';
import { User } from '../../users/entities/user.entity.js';
import { Circle } from './circle.entity.js';

@Entity()
@Unique(['userId', 'circleId']) // A user can only join a circle once
export class Membership {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ default: false })
  isAdmin: boolean;

  @CreateDateColumn()
  joinDate: Date;

  @ManyToOne(() => User, (user) => user.memberships, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: string;

  @ManyToOne(() => Circle, (circle) => circle.memberships, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'circleId' })
  circle: Circle;

  @Column()
  circleId: string;
}
