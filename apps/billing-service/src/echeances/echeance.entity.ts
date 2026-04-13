import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
} from 'typeorm';

@Entity('echeances')
export class Echeance {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'contrat_id' })
  contratId: string;

  @Column({ name: 'membre_id' })
  membreId: string;

  @Column({ unique: true })
  numero: string;

  @Column({ length: 7 })
  periode: string;

  @Column({ name: 'montant_du', type: 'bigint' })
  montantDu: number;

  @Column({ name: 'montant_paye', type: 'bigint', default: 0 })
  montantPaye: number;

  @Column({ name: 'date_echeance', type: 'date' })
  dateEcheance: Date;

  @Column({ name: 'date_limite_paiement', type: 'date' })
  dateLimitePaiement: Date;

  @Column({ name: 'date_paiement', type: 'timestamptz', nullable: true })
  datePaiement: Date;

  @Column({ type: 'enum', enum: ['EN_ATTENTE', 'PAYE', 'EN_RETARD', 'EN_GRACE', 'IMPAYE', 'ANNULE'], default: 'EN_ATTENTE' })
  statut: string;

  @Column({ name: 'statut_relance', nullable: true })
  statutRelance: string;

  @Column({ name: 'nombre_relances', type: 'smallint', default: 0 })
  nombreRelances: number;

  @Column({ name: 'prochaine_relance_at', type: 'timestamptz', nullable: true })
  prochaineRelanceAt: Date;

  @Column({ name: 'penalite_retard', type: 'bigint', default: 0 })
  penaliteRetard: number;

  @Column({ name: 'transaction_id', nullable: true })
  transactionId: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
