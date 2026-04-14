import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from './audit-log.entity';

interface LogParams {
  userId?: string;
  action: string;
  ressource: string;
  ressourceId?: string;
  donneesAvant?: Record<string, unknown>;
  donneesApres?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  statut?: 'SUCCESS' | 'FAILURE';
  messageErreur?: string;
}

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly auditRepo: Repository<AuditLog>,
  ) {}

  findByRessource(ressource: string, ressourceId: string): Promise<AuditLog[]> {
    return this.auditRepo.find({
      where: { ressource, ressourceId },
      order: { createdAt: 'DESC' },
      take: 50,
    });
  }

  findAll(limit = 100): Promise<AuditLog[]> {
    return this.auditRepo.find({ order: { createdAt: 'DESC' }, take: limit });
  }

  async log(params: LogParams): Promise<void> {
    const log = this.auditRepo.create({
      userId: params.userId,
      action: params.action,
      ressource: params.ressource,
      ressourceId: params.ressourceId,
      donneesAvant: params.donneesAvant,
      donneesApres: params.donneesApres,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
      statut: params.statut ?? 'SUCCESS',
      messageErreur: params.messageErreur,
    });
    // Fire-and-forget: ne pas bloquer la requête principale
    this.auditRepo.save(log).catch(() => {
      // Silently ignore audit failures (log séparé en production)
    });
  }
}
