import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomUUID } from 'crypto';
import { User } from './user.entity';
import { UserRoleEntity } from '../roles/user-role.entity';
import { CreateUserDto, UpdateUserDto } from './dto/manage-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(UserRoleEntity)
    private readonly roleRepo: Repository<UserRoleEntity>,
  ) {}

  findAll(): Promise<User[]> {
    return this.userRepo.find({ order: { createdAt: 'DESC' }, relations: ['userRoles'] });
  }

  async findById(id: string): Promise<User | null> {
    return this.userRepo.findOne({ where: { id } });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepo.findOne({ where: { email } });
  }

  async findByKeycloakId(keycloakId: string): Promise<User | null> {
    return this.userRepo.findOne({ where: { keycloakId } });
  }

  async updateLastLogin(userId: string): Promise<void> {
    await this.userRepo.update(userId, { derniereConnexion: new Date() });
  }

  async create(dto: CreateUserDto, createdBy = 'admin'): Promise<User> {
    const existing = await this.findByEmail(dto.email);
    if (existing) throw new BadRequestException('Email déjà utilisé');

    const user = this.userRepo.create({
      keycloakId: randomUUID(),
      email: dto.email,
      nom: dto.nom,
      prenoms: dto.prenoms,
      telephone: dto.telephone,
      createdBy,
    });
    const saved = await this.userRepo.save(user);

    if (dto.roles?.length) {
      const roleEntities = dto.roles.map(role =>
        this.roleRepo.create({ userId: saved.id, role, grantedBy: createdBy }),
      );
      await this.roleRepo.save(roleEntities);
    }

    return this.userRepo.findOne({ where: { id: saved.id } }) as Promise<User>;
  }

  async update(id: string, dto: UpdateUserDto, updatedBy = 'admin'): Promise<User> {
    const user = await this.findById(id);
    if (!user) throw new NotFoundException(`Utilisateur ${id} introuvable`);

    const { roles, ...fields } = dto;
    if (Object.keys(fields).length) {
      await this.userRepo.update(id, fields);
    }

    if (roles !== undefined) {
      await this.roleRepo.update({ userId: id, revokedAt: null as any }, { revokedAt: new Date() });
      if (roles.length) {
        const roleEntities = roles.map(role =>
          this.roleRepo.create({ userId: id, role, grantedBy: updatedBy }),
        );
        await this.roleRepo.save(roleEntities);
      }
    }

    return this.userRepo.findOne({ where: { id } }) as Promise<User>;
  }

  async remove(id: string): Promise<void> {
    const user = await this.findById(id);
    if (!user) throw new NotFoundException(`Utilisateur ${id} introuvable`);
    await this.userRepo.update(id, { estActif: false });
  }

  async createFromKeycloak(data: {
    keycloakId: string;
    email: string;
    nom: string;
    prenoms: string;
    roles?: string[];
  }): Promise<User> {
    const user = this.userRepo.create({
      keycloakId: data.keycloakId,
      email: data.email,
      nom: data.nom,
      prenoms: data.prenoms,
    });
    return this.userRepo.save(user);
  }

  async deactivate(userId: string): Promise<void> {
    await this.userRepo.update(userId, { estActif: false });
  }
}
