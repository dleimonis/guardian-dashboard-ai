import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
} from 'typeorm';

@Entity('system_statistics')
@Index(['metric_name'])
@Index(['timestamp'])
export class SystemStatistics {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  metric_name: string;

  @Column('decimal', { nullable: true })
  metric_value?: number;

  @Column('jsonb', { default: {} })
  metric_data: Record<string, any>;

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  timestamp: Date;
}