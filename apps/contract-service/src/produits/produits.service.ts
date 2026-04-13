import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Produit } from './produit.entity';

// Formules SANTÉ-CI (montants en FCFA)
const FORMULES_DE_BASE = [
  {
    formule: 'BRONZE',
    nom: 'Formule Bronze',
    description: 'Couverture essentielle : consultations et pharmacie',
    franchise: 5000,
    plafondAnnuel: 500_000,
    tauxRemboursement: 60,
    coPaiement: 20,
    plafondHospitalisation: 200_000,
    plafondDentaire: 50_000,
    plafondOptique: 30_000,
    primeMensuelleBase: 15_000,
  },
  {
    formule: 'ARGENT',
    nom: 'Formule Argent',
    description: 'Couverture standard : soins courants + hospitalisation',
    franchise: 3000,
    plafondAnnuel: 1_500_000,
    tauxRemboursement: 70,
    coPaiement: 15,
    plafondHospitalisation: 600_000,
    plafondDentaire: 100_000,
    plafondOptique: 75_000,
    primeMensuelleBase: 35_000,
  },
  {
    formule: 'OR',
    nom: 'Formule Or',
    description: 'Couverture élargie : tous soins + maternité',
    franchise: 0,
    plafondAnnuel: 3_000_000,
    tauxRemboursement: 80,
    coPaiement: 10,
    plafondHospitalisation: 1_500_000,
    plafondDentaire: 200_000,
    plafondOptique: 150_000,
    primeMensuelleBase: 65_000,
  },
  {
    formule: 'PLATINE',
    nom: 'Formule Platine',
    description: 'Couverture premium : sans franchise, remboursement maximal',
    franchise: 0,
    plafondAnnuel: 10_000_000,
    tauxRemboursement: 90,
    coPaiement: 5,
    plafondHospitalisation: 5_000_000,
    plafondDentaire: 500_000,
    plafondOptique: 300_000,
    primeMensuelleBase: 120_000,
  },
];

@Injectable()
export class ProduitsService {
  constructor(
    @InjectRepository(Produit)
    private readonly produitRepo: Repository<Produit>,
  ) {}

  async findAll(): Promise<Produit[]> {
    return this.produitRepo.find({ where: { estActif: true }, order: { primeMensuelleBase: 'ASC' } });
  }

  async seed(): Promise<{ created: number; message: string }> {
    let created = 0;
    for (const formule of FORMULES_DE_BASE) {
      const existing = await this.produitRepo.findOne({ where: { formule: formule.formule as any } });
      if (!existing) {
        await this.produitRepo.save(this.produitRepo.create(formule));
        created++;
      }
    }
    return { created, message: `${created} produit(s) créé(s), ${FORMULES_DE_BASE.length - created} déjà existant(s)` };
  }
}
