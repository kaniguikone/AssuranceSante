import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import { User } from './user.entity';
import { UserRoleEntity } from '../roles/user-role.entity';

@Injectable()
export class SeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(UserRoleEntity)
    private readonly roleRepo: Repository<UserRoleEntity>,
  ) {}

  async onApplicationBootstrap() {
    await this.seedAdminUser();
    await this.fixUsersWithoutPassword();
  }

  /** Crée l'utilisateur admin par défaut s'il n'existe pas encore */
  private async seedAdminUser() {
    const existing = await this.userRepo.findOne({ where: { email: 'admin@sante-ci.ci' } });
    if (existing) {
      // Si l'admin existe mais sans mot de passe, lui en attribuer un
      if (!existing.passwordHash) {
        const passwordHash = await bcrypt.hash('admin123', 10);
        await this.userRepo.update(existing.id, { passwordHash });
        this.logger.log('Mot de passe admin initialisé (admin123)');
      }
      return;
    }

    const passwordHash = await bcrypt.hash('admin123', 10);
    const admin = this.userRepo.create({
      keycloakId: randomUUID(),
      email: 'admin@sante-ci.ci',
      nom: 'Admin',
      prenoms: 'Super',
      passwordHash,
      createdBy: 'seed',
    });
    const saved = await this.userRepo.save(admin);
    await this.roleRepo.save(
      this.roleRepo.create({ userId: saved.id, role: 'ADMIN', grantedBy: 'seed' }),
    );
    this.logger.log('Utilisateur admin créé: admin@sante-ci.ci / admin123');
  }

  /** Attribue un mot de passe temporaire aux comptes sans passwordHash */
  private async fixUsersWithoutPassword() {
    const users = await this.userRepo.find();
    const withoutPwd = users.filter(u => !u.passwordHash);
    if (!withoutPwd.length) return;

    const defaultHash = await bcrypt.hash('Changeme123!', 10);
    for (const u of withoutPwd) {
      await this.userRepo.update(u.id, { passwordHash: defaultHash });
    }
    this.logger.warn(
      `${withoutPwd.length} compte(s) sans mot de passe → mot de passe temporaire défini: "Changeme123!" (emails: ${withoutPwd.map(u => u.email).join(', ')})`,
    );
  }
}
