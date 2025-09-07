import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
} from 'typeorm';

export type AgentStatus = 'online' | 'warning' | 'offline' | 'error';

@Entity('agent_logs')
@Index(['agent_name'])
@Index(['status'])
@Index(['timestamp'])
export class AgentLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  agent_name: string;

  @Column({ nullable: true })
  agent_type?: string;

  @Column({
    type: 'enum',
    enum: ['online', 'warning', 'offline', 'error'],
  })
  status: AgentStatus;

  @Column('text', { nullable: true })
  message?: string;

  @Column('jsonb', { default: {} })
  metrics: Record<string, any>;

  @Column('jsonb', { default: {} })
  activity_data: Record<string, any>;

  @Column('text', { nullable: true })
  error_details?: string;

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  timestamp: Date;
}