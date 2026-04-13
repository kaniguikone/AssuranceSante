import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './notification.entity';
import { TemplateNotification } from '../templates/template.entity';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private readonly isDev = process.env.NODE_ENV !== 'production';

  constructor(
    @InjectRepository(Notification)
    private readonly notifRepo: Repository<Notification>,
    @InjectRepository(TemplateNotification)
    private readonly templateRepo: Repository<TemplateNotification>,
  ) {}

  async envoyer(params: {
    destinataireId: string;
    type: string;
    canal: string;
    telephone?: string;
    emailDest?: string;
    variables?: Record<string, string>;
  }): Promise<Notification> {
    const template = await this.templateRepo.findOne({
      where: { type: params.type as any, canal: params.canal as any, estActif: true },
    });

    const corps = template
      ? this.interpolerTemplate(template.corps, params.variables ?? {})
      : `[SANTÉ-CI] ${params.type} — ${JSON.stringify(params.variables ?? {})}`;

    const notif = this.notifRepo.create({
      destinataireId: params.destinataireId,
      canal: params.canal as any,
      type: params.type as any,
      statut: 'EN_ATTENTE',
      sujet: template?.sujet,
      corps,
      telephone: params.telephone,
      email: params.emailDest,
      tentatives: 0,
    });
    const saved = await this.notifRepo.save(notif);

    if (this.isDev) {
      // En dev : simuler l'envoi sans appel externe
      this.logger.log(`[DEV] Simulation envoi ${params.canal} → ${params.telephone ?? params.emailDest}: ${corps.substring(0, 80)}`);
      await this.notifRepo.update(saved.id, {
        statut: 'ENVOYEE',
        envoyeeAt: new Date(),
        referenceExterne: `DEV-${Date.now()}`,
        coutFcfa: params.canal === 'SMS' ? 35 : 0,
      });
    } else {
      // En production : appels réels (à implémenter avec providers Infobip/SendGrid)
      this.logger.warn(`Canal ${params.canal} en production — provider non configuré`);
    }

    return this.notifRepo.findOne({ where: { id: saved.id } }) as Promise<Notification>;
  }

  async findByDestinataire(destinataireId: string): Promise<Notification[]> {
    return this.notifRepo.find({
      where: { destinataireId },
      order: { createdAt: 'DESC' },
      take: 50,
    });
  }

  async findById(id: string): Promise<Notification> {
    const notif = await this.notifRepo.findOne({ where: { id } });
    if (!notif) throw new NotFoundException(`Notification ${id} introuvable`);
    return notif;
  }

  async marquerLue(id: string): Promise<Notification> {
    const notif = await this.findById(id);
    notif.statut = 'LUE';
    return this.notifRepo.save(notif);
  }

  async findEnAttente(): Promise<Notification[]> {
    return this.notifRepo.find({
      where: { statut: 'EN_ATTENTE' },
      order: { createdAt: 'ASC' },
      take: 100,
    });
  }

  private interpolerTemplate(template: string, variables: Record<string, string>): string {
    return template.replace(/\{\{(\w+)\}\}/g, (_, key) => variables[key] ?? `{{${key}}}`);
  }
}
