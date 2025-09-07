import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { AlertZone } from './AlertZone';
import { NotificationHistory } from './NotificationHistory';
import { ApiKey } from './ApiKey';

export interface NotificationPreferences {
  channels: string[];
  severity_threshold: 'low' | 'medium' | 'high' | 'critical';
  quiet_hours?: { start: string; end: string } | null;
  language: string;
}

@Entity('users')
@Index(['descope_id'])
@Index(['email'])
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  descope_id: string;

  @Column({ unique: true })
  email: string;

  @Column({ nullable: true })
  name?: string;

  @Column({ nullable: true })
  phone?: string;

  @Column('text', { array: true, default: ['user'] })
  roles: string[];

  @Column('jsonb', { default: {} })
  preferences: Record<string, any>;

  @Column('jsonb', {
    default: {
      channels: ['email'],
      severity_threshold: 'high',
      quiet_hours: null,
      language: 'en',
    },
  })
  notification_preferences: NotificationPreferences;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;

  @Column({ type: 'timestamptz', nullable: true })
  last_login_at?: Date;

  @Column({ default: true })
  is_active: boolean;

  // Relations
  @OneToMany(() => AlertZone, (zone) => zone.user)
  alert_zones: AlertZone[];

  @OneToMany(() => NotificationHistory, (notification) => notification.user)
  notifications: NotificationHistory[];

  @OneToMany(() => ApiKey, (apiKey) => apiKey.user)
  api_keys: ApiKey[];
}