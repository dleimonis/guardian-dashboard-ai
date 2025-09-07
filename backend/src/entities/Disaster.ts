import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { Point } from 'geojson';
import { Alert } from './Alert';
import { NotificationHistory } from './NotificationHistory';

export type DisasterType = 'fire' | 'earthquake' | 'weather' | 'flood' | 'other';
export type SeverityLevel = 'low' | 'medium' | 'high' | 'critical';

@Entity('disasters')
@Index(['type'])
@Index(['severity'])
@Index(['started_at'])
@Index(['external_id'])
export class Disaster {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  external_id?: string;

  @Column({
    type: 'enum',
    enum: ['fire', 'earthquake', 'weather', 'flood', 'other'],
  })
  type: DisasterType;

  @Column({
    type: 'enum',
    enum: ['low', 'medium', 'high', 'critical'],
  })
  severity: SeverityLevel;

  @Column({ length: 500 })
  title: string;

  @Column('text', { nullable: true })
  description?: string;

  @Column('geography', {
    spatialFeatureType: 'Point',
    srid: 4326,
  })
  location: Point;

  @Column({ length: 500, nullable: true })
  location_name?: string;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  affected_radius_km?: number;

  @Column('geography', {
    spatialFeatureType: 'Polygon',
    srid: 4326,
    nullable: true,
  })
  affected_area?: any;

  @Column('jsonb', { default: {} })
  data: Record<string, any>;

  @Column({ nullable: true })
  source?: string;

  @Column({ nullable: true })
  detected_by?: string;

  @Column({ type: 'timestamptz' })
  started_at: Date;

  @Column({ type: 'timestamptz', nullable: true })
  ended_at?: Date;

  @Column({ default: false })
  is_simulation: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;

  // Relations
  @OneToMany(() => Alert, (alert) => alert.disaster)
  alerts: Alert[];

  @OneToMany(() => NotificationHistory, (notification) => notification.disaster)
  notifications: NotificationHistory[];
}