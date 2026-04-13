import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn,
} from 'typeorm';
import { Membre } from '../membres/membre.entity';

@Entity('cartes_tiers_payant')
export class CarteTiersPay {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Membre, (m) => m.cartes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'membre_id' })
  membre: Membre;

  @Column({ name: 'membre_id' })
  membreId: string;

  @Column({ unique: true })
  numero: string;

  @Column({ name: 'qr_code_data', type: 'text' })
  qrCodeData: string;

  @Column({ name: 'nfc_token', nullable: true })
  nfcToken: string;

  @Column({ name: 'code_pin_hash' })
  codePinHash: string;

  @Column({ name: 'date_emission', type: 'date', default: () => 'CURRENT_DATE' })
  dateEmission: Date;

  @Column({ name: 'date_expiration', type: 'date' })
  dateExpiration: Date;

  @Column({ name: 'est_active', default: true })
  estActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
