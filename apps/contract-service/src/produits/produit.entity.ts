import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
} from 'typeorm';

@Entity('produits')
export class Produit {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: ['BRONZE', 'ARGENT', 'OR', 'PLATINE'] })
  formule: string;

  @Column()
  nom: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'bigint', default: 0 })
  franchise: number;

  @Column({ name: 'plafond_annuel', type: 'bigint' })
  plafondAnnuel: number;

  @Column({ name: 'taux_remboursement', type: 'smallint' })
  tauxRemboursement: number;

  @Column({ name: 'co_paiement', type: 'smallint', default: 0 })
  coPaiement: number;

  @Column({ name: 'plafond_hospitalisation', type: 'bigint', nullable: true })
  plafondHospitalisation: number;

  @Column({ name: 'plafond_dentaire', type: 'bigint', nullable: true })
  plafondDentaire: number;

  @Column({ name: 'plafond_optique', type: 'bigint', nullable: true })
  plafondOptique: number;

  // Prime mensuelle de base (sera remplacé par barème billing-service)
  @Column({ name: 'prime_mensuelle_base', type: 'bigint', default: 0 })
  primeMensuelleBase: number;

  @Column({ name: 'est_actif', default: true })
  estActif: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
