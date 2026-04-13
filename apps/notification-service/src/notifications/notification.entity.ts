import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
} from 'typeorm';

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'destinataire_id' })
  destinataireId: string;

  @Column({ type: 'enum', enum: ['SMS', 'EMAIL', 'PUSH', 'WHATSAPP', 'COURRIER'] })
  canal: string;

  @Column({ type: 'enum', enum: [
    'BIENVENUE', 'RAPPEL_ECHEANCE', 'SUSPENSION', 'REACTIVATION', 'RESILIATION', 'RENOUVELLEMENT',
    'SINISTRE_RECU', 'SINISTRE_APPROUVE', 'SINISTRE_REJETE', 'REMBOURSEMENT_EFFECTUE',
    'PAIEMENT_CONFIRME', 'PAIEMENT_ECHOUE', 'RELANCE_PAIEMENT', 'MISE_EN_DEMEURE',
    'RAPPEL_VACCINATION', 'RAPPEL_BILAN_SANTE', 'CAMPAGNE_SANTE',
  ]})
  type: string;

  @Column({ type: 'enum', enum: ['EN_ATTENTE', 'ENVOYEE', 'ECHEC', 'LUE'], default: 'EN_ATTENTE' })
  statut: string;

  @Column({ nullable: true })
  sujet: string;

  @Column({ type: 'text' })
  corps: string;

  @Column({ nullable: true })
  telephone: string;

  @Column({ nullable: true })
  email: string;

  @Column({ default: 0 })
  tentatives: number;

  @Column({ name: 'prochaine_relance', type: 'timestamptz', nullable: true })
  prochaine_relance: Date;

  @Column({ name: 'envoyee_at', type: 'timestamptz', nullable: true })
  envoyeeAt: Date;

  @Column({ name: 'cout_fcfa', nullable: true })
  coutFcfa: number;

  @Column({ name: 'reference_externe', nullable: true })
  referenceExterne: string;

  @Column({ type: 'jsonb', nullable: true })
  metadonnees: Record<string, unknown>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
