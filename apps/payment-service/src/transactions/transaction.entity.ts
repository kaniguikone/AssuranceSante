import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
} from 'typeorm';

@Entity('transactions')
export class Transaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  reference: string;

  @Column({ name: 'reference_operateur', nullable: true })
  referenceOperateur: string;

  @Column({ type: 'enum', enum: ['COTISATION', 'REMBOURSEMENT', 'PAIEMENT_PRESTATAIRE', 'REMISE_COMMERCIALE'] })
  type: string;

  @Column({ type: 'enum', enum: ['ORANGE_MONEY', 'MTN_MOMO', 'WAVE', 'MOOV_MONEY', 'VIREMENT_BANCAIRE', 'ESPECES'] })
  operateur: string;

  @Column({ type: 'bigint' })
  montant: number;

  @Column({ type: 'bigint', default: 0 })
  frais: number;

  @Column({ name: 'montant_net', type: 'bigint' })
  montantNet: number;

  @Column({ default: 'XOF' })
  devise: string;

  @Column({
    type: 'enum',
    enum: ['INITIEE', 'EN_ATTENTE', 'CONFIRMEE', 'ECHOUEE', 'ANNULEE', 'REMBOURSEE'],
    default: 'INITIEE',
  })
  statut: string;

  @Column({ name: 'payeur_id', nullable: true })
  payeurId: string;

  @Column({ name: 'beneficiaire_id', nullable: true })
  beneficiaireId: string;

  @Column({ name: 'echeance_id', nullable: true })
  echeanceId: string;

  @Column({ name: 'sinistre_id', nullable: true })
  sinistreId: string;

  @Column({ name: 'numerotelephone', nullable: true })
  numerotelephone: string;

  @Column({ name: 'iban_beneficiaire', nullable: true })
  ibanBeneficiaire: string;

  @Column({ type: 'jsonb', nullable: true })
  metadonnees: Record<string, unknown>;

  @Column({ name: 'webhook_recu', default: false })
  webhookRecu: boolean;

  @Column({ name: 'webhook_data', type: 'jsonb', nullable: true })
  webhookData: Record<string, unknown>;

  @Column({ name: 'webhook_at', type: 'timestamptz', nullable: true })
  webhookAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
