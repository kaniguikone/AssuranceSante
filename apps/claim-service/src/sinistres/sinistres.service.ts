import {
  Injectable, BadRequestException, NotFoundException, Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Sinistre } from './sinistre.entity';

// ── Utilitaires inline ────────────────────────────────────────────────────────
function genererNumeroSinistre(): string {
  const annee = new Date().getFullYear();
  const seq = Math.random().toString(36).substring(2, 10).toUpperCase();
  return `SIN-${annee}-${seq}`;
}

function calculerRemboursement(params: {
  montantReclame: number; tauxRemboursement: number;
  franchise: number; plafondAnnuelRestant: number;
}) {
  const apres = Math.max(0, params.montantReclame - params.franchise);
  const avantPlafond = Math.round(apres * (params.tauxRemboursement / 100));
  const rembourse = Math.min(avantPlafond, params.plafondAnnuelRestant);
  return {
    montantBase: params.montantReclame,
    montantFranchise: params.franchise,
    montantRembourse: rembourse,
    montantCoPaiement: apres - rembourse,
  };
}

function calculerPenaliteRetard(montant: number, taux: number, jours: number): number {
  return Math.round(montant * taux * jours);
}

function ajouterJoursOuvres(date: Date, jours: number): Date {
  const result = new Date(date);
  let ajoutes = 0;
  while (ajoutes < jours) {
    result.setDate(result.getDate() + 1);
    const j = result.getDay();
    if (j !== 0 && j !== 6) ajoutes++;
  }
  return result;
}

function diffJoursOuvres(debut: Date, fin: Date): number {
  const start = new Date(Math.min(debut.getTime(), fin.getTime()));
  const end = new Date(Math.max(debut.getTime(), fin.getTime()));
  let jours = 0;
  const cur = new Date(start);
  while (cur < end) {
    cur.setDate(cur.getDate() + 1);
    const j = cur.getDay();
    if (j !== 0 && j !== 6) jours++;
  }
  return jours;
}

const DELAIS_TRAITEMENT: Record<string, { standard: number; prioritaire: number }> = {
  SOINS_AMBULATOIRES: { standard: 10, prioritaire: 5 },
  MEDICAMENTS: { standard: 5, prioritaire: 2 },
  HOSPITALISATION_PLANIFIEE: { standard: 15, prioritaire: 7 },
  HOSPITALISATION_URGENCE: { standard: 2, prioritaire: 1 },
  ACTES_DENTAIRES: { standard: 10, prioritaire: 5 },
  OPTIQUE: { standard: 10, prioritaire: 5 },
  ANALYSES: { standard: 5, prioritaire: 2 },
  RADIOLOGIE: { standard: 5, prioritaire: 2 },
};

const TAUX_PENALITE_RETARD: Record<string, number> = {
  HOSPITALISATION_URGENCE: 0.01,
  DEFAULT: 0.005,
};

@Injectable()
export class SinistresService {
  private readonly logger = new Logger(SinistresService.name);

  constructor(
    @InjectRepository(Sinistre)
    private readonly sinistreRepo: Repository<Sinistre>,
  ) {}

  async deposer(params: {
    contratId: string;
    membreId: string;
    prestataireId: string;
    typeSoin: string;
    modeDepot: string;
    dateSoin: Date;
    montantReclame: number;
    actesMedicaux: any[];
    documentUrls: string[];
    dateEffetContrat: Date; // Pour vérifier règle anti-rétroactivité
    userId: string;
  }): Promise<Sinistre> {
    // Règle métier: tout sinistre antérieur à la date d'effet est rejeté
    if (params.dateSoin < params.dateEffetContrat) {
      throw new BadRequestException(
        `Sinistre rejeté: la date du soin (${params.dateSoin.toISOString().split('T')[0]}) est antérieure à la date d'effet du contrat (${params.dateEffetContrat.toISOString().split('T')[0]})`,
      );
    }

    // Calculer la date limite de traitement selon le type de soin
    const delais = DELAIS_TRAITEMENT[params.typeSoin as keyof typeof DELAIS_TRAITEMENT];
    const dateLimiteTraitement = ajouterJoursOuvres(new Date(), delais.standard);

    const sinistre = this.sinistreRepo.create({
      numero: genererNumeroSinistre(),
      contratId: params.contratId,
      membreId: params.membreId,
      prestataireId: params.prestataireId,
      typeSoin: params.typeSoin as any,
      statut: 'RECU',
      modeDepot: params.modeDepot as any,
      dateSoin: params.dateSoin,
      dateLimiteTraitement,
      montantReclame: params.montantReclame,
      montantBase: 0,
      montantFranchise: 0,
      montantRembourse: 0,
      montantCoPaiement: 0,
      penaliteRetard: 0,
      documentUrls: params.documentUrls,
      createdBy: params.userId,
    });

    const saved = await this.sinistreRepo.save(sinistre);
    this.logger.log(`Sinistre déposé: ${saved.numero} pour membre ${params.membreId}`);
    return saved;
  }

