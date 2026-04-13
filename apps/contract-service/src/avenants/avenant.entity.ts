import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, ManyToOne, JoinColumn,
} from 'typeorm';
import { Contrat } from '../contracts/contrat.entity';

@Entity('avenants')
export class Avenant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Contrat, (c) => c.avenants)
  @JoinColumn({ name: 'contrat_id' })
  contrat: Contrat;

  @Column({ name: 'contrat_id' })
  contratId: string;

  @Column({ unique: true })
  numero: string;

  @Column({
    type: 'enum',
    enum: ['CHANGEMENT_FORMULE', 'AJOUT_BENEFICIAIRE', 'RETRAIT_BENEFICIAIRE',
      'CHANGEMENT_COORDONNEES', 'MODIFICATION_FRANCHISE', 'AUTRE'],
  })
  type: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ name: 'date_effet', type: 'date' })
  dateEffet: Date;

  @Column({ name: 'prime_avant', type: 'bigint' })
  primeAvant: number;

  @Column({ name: 'prime_apres', type: 'bigint' })
  primeApres: number;

  @Column({ name: 'validation_requise', default: false })
  validationRequise: boolean;

  @Column({ name: 'valide_par', nullable: true })
  validePar: string;

  @Column({ name: 'valide_par_2', nullable: true })
  validePar2: string;

  @Column({ name: 'valide_at', type: 'timestamptz', nullable: true })
  valideAt: Date;

  @Column({ name: 'document_url', nullable: true })
  documentUrl: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'created_by' })
  createdBy: string;
}
