import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Polygon } from 'geojson';
import { User } from './User';
import { DisasterType, SeverityLevel } from './Disaster';

@Entity('alert_zones')
@Index(['is_active'])
export class AlertZone {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (user) => user.alert_zones, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column()
  user_id: string;

  @Column()
  name: string;

  @Column('text', { nullable: true })
  description?: string;

  @Column('geography', {
    spatialFeatureType: 'Polygon',
    srid: 4326,
  })
  zone_polygon: Polygon;

  @Column('text', { array: true, nullable: true })
  disaster_types?: DisasterType[];

  @Column({
    type: 'enum',
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium',
  })
  severity_threshold: SeverityLevel;

  @Column({ default: true })
  is_active: boolean;

  @Column('jsonb', { default: {} })
  metadata: Record<string, any>;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}