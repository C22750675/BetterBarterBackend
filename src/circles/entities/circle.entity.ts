import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  OneToMany,
} from 'typeorm';
import { Membership } from './membership.entity';
import type { Point } from 'geojson';

@Entity('circles')
export class Circle {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  // PostGIS specific column for geospatial data
  @Index({ spatial: true })
  @Column({
    type: 'geography',
    spatialFeatureType: 'Point',
    srid: 4326, // Standard GPS coordinates SRID
  })
  origin: Point;

  @Column({ type: 'int' }) // Radius in meters
  radius: number;

  @Column({ type: 'float', default: 5.0 })
  reputationScore: number;

  @Column({ type: 'int', default: 0 })
  minimumRepThreshold: number;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ type: 'varchar', length: 7, default: '#3498DB' }) // 7 chars for "#RRGGBB"
  color: string;

  // A circle can have many members
  @OneToMany(() => Membership, (membership) => membership.circle)
  memberships: Membership[];
}
