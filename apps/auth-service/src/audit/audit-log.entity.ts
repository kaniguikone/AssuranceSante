import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn,
} from 'typeorm';
import { User } from '../users/user.entity';

@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', nullable: true })
  userId: string;

  @Column()
  action: string;

  @Column()
  ressource: string;

  @Column({ name: 'ressource_id', nullable: true })
  ressourceId: string;

  @Column({ name: 'donnees_avant', type: 'jsonb', nullable: true })
  donneesAvant: Record<string, unknown>;

  @Column({ name: 'donnees_apres', type: 'jsonb', nullable: true })
  donneesApres: Record<string, unknown>;

  @Column({ name: 'ip_address', type: 'inet', nullable: true })
  ipAddress: string;

  @Column({ name: 'user_agent', nullable: true })
  userAgent: string;

  @Column({ default: 'SUCCESS' })
  statut: 'SUCCESS' | 'FAILURE';

  @Column({ name: 'message_erreur', nullable: true })
  messageErreur: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
