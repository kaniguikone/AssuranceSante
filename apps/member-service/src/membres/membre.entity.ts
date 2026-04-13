import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, OneToMany, Check,
} from 'typeorm';
import { CarteTiersPay } from '../cartes/carte-tiers-pay.entity';

@Entity('membres')
export class Membre {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'numero_carte', unique: true })
  numeroCarte: string;

  @Column({ nullable: true, unique: true })
  nni: string;

  @Column({ name: 'type_document', type: 'enum', enum: ['CNI', 'PASSEPORT', 'TITRE_SEJOUR', 'PERMIS_CONDUIRE'] })
  typeDocument: string;

  @Column({ name: 'numero_document' })
  numeroDocument: string;

  @Column()
  nom: string;

  @Column()
  prenoms: string;

  @Column({ name: 'nom_phonetique', length: 10, nullable: true })
  nomPhonetique: string;

  @Column({ name: 'prenoms_phonetique', length: 10, nullable: true })
  prenomsPhonetique: string;

  @Column({ name: 'date_naissance', type: 'date' })
  dateNaissance: Date;

  @Column({ length: 1 })
  genre: string;

  @Column({ default: 'Ivoirienne' })
  nationalite: string;

  @Column()
  telephone: string;

  @Column({ name: 'telephone_secondaire', nullable: true })
  telephoneSecondaire: string;

  @Column({ nullable: true })
  email: string;

  @Column({ name: 'adresse_commune' })
  adresseCommune: string;

  @Column({ name: 'adresse_ville', default: 'Abidjan' })
  adresseVille: string;

  @Column({ name: 'adresse_quartier', nullable: true })
  adresseQuartier: string;

  @Column({ name: 'adresse_region', nullable: true })
  adresseRegion: string;

  @Column({ name: 'photo_url', nullable: true })
  photoUrl: string;

  @Column({ name: 'empreinte_hash', nullable: true })
  empreinteHash: string;

  @Column({ type: 'enum', enum: ['ACTIF', 'SUSPENDU', 'RADIE'], default: 'ACTIF' })
  statut: string;

  @Column({ name: 'contrat_id', type: 'uuid', nullable: true })
  contratId: string;

  @Column({ name: 'employeur_id', nullable: true })
  employeurId: string;

  @Column({ name: 'lien_parente', type: 'enum', enum: ['PRINCIPAL', 'CONJOINT', 'ENFANT', 'AUTRE'], default: 'PRINCIPAL' })
  lienParente: string;

  @Column({ name: 'membre_principal_id', nullable: true })
  membrePrincipalId: string;

  @Column({ name: 'date_affiliation', type: 'date', default: () => 'CURRENT_DATE' })
  dateAffiliation: Date;

  @Column({ name: 'date_fin_affiliation', type: 'date', nullable: true })
  dateFinAffiliation: Date;

  @Column({ name: 'est_etudiant', default: false })
  estEtudiant: boolean;

  @Column({ name: 'etablissement_scolaire', nullable: true })
  etablissementScolaire: string;

  @Column({ name: 'snedai_verifie', default: false })
  snedaiVerifie: boolean;

  @Column({ name: 'snedai_verifie_at', type: 'timestamptz', nullable: true })
  snedaiVerifieAt: Date;

  @OneToMany(() => CarteTiersPay, (c) => c.membre)
  cartes: CarteTiersPay[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'created_by' })
  createdBy: string;

  @Column({ name: 'updated_by', nullable: true })
  updatedBy: string;
}
