import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, OneToMany, Check,
} from 'typeorm';
import { Avenant } from '../avenants/avenant.entity';

@Entity('contrats')
@Check(`"date_effet" >= ("date_souscription" - INTERVAL '30 days')`)
export class Contrat {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  numero: string;

  @Column({ type: 'enum', enum: ['INDIVIDUEL', 'FAMILLE', 'COLLECTIF', 'ENTREPRISE'] })
  type: string;

  @Column({
    type: 'enum',
    enum: ['EN_ATTENTE', 'ACTIF', 'SUSPENDU', 'RESILIE', 'EXPIRE', 'EN_COURS_RESILIATION'],
    default: 'EN_ATTENTE',
  })
  statut: string;

  @Column({ name: 'souscripteur_id', nullable: true })
  souscripteurId: string;

  @Column({ name: 'employeur_id', nullable: true })
  employeurId: string;

  @Column({ name: 'produit_id' })
  produitId: string;

  @Column({ type: 'enum', enum: ['BRONZE', 'ARGENT', 'OR', 'PLATINE'] })
  formule: string;

  // Paramètres garantie (snapshot)
  @Column({ type: 'bigint' })
  franchise: number;

  @Column({ name: 'plafond_annuel', type: 'bigint' })
  plafondAnnuel: number;

  @Column({ name: 'taux_remboursement', type: 'smallint' })
  tauxRemboursement: number;

  @Column({ name: 'co_paiement', type: 'smallint' })
  coPaiement: number;

  @Column({ name: 'plafond_hospitalisation', type: 'bigint', nullable: true })
  plafondHospitalisation: number;

  @Column({ name: 'plafond_dentaire', type: 'bigint', nullable: true })
  plafondDentaire: number;

  @Column({ name: 'plafond_optique', type: 'bigint', nullable: true })
  plafondOptique: number;

  // Dates
  @Column({ name: 'date_souscription', type: 'date', default: () => 'CURRENT_DATE' })
  dateSouscription: Date;

  @Column({ name: 'date_effet', type: 'date' })
  dateEffet: Date;

  @Column({ name: 'date_echeance', type: 'date' })
  dateEcheance: Date;

  @Column({ name: 'date_suspension', type: 'timestamptz', nullable: true })
  dateSuspension: Date | undefined;

  @Column({ name: 'date_resiliation', type: 'timestamptz', nullable: true })
  dateResiliation: Date;

  @Column({ name: 'motif_resiliation', nullable: true })
  motifResiliation: string;

  // Financier
  @Column({ name: 'prime_annuelle', type: 'bigint' })
  primeAnnuelle: number;

  @Column({ name: 'prime_mensuelle', type: 'bigint' })
  primeMensuelle: number;

  // Documents
  @Column({ name: 'document_contrat_url', nullable: true })
  documentContratUrl: string;

  @Column({ name: 'signature_hash', nullable: true })
  signatureHash: string;

  @Column({ name: 'est_renouvellement_auto', default: true })
  estRenouvellementAuto: boolean;

  @Column({ name: 'nombre_adherents_min', type: 'smallint', nullable: true })
  nombreAdherentsMin: number;

  @OneToMany(() => Avenant, (a) => a.contrat)
  avenants: Avenant[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'created_by' })
  createdBy: string;

  @Column({ name: 'updated_by', nullable: true })
  updatedBy: string;
}
