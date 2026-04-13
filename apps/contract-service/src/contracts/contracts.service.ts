import {
  Injectable, BadRequestException, NotFoundException, Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { Contrat } from './contrat.entity';
import { CreateContratDto } from './dto/create-contrat.dto';
import { Produit } from '../produits/produit.entity';

// Constantes inline (évite les problèmes de paths cross-package en dev)
const LIMITE_DATE_EFFET_JOURS = process.env.NODE_ENV === 'production' ? 30 : 365;
const MIN_ADHERENTS_COLLECTIF = 10;

function genererNumeroContrat(): string {
  const annee = new Date().getFullYear();
  const seq = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `CT-${annee}-${seq}`;
}

@Injectable()
export class ContractsService {
  private readonly logger = new Logger(ContractsService.name);

  private readonly memberServiceUrl = `${process.env.MEMBER_SERVICE_URL ?? 'http://localhost:3003'}/api/v1`;

  constructor(
    @InjectRepository(Contrat)
    private readonly contratRepo: Repository<Contrat>,
    @InjectRepository(Produit)
    private readonly produitRepo: Repository<Produit>,
    private readonly http: HttpService,
  ) {}

  async creer(dto: CreateContratDto, userId: string): Promise<Contrat> {
    // Vérifier la date d'effet
    const today = new Date();
    const dateEffet = new Date(dto.dateEffet);
    const diffJours = Math.floor((today.getTime() - dateEffet.getTime()) / (1000 * 60 * 60 * 24));
    if (diffJours > LIMITE_DATE_EFFET_JOURS) {
      throw new BadRequestException(
        `La date d'effet ne peut être antérieure à J-${LIMITE_DATE_EFFET_JOURS}`,
      );
    }

    // Charger le produit
    const produit = await this.produitRepo.findOne({ where: { id: dto.produitId } });
    if (!produit || !produit.estActif) {
      throw new NotFoundException('Produit introuvable ou inactif');
    }

    // Calculer les primes
    const primeMensuelle = produit.primeMensuelleBase;
    const primeAnnuelle = primeMensuelle * 12;

    // Créer d'abord le contrat (sans souscripteurId si nouveau membre — sera mis à jour après)
    const contrat = this.contratRepo.create({
      numero: genererNumeroContrat(),
      type: dto.type,
      statut: 'EN_ATTENTE',
      souscripteurId: dto.souscripteurId,
      employeurId: dto.employeurId,
      produitId: dto.produitId,
      formule: produit.formule,
      franchise: produit.franchise,
      plafondAnnuel: produit.plafondAnnuel,
      tauxRemboursement: produit.tauxRemboursement,
      coPaiement: produit.coPaiement,
      plafondHospitalisation: produit.plafondHospitalisation,
      plafondDentaire: produit.plafondDentaire,
      plafondOptique: produit.plafondOptique,
      dateEffet: new Date(dto.dateEffet),
      dateEcheance: new Date(dto.dateEcheance),
      primeAnnuelle,
      primeMensuelle,
      estRenouvellementAuto: dto.estRenouvellementAuto ?? true,
      nombreAdherentsMin: dto.type === 'COLLECTIF' ? MIN_ADHERENTS_COLLECTIF : undefined,
      createdBy: userId,
    });

    const saved = await this.contratRepo.save(contrat);
    this.logger.log(`Contrat créé: ${saved.numero} par ${userId}`);

    // Créer le nouveau souscripteur avec le contratId déjà connu
    if (dto.nouveauSouscripteur) {
      try {
        const res = await firstValueFrom(
          this.http.post(`${this.memberServiceUrl}/membres`, {
            ...dto.nouveauSouscripteur,
            lienParente: 'PRINCIPAL',
            contratId: saved.id,
          }),
        );
        const souscripteurId = res.data?.id;
        // Mettre à jour le contrat avec le souscripteurId
        saved.souscripteurId = souscripteurId;
        await this.contratRepo.save(saved);
        this.logger.log(`Souscripteur ${souscripteurId} créé et rattaché au contrat ${saved.id}`);
      } catch (e: any) {
        // Compensation : supprimer le contrat créé
        try {
          await this.contratRepo.delete(saved.id);
          this.logger.warn(`Compensation: contrat ${saved.id} supprimé suite à l'échec de création du souscripteur`);
        } catch (rollbackErr: any) {
          this.logger.error(`Échec compensation contrat ${saved.id}: ${rollbackErr.message}`);
        }
        throw new BadRequestException(
          `Impossible de créer le souscripteur: ${e.response?.data?.message?.join?.(', ') ?? e.message}`,
        );
      }
    } else if (dto.souscripteurId) {
      // Membre existant : mettre à jour son contratId
      try {
        await firstValueFrom(
          this.http.patch(`${this.memberServiceUrl}/membres/${dto.souscripteurId}/contrat`, { contratId: saved.id }),
        );
      } catch (e: any) {
        this.logger.warn(`Impossible de synchroniser le membre existant: ${e.message}`);
      }
    }

    return this.findById(saved.id);
  }

  async activer(id: string, userId: string): Promise<Contrat> {
    const contrat = await this.findById(id);
    if (contrat.statut !== 'EN_ATTENTE') {
      throw new BadRequestException(`Impossible d'activer un contrat en statut ${contrat.statut}`);
    }
    contrat.statut = 'ACTIF';
    contrat.updatedBy = userId;
    return this.contratRepo.save(contrat);
  }

  async suspendre(id: string, userId: string): Promise<Contrat> {
    const contrat = await this.findById(id);
    if (contrat.statut !== 'ACTIF') {
      throw new BadRequestException('Seul un contrat actif peut être suspendu');
    }
    contrat.statut = 'SUSPENDU';
    contrat.dateSuspension = new Date();
    contrat.updatedBy = userId;
    return this.contratRepo.save(contrat);
  }

  async resilier(id: string, motif: string, userId: string): Promise<Contrat> {
    const contrat = await this.findById(id);
    if (['RESILIE', 'EXPIRE'].includes(contrat.statut)) {
      throw new BadRequestException('Ce contrat est déjà résilié ou expiré');
    }
    contrat.statut = 'RESILIE';
    contrat.dateResiliation = new Date();
    contrat.motifResiliation = motif;
    contrat.updatedBy = userId;
    this.logger.log(`Contrat résilié: ${contrat.numero} - Motif: ${motif}`);
    return this.contratRepo.save(contrat);
  }

  async reactiverApresSuspension(id: string, userId: string): Promise<Contrat> {
    const contrat = await this.findById(id);
    if (contrat.statut !== 'SUSPENDU') {
      throw new BadRequestException('Ce contrat n\'est pas suspendu');
    }

    // Vérifier que la suspension date de moins de 60 jours
    const diffJours = Math.floor(
      (Date.now() - contrat.dateSuspension!.getTime()) / (1000 * 60 * 60 * 24),
    );
    if (diffJours > 60) {
      throw new BadRequestException(
        'Réactivation impossible : la suspension date de plus de 60 jours',
      );
    }

    contrat.statut = 'ACTIF';
    contrat.dateSuspension = undefined;
    contrat.updatedBy = userId;
    return this.contratRepo.save(contrat);
  }

  async findAll(): Promise<Contrat[]> {
    return this.contratRepo.find({ order: { createdAt: 'DESC' } });
  }

  async findById(id: string): Promise<Contrat> {
    const contrat = await this.contratRepo.findOne({
      where: { id },
      relations: ['avenants'],
    });
    if (!contrat) throw new NotFoundException(`Contrat ${id} introuvable`);
    return contrat;
  }

  async findBySouscripteur(souscripteurId: string): Promise<Contrat[]> {
    return this.contratRepo.find({ where: { souscripteurId } });
  }

  async findContartsArrivanAEcheance(joursAvantEcheance: number): Promise<Contrat[]> {
    const dateRef = new Date();
    dateRef.setDate(dateRef.getDate() + joursAvantEcheance);
    return this.contratRepo
      .createQueryBuilder('c')
      .where('c.statut = :statut', { statut: 'ACTIF' })
      .andWhere('c.date_echeance::date = :date', {
        date: dateRef.toISOString().split('T')[0],
      })
      .andWhere('c.est_renouvellement_auto = false')
      .getMany();
  }
}