  async liquider(id: string, params: {
    franchise: number;
    tauxRemboursement: number;
    plafondAnnuelRestant: number;
    commentairesMedecin?: string;
    userId: string;
  }): Promise<Sinistre> {
    const sinistre = await this.findById(id);

    if (!['APPROUVE', 'EN_LIQUIDATION'].includes(sinistre.statut)) {
      throw new BadRequestException('Ce sinistre ne peut pas être liquidé dans son état actuel');
    }

    const calcul = calculerRemboursement({
      montantReclame: sinistre.montantReclame,
      tauxRemboursement: params.tauxRemboursement,
      franchise: params.franchise,
      plafondAnnuelRestant: params.plafondAnnuelRestant,
    });

    // Calculer pénalité si délai dépassé
    const now = new Date();
    let penaliteRetard = 0;
    if (now > sinistre.dateLimiteTraitement) {
      const joursRetard = diffJoursOuvres(sinistre.dateLimiteTraitement, now);
      const taux = sinistre.typeSoin === 'HOSPITALISATION_URGENCE'
        ? TAUX_PENALITE_RETARD['HOSPITALISATION_URGENCE']
        : TAUX_PENALITE_RETARD['DEFAULT'];
      penaliteRetard = calculerPenaliteRetard(calcul.montantRembourse, taux, joursRetard);
    }

    sinistre.montantBase = calcul.montantBase;
    sinistre.montantFranchise = calcul.montantFranchise;
    sinistre.montantRembourse = calcul.montantRembourse;
    sinistre.montantCoPaiement = calcul.montantCoPaiement;
    sinistre.penaliteRetard = penaliteRetard;
    sinistre.statut = 'EN_LIQUIDATION';
    if (params.commentairesMedecin) sinistre.commentairesMedecin = params.commentairesMedecin;
    sinistre.valideAt = now;
    sinistre.validePar = params.userId;

    return this.sinistreRepo.save(sinistre);
  }

  async approuver(id: string, userId: string): Promise<Sinistre> {
    const sinistre = await this.findById(id);
    if (!['RECU', 'EN_VERIFICATION', 'EN_VALIDATION_MEDICALE'].includes(sinistre.statut)) {
      throw new BadRequestException('Statut incompatible pour approbation');
    }
    sinistre.statut = 'APPROUVE';
    sinistre.validePar = userId;
    return this.sinistreRepo.save(sinistre);
  }

  async rejeter(id: string, motif: string, userId: string): Promise<Sinistre> {
    const sinistre = await this.findById(id);
    sinistre.statut = 'REJETE';
    sinistre.motifRejet = motif;
    sinistre.validePar = userId;
    return this.sinistreRepo.save(sinistre);
  }

  async findAll(): Promise<Sinistre[]> {
    return this.sinistreRepo.find({ order: { createdAt: 'DESC' } });
  }

  async findById(id: string): Promise<Sinistre> {
    const sinistre = await this.sinistreRepo.findOne({ where: { id } });
    if (!sinistre) throw new NotFoundException(`Sinistre ${id} introuvable`);
    return sinistre;
  }

  async findByMembre(membreId: string): Promise<Sinistre[]> {
    return this.sinistreRepo.find({
      where: { membreId },
      order: { createdAt: 'DESC' },
    });
  }

  async findEnAttenteFraude(): Promise<Sinistre[]> {
    return this.sinistreRepo
      .createQueryBuilder('s')
      .where('s.score_fraude >= 50')
      .orWhere('s.statut = :statut', { statut: 'FRAUDE_SUSPECTEE' })
      .orderBy('s.score_fraude', 'DESC')
      .getMany();
  }
}
