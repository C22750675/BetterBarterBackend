import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Circle } from './circle.entity';

@Entity('rules')
export class Rule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  description: string;

  @ManyToOne(() => Circle, (circle) => circle.rules, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'circleId' })
  circle: Circle;

  @Column()
  circleId: string;
}
