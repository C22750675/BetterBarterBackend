import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import type { Point } from 'geojson';
import { Membership } from './membership.entity';
import { Item } from 'src/items/entities/item.entity';
import { User } from 'src/users/entities/user.entity';
import { Expose } from 'class-transformer';

@Entity()
export class Circle {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'geography',
    spatialFeatureType: 'Point',
    srid: 4326,
  })
  origin: Point;

  @Column()
  radius: number; // in meters

  @Column({ default: 5.0 })
  reputationScore: number;

  @Column({ default: 0 })
  minimumRepThreshold: number;

  @Column({ type: 'varchar', length: 7, default: '#3498DB' })
  color: string;

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => Membership, (membership) => membership.circle)
  memberships: Membership[];

  // A circle can have many items posted to it
  @OneToMany(() => Item, (item) => item.circle)
  items: Item[];

  @Expose() // Make this available in the JSON response
  get admins(): User[] | undefined {
    // If memberships haven't been loaded, return undefined
    if (!this.memberships) {
      return undefined;
    }
    // Filter memberships for 'admin' role and return the associated user
    return this.memberships
      .filter((membership) => membership.isAdmin === true)
      .map((membership) => membership.user);
  }
}
