import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Echeance } from './echeance.entity';
import { Bareme } from '../baremes/bareme.entity';

// Utilitaires inline
const DELAI_GRACE_PAIEMENT_JOURS = 30;

function genererNumeroEcheance(periode: string): string {
  const seq = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `ECH-${periode}-${seq}`;
}

function ageEnAnnees(dateNaissance: Date): number {
  const now = new Date();
  let age = now.getFullYear() - dateNaissance.getFullYear();
  const m = now.getMonth() - dateNaissance.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < dateNaissance.getDate())) age--;
  return age;
}

@Injectable()
export class EcheancesService {
  private readonly logger = new Logger(EcheancesService.name);

  constructor(
    @InjectRepository(Echeance)
    private readonly echeanceRepo: Repository<Echeance>,
    @InjectRepository(Bareme)
    private readonly baremeRepo: Repository<Bareme>,
  ) {}

  async calculerPrime(params: {
    formule: string;
    dateNaissance: Date;
    genre?: string;
  }): Promise<number> {
    const age = ageEnAnnees(params.dateNaissance);
    const bareme = await this.baremeRepo
      .createQueryBuilder('b')
      .where('b.formule = :formule', { formule: params.formule })
      .andWhere('b.age_min <= :age', { age })
      .andWhere('b.age_max >= :age', { age })
      .andWhere('(b.genre IS NULL OR b.genre = :genre)', { genre: params.genre ?? null })
      .andWhere('b.valable_depuis <= CURRENT_DATE')
      .andWhere('(b.valable_jusqu IS NULL OR b.valable_jusqu >= CURRENT_DATE)')
      .orderBy('b.genre', 'DESC')
      .getOne();

    if (!bareme) {
      this.logger.warn(`Aucun barème pour formule=${params.formule}, âge=${age}`);
      return 0;
    }
    return Math.round(
      Number(bareme.primeMensuelleBase)
      * Number(bareme.coefficientProfession)
      * Number(bareme.coefficientAntecedents),
    );
  }

  async genererEcheancesMensuelles(params: {
    contratId: string;
    membreId: string;
    primeMensuelle: number;
    dateDebut: Date;
    dateFin: Date;
  }): Promise<Echeance[]> {
    const echeances: Echeance[] = [];
    const current = new Date(params.dateDebut);
    current.setDate(1);

    while (current <= params.dateFin) {
      const periode = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`;
      const existing = await this.echeanceRepo.findOne({
        where: { contratId: params.contratId, periode },
      });
      if (!existing) {
        const dateEcheance = new Date(current.getFullYear(), current.getMonth() + 1, 1);
        const dateLimitePaiement = new Date(dateEcheance);
        dateLimitePaiement.setDate(dateLimitePaiement.getDate() + DELAI_GRACE_PAIEMENT_JOURS);
        echeances.push(this.echeanceRepo.create({
          contratId: params.contratId,
          membreId: params.membreId,
          numero: genererNumeroEcheance(periode),
          periode,
          montantDu: params.primeMensuelle,
          montantPaye: 0,
          dateEcheance,
          dateLimitePaiement,
          statut: 'EN_ATTENTE',
          nombreRelances: 0,
          penaliteRetard: 0,
        }));
      }
      current.setMonth(current.getMonth() + 1);
    }

    if (echeances.length === 0) return [];
    return this.echeanceRepo.save(echeances);
  }

  async enregistrerPaiement(
    echeanceId: string,
    montantPaye: number,
    transactionId: string,
  ): Promise<Echeance> {
    const echeance = await this.findById(echeanceId);
    echeance.montantPaye = Number(echeance.montantPaye) + montantPaye;
    echeance.transactionId = transactionId;
    echeance.datePaiement = new Date();
    echeance.statut = echeance.montantPaye >= Number(echeance.montantDu) ? 'PAYE' : 'EN_GRACE';
    return this.echeanceRepo.save(echeance);
  }

  async detecterImpayes(): Promise<{ traites: number }> {
    const result = await this.echeanceRepo
      .createQueryBuilder()
      .update(Echeance)
      .set({ statut: 'EN_RETARD' })
      .where('statut IN (:...statuts)', { statuts: ['EN_ATTENTE', 'EN_GRACE'] })
      .andWhere('date_limite_paiement < NOW()')
      .execute();
    this.logger.log(`${result.affected} échéances passées EN_RETARD`);
    return { traites: result.affected ?? 0 };
  }

  async findByContrat(contratId: string): Promise<Echeance[]> {
    return this.echeanceRepo.find({ where: { contratId }, order: { dateEcheance: 'ASC' } });
  }

  async findById(id: string): Promise<Echeance> {
    const e = await this.echeanceRepo.findOne({ where: { id } });
    if (!e) throw new NotFoundException(`Échéance ${id} introuvable`);
    return e;
  }

  async resume(contratId: string) {
    const echeances = await this.findByContrat(contratId);
    const total = echeances.reduce((s, e) => s + Number(e.montantDu), 0);
    const paye = echeances.reduce((s, e) => s + Number(e.montantPaye), 0);
    const enRetard = echeances.filter(e => e.statut === 'EN_RETARD').length;
    return { total, paye, restant: total - paye, enRetard, nombreEcheances: echeances.length };
  }
}
