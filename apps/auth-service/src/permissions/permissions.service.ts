import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MenuPermission } from './menu-permission.entity';

// Menus par défaut avec droits initiaux
const DEFAULT_PERMISSIONS = [
  { menuPath: '/dashboard',   menuLabel: 'Tableau de bord',   allowedRoles: [], sortOrder: 1 },
  { menuPath: '/membres',     menuLabel: 'Membres',           allowedRoles: [], sortOrder: 2 },
  { menuPath: '/contrats',    menuLabel: 'Contrats',          allowedRoles: [], sortOrder: 3 },
  { menuPath: '/sinistres',   menuLabel: 'Sinistres',         allowedRoles: [], sortOrder: 4 },
  { menuPath: '/prestataires',menuLabel: 'Prestataires',      allowedRoles: ['ADMIN','GESTIONNAIRE','MEDECIN_CONSEIL'], sortOrder: 5 },
  { menuPath: '/produits',    menuLabel: 'Produits',          allowedRoles: ['ADMIN','GESTIONNAIRE','MEDECIN_CONSEIL','AUDITEUR'], sortOrder: 6 },
  { menuPath: '/utilisateurs',menuLabel: 'Utilisateurs',      allowedRoles: ['ADMIN'], sortOrder: 7 },
  { menuPath: '/simulateur',  menuLabel: 'Simulateur de prime', allowedRoles: ['ADMIN','GESTIONNAIRE','AGENT_SAISIE'], sortOrder: 8 },
  { menuPath: '/fraude',      menuLabel: 'Gestion fraudes',   allowedRoles: ['ADMIN','GESTIONNAIRE','MEDECIN_CONSEIL','AUDITEUR'], sortOrder: 9 },
  { menuPath: '/permissions', menuLabel: 'Gestion des accès', allowedRoles: ['ADMIN'], sortOrder: 10 },
];

@Injectable()
export class PermissionsService {
  constructor(
    @InjectRepository(MenuPermission)
    private readonly repo: Repository<MenuPermission>,
  ) {}

  async findAll(): Promise<MenuPermission[]> {
    const rows = await this.repo.find({ order: { sortOrder: 'ASC' } });
    // Si la table est vide, seeder
    if (rows.length === 0) return this.seed();
    return rows;
  }

  async updateOne(menuPath: string, allowedRoles: string[]): Promise<MenuPermission> {
    await this.repo.update({ menuPath }, { allowedRoles });
    return this.repo.findOneOrFail({ where: { menuPath } });
  }

  async updateAll(updates: { menuPath: string; allowedRoles: string[] }[]): Promise<MenuPermission[]> {
    await Promise.all(updates.map(u => this.repo.update({ menuPath: u.menuPath }, { allowedRoles: u.allowedRoles })));
    return this.repo.find({ order: { sortOrder: 'ASC' } });
  }

  async seed(): Promise<MenuPermission[]> {
    for (const item of DEFAULT_PERMISSIONS) {
      const exists = await this.repo.findOne({ where: { menuPath: item.menuPath } });
      if (!exists) {
        await this.repo.save(this.repo.create(item));
      }
    }
    return this.repo.find({ order: { sortOrder: 'ASC' } });
  }
}
