import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, OneToMany,
} from 'typeorm';
import { UserRoleEntity as UserRole } from '../roles/user-role.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'keycloak_id', unique: true })
  keycloakId: string;

  @Column({ unique: true })
  email: string;

  @Column()
  nom: string;

  @Column()
  prenoms: string;

  @Column({ nullable: true })
  telephone: string;

  @Column({ name: 'password_hash', nullable: true })
  passwordHash: string;

  @Column({ name: 'est_actif', default: true })
  estActif: boolean;

  @Column({ name: 'mfa_active', default: false })
  mfaActive: boolean;

  @Column({ name: 'derniere_connexion', type: 'timestamptz', nullable: true })
  derniereConnexion: Date;

  @OneToMany(() => UserRole, (role) => role.user, { eager: true, cascade: true })
  userRoles: UserRole[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'created_by', nullable: true })
  createdBy: string;

  get roles(): string[] {
    return this.userRoles?.filter(r => !r.revokedAt).map(r => r.role) ?? [];
  }
}
