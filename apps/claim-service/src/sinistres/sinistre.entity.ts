import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
} from 'typeorm';

@Entity('sinistres')
export class Sinistre {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  numero: string;

  @Column({ name: 'contrat_id' })
  contratId: string;

  @Column({ name: 'membre_id' })
  membreId: string;

  @Column({ name: 'prestataire_id' })
  prestataireId: string;

  @Column({ name: 'type_soin', type: 'enum', enum: [
    'SOINS_AMBULATOIRES', 'MEDICAMENTS', 'HOSPITALISATION_PLANIFIEE',
    'HOSPITALISATION_URGENCE', 'ACTES_DENTAIRES', 'OPTIQUE', 'ANALYSES', 'RADIOLOGIE',
  ]})
  typeSoin: string;

  @Column({ type: 'enum', enum: [
    'RECU', 'EN_VERIFICATION', 'EN_VALIDATION_MEDICALE',
    'APPROUVE', 'REJETE', 'EN_LIQUIDATION', 'PAYE', 'CONTESTE', 'FRAUDE_SUSPECTEE',
  ], default: 'RECU' })
  statut: string;

  @Column({ name: 'mode_depot', type: 'enum', enum: ['SCAN', 'PHOTO', 'SAISIE_MANUELLE', 'TIERS_PAYANT'] })
  modeDepot: string;

  @Column({ name: 'date_soin', type: 'date' })
  dateSoin: Date;

  @Column({ name: 'date_limite_traitement', type: 'timestamptz' })
  dateLimiteTraitement: Date;

  @Column({ name: 'montant_reclame', type: 'bigint' })
  montantReclame: number;

  @Column({ name: 'montant_base', type: 'bigint', default: 0 })
  montantBase: number;

  @Column({ name: 'montant_franchise', type: 'bigint', default: 0 })
  montantFranchise: number;

  @Column({ name: 'montant_rembourse', type: 'bigint', default: 0 })
  montantRembourse: number;

  @Column({ name: 'montant_co_paiement', type: 'bigint', default: 0 })
  montantCoPaiement: number;

  @Column({ name: 'penalite_retard', type: 'bigint', default: 0 })
  penaliteRetard: number;

  @Column({ name: 'score_fraude', type: 'smallint', nullable: true })
  scoreFraude: number;

  @Column({ name: 'niveau_suspicion', nullable: true })
  niveauSuspicion: string;

  @Column({ name: 'commentaires_medecin', type: 'text', nullable: true })
  commentairesMedecin: string;

  @Column({ name: 'motif_rejet', nullable: true })
  motifRejet: string;

  @Column({ name: 'valide_par', nullable: true })
  validePar: string;

  @Column({ name: 'valide_at', type: 'timestamptz', nullable: true })
  valideAt: Date;

  @Column({ name: 'transaction_id', nullable: true })
  transactionId: string;

  @Column({ name: 'document_urls', type: 'text', array: true, default: [] })
  documentUrls: string[];

  @Column({ name: 'ocr_extracted', type: 'jsonb', nullable: true })
  ocrExtracted: Record<string, unknown>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'created_by' })
  createdBy: string;

  @Column({ name: 'updated_by', nullable: true })
  updatedBy: string;
}
