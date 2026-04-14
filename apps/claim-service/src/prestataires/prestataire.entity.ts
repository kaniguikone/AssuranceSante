import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
} from 'typeorm';

export enum TypePrestataire {
  HOPITAL = 'HOPITAL',
  CLINIQUE = 'CLINIQUE',
  PHARMACIE = 'PHARMACIE',
  CABINET_MEDICAL = 'CABINET_MEDICAL',
  LABORATOIRE = 'LABORATOIRE',
  OPTICIEN = 'OPTICIEN',
  AUTRE = 'AUTRE',
}

@Entity('prestataires')
export class Prestataire {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  nom: string;

  @Column({ type: 'enum', enum: TypePrestataire, default: TypePrestataire.CLINIQUE })
  type: TypePrestataire;

  @Column({ type: 'varchar', nullable: true })
  adresse: string | null;

  @Column({ type: 'varchar', nullable: true })
  ville: string | null;

  @Column({ type: 'varchar', nullable: true })
  telephone: string | null;

  @Column({ type: 'varchar', nullable: true })
  email: string | null;

  @Column({ type: 'text', array: true, default: [] })
  specialites: string[];

  @Column({ name: 'convention_active', default: false })
  conventionActive: boolean;

  @Column({ name: 'numero_convention', type: 'varchar', nullable: true })
  numeroConvention: string | null;

  @Column({ name: 'taux_convention', type: 'smallint', nullable: true })
  tauxConvention: number | null;

  @Column({ name: 'tarif_consultation', type: 'int', nullable: true })
  tarifConsultation: number | null;

  @Column({ name: 'tarif_hospitalisation', type: 'int', nullable: true })
  tarifHospitalisation: number | null;

  @Column({ name: 'est_actif', default: true })
  estActif: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
