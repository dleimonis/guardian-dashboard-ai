import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './User';
import { Alert } from './Alert';
import { Disaster } from './Disaster';

export type NotificationChannel = 'sms' | 'email' | 'push' | 'webhook' | 'social';
export type NotificationStatus = 'queued' | 'sending' | 'sent' | 'delivered' | 'failed' | 'read';

@Entity('notification_history')
@Index(['channel'])
@Index(['status'])
@Index(['created_at'])
export class NotificationHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (user) => user.notifications, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'user_id' })
  user?: User;

  @Column({ nullable: true })
  user_id?: string;

  @ManyToOne(() => Alert, (alert) => alert.notifications, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'alert_id' })
  alert?: Alert;

  @Column({ nullable: true })
  alert_id?: string;

  @ManyToOne(() => Disaster, (disaster) => disaster.notifications, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'disaster_id' })
  disaster?: Disaster;

  @Column({ nullable: true })
  disaster_id?: string;

  @Column({
    type: 'enum',
    enum: ['sms', 'email', 'push', 'webhook', 'social'],
  })
  channel: NotificationChannel;

  @Column({ length: 500 })
  recipient_contact: string;

  @Column({ length: 500, nullable: true })
  subject?: string;

  @Column('text')
  message: string;

  @Column({
    type: 'enum',
    enum: ['queued', 'sending', 'sent', 'delivered', 'failed', 'read'],
    default: 'queued',
  })
  status: NotificationStatus;

  @Column({ default: 'normal' })
  priority: string;

  @Column({ default: 0 })
  attempts: number;

  @Column({ default: 3 })
  max_attempts: number;

  @Column({ type: 'timestamptz', nullable: true })
  sent_at?: Date;

  @Column({ type: 'timestamptz', nullable: true })
  delivered_at?: Date;

  @Column({ type: 'timestamptz', nullable: true })
  read_at?: Date;

  @Column({ type: 'timestamptz', nullable: true })
  failed_at?: Date;

  @Column('text', { nullable: true })
  error_message?: string;

  @Column('jsonb', { default: {} })
  metadata: Record<string, any>;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}