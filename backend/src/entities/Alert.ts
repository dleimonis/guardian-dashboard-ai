import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { Point } from 'geojson';
import { Disaster, SeverityLevel } from './Disaster';
import { User } from './User';
import { NotificationHistory } from './NotificationHistory';

export type AlertStatus = 'active' | 'acknowledged' | 'resolved' | 'expired';

@Entity('alerts')
@Index(['severity'])
@Index(['status'])
@Index(['created_at'])
@Index(['expires_at'])
export class Alert {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Disaster, (disaster) => disaster.alerts, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'disaster_id' })
  disaster: Disaster;

  @Column({ nullable: true })
  disaster_id?: string;

  @Column({ length: 500 })
  title: string;

  @Column('text', { nullable: true })
  description?: string;

  @Column({
    type: 'enum',
    enum: ['low', 'medium', 'high', 'critical'],
  })
  severity: SeverityLevel;

  @Column({
    type: 'enum',
    enum: ['active', 'acknowledged', 'resolved', 'expired'],
    default: 'active',
  })
  status: AlertStatus;

  @Column('geography', {
    spatialFeatureType: 'Point',
    srid: 4326,
    nullable: true,
  })
  location?: Point;

  @Column({ length: 500, nullable: true })
  location_name?: string;

  @Column('uuid', { array: true, nullable: true })
  affected_zones?: string[];

  @Column('jsonb', { default: {} })
  metadata: Record<string, any>;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'acknowledged_by' })
  acknowledged_by_user?: User;

  @Column({ nullable: true })
  acknowledged_by?: string;

  @Column({ type: 'timestamptz', nullable: true })
  acknowledged_at?: Date;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'resolved_by' })
  resolved_by_user?: User;

  @Column({ nullable: true })
  resolved_by?: string;

  @Column({ type: 'timestamptz', nullable: true })
  resolved_at?: Date;

  @Column({ type: 'timestamptz', nullable: true })
  expires_at?: Date;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;

  // Relations
  @OneToMany(() => NotificationHistory, (notification) => notification.alert)
  notifications: NotificationHistory[];
}