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

  @Column({ name: 'est_actif', default: true })
  estActif: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
