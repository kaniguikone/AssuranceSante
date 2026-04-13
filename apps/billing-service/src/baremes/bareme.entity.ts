import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
} from 'typeorm';

@Entity('baremes_cotisation')
export class Bareme {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  formule: string;

  @Column({ name: 'age_min', type: 'smallint' })
  ageMin: number;

  @Column({ name: 'age_max', type: 'smallint' })
  ageMax: number;

  @Column({ length: 1, nullable: true })
  genre: string;

  @Column({ nullable: true })
  region: string;

  @Column({ name: 'prime_mensuelle_base', type: 'bigint' })
  primeMensuelleBase: number;

  @Column({ name: 'coefficient_profession', type: 'decimal', precision: 4, scale: 2, default: 1.00 })
  coefficientProfession: number;

  @Column({ name: 'coefficient_antecedents', type: 'decimal', precision: 4, scale: 2, default: 1.00 })
  coefficientAntecedents: number;

  @Column({ name: 'valable_depuis', type: 'date' })
  valableDepuis: Date;

  @Column({ name: 'valable_jusqu', type: 'date', nullable: true })
  valableJusqu: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
