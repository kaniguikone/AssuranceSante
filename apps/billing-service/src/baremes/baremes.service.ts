import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Bareme } from './bareme.entity';

// Barèmes de base SANTÉ-CI (montants en FCFA)
const BAREMES_SEED = [
  // BRONZE
  { formule: 'BRONZE', ageMin: 0,  ageMax: 17, primeMensuelleBase: 8000,  valableDepuis: '2026-01-01' },
  { formule: 'BRONZE', ageMin: 18, ageMax: 40, primeMensuelleBase: 15000, valableDepuis: '2026-01-01' },
  { formule: 'BRONZE', ageMin: 41, ageMax: 60, primeMensuelleBase: 20000, valableDepuis: '2026-01-01' },
  { formule: 'BRONZE', ageMin: 61, ageMax: 99, primeMensuelleBase: 28000, valableDepuis: '2026-01-01' },
  // ARGENT
  { formule: 'ARGENT', ageMin: 0,  ageMax: 17, primeMensuelleBase: 18000, valableDepuis: '2026-01-01' },
  { formule: 'ARGENT', ageMin: 18, ageMax: 40, primeMensuelleBase: 35000, valableDepuis: '2026-01-01' },
  { formule: 'ARGENT', ageMin: 41, ageMax: 60, primeMensuelleBase: 45000, valableDepuis: '2026-01-01' },
  { formule: 'ARGENT', ageMin: 61, ageMax: 99, primeMensuelleBase: 58000, valableDepuis: '2026-01-01' },
  // OR
  { formule: 'OR', ageMin: 0,  ageMax: 17, primeMensuelleBase: 35000,  valableDepuis: '2026-01-01' },
  { formule: 'OR', ageMin: 18, ageMax: 40, primeMensuelleBase: 65000,  valableDepuis: '2026-01-01' },
  { formule: 'OR', ageMin: 41, ageMax: 60, primeMensuelleBase: 85000,  valableDepuis: '2026-01-01' },
  { formule: 'OR', ageMin: 61, ageMax: 99, primeMensuelleBase: 110000, valableDepuis: '2026-01-01' },
  // PLATINE
  { formule: 'PLATINE', ageMin: 0,  ageMax: 17, primeMensuelleBase: 70000,  valableDepuis: '2026-01-01' },
  { formule: 'PLATINE', ageMin: 18, ageMax: 40, primeMensuelleBase: 120000, valableDepuis: '2026-01-01' },
  { formule: 'PLATINE', ageMin: 41, ageMax: 60, primeMensuelleBase: 155000, valableDepuis: '2026-01-01' },
  { formule: 'PLATINE', ageMin: 61, ageMax: 99, primeMensuelleBase: 200000, valableDepuis: '2026-01-01' },
];

@Injectable()
export class BaremesService {
  constructor(
    @InjectRepository(Bareme)
    private readonly baremeRepo: Repository<Bareme>,
  ) {}

  async findAll(): Promise<Bareme[]> {
    return this.baremeRepo.find({ order: { formule: 'ASC', ageMin: 'ASC' } });
  }

  async simuler(params: { formule: string; dateNaissance: string; nbBeneficiaires?: number }): Promise<{
    formule: string; age: number; primeMensuelleBase: number; primeAnnuelle: number;
    primeAvecBeneficiaires: number; nbBeneficiaires: number;
  }> {
    const age = new Date().getFullYear() - new Date(params.dateNaissance).getFullYear();
    const bareme = await this.baremeRepo.findOne({
      where: { formule: params.formule },
      order: { ageMin: 'ASC' },
    });

    // Trouver la tranche d'âge
    const baremes = await this.baremeRepo.find({ where: { formule: params.formule }, order: { ageMin: 'ASC' } });
    const tranche = baremes.find(b => age >= b.ageMin && age <= b.ageMax) ?? baremes[baremes.length - 1];

    if (!tranche) throw new Error(`Aucun barème pour la formule ${params.formule}`);

    const nb = params.nbBeneficiaires ?? 0;
    const primeMensuelleBase = Number(tranche.primeMensuelleBase);
    // Chaque bénéficiaire supplémentaire: +30% de la prime de base
    const primeAvecBeneficiaires = Math.round(primeMensuelleBase * (1 + nb * 0.3));

    return {
      formule: params.formule,
      age,
      primeMensuelleBase,
      primeAnnuelle: primeMensuelleBase * 12,
      primeAvecBeneficiaires,
      nbBeneficiaires: nb,
    };
  }

  async seed(): Promise<{ created: number }> {
    let created = 0;
    for (const b of BAREMES_SEED) {
      const existing = await this.baremeRepo.findOne({
        where: { formule: b.formule, ageMin: b.ageMin, ageMax: b.ageMax },
      });
      if (!existing) {
        await this.baremeRepo.save(this.baremeRepo.create({
          ...b,
          valableDepuis: new Date(b.valableDepuis),
          coefficientProfession: 1.0,
          coefficientAntecedents: 1.0,
        }));
        created++;
      }
    }
    return { created };
  }
}
