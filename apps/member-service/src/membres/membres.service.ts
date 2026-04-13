import {
  Injectable, BadRequestException, NotFoundException, ConflictException, Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike, FindOptionsWhere } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { Membre } from './membre.entity';
import { CarteTiersPay } from '../cartes/carte-tiers-pay.entity';
import { RechercheMembreDto } from './dto/recherche-membre.dto';

// Inline utilities pour éviter les problèmes de paths en dev
function soundexAfricain(nom: string): string {
  if (!nom) return '';
  const SUBSTITUTIONS: [RegExp, string][] = [
    [/[àâä]/g, 'a'], [/[éèêë]/g, 'e'], [/[îï]/g, 'i'],
    [/[ôö]/g, 'o'], [/[ùûü]/g, 'u'], [/ç/g, 's'],
    [/ou/g, 'u'], [/ph/g, 'f'], [/qu/g, 'k'],
  ];
  const CODE: Record<string, string> = {
    b: '1', p: '1', c: '2', g: '2', j: '2', k: '2', s: '2', z: '2',
    d: '3', t: '3', l: '4', m: '5', n: '5', r: '6', f: '7', v: '7',
  };
  let s = nom.toLowerCase().trim();
  for (const [r, rep] of SUBSTITUTIONS) s = s.replace(r, rep);
  s = s.replace(/[^a-z]/g, '');
  if (!s) return '';
  const premiere = s[0].toUpperCase();
  const code = s.substring(1).split('')
    .map(c => CODE[c] || '0')
    .filter((c, i, arr) => c !== '0' && c !== arr[i - 1])
    .slice(0, 3).join('');
  return (premiere + code + '000').substring(0, 4);
}

function genererNumeroCarte(): string {
  const seq = Math.random().toString(36).substring(2, 10).toUpperCase();
  return `SC-${seq}`;
}

function normaliserTelephone(telephone: string): string {
  let tel = telephone.replace(/[\s\-\.]/g, '').replace(/^(\+225|00225)/, '');
  if (tel.length === 8) tel = `0${tel}`;
  if (tel.length !== 10) return telephone;
  return `+225${tel}`;
}

function validerTelephoneCI(telephone: string): boolean {
  const tel = telephone.replace(/^(\+225|00225)/, '').replace(/[\s\-\.]/g, '');
  return /^\d{10}$/.test(tel);
}

function ageEnAnnees(dateNaissance: Date): number {
  const now = new Date();
  let age = now.getFullYear() - dateNaissance.getFullYear();
  const m = now.getMonth() - dateNaissance.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < dateNaissance.getDate())) age--;
  return age;
}

const AGE_MAX_ENFANT = 21;
const AGE_MAX_ETUDIANT = 25;

@Injectable()
export class MembresService {
  private readonly logger = new Logger(MembresService.name);

  constructor(
    @InjectRepository(Membre)
    private readonly membreRepo: Repository<Membre>,
    @InjectRepository(CarteTiersPay)
    private readonly carteRepo: Repository<CarteTiersPay>,
  ) {}

  async immatriculer(data: {
    nni?: string;
    typeDocument: string;
    numeroDocument: string;
    nom: string;
    prenoms: string;
    dateNaissance: Date;
    genre: string;
    nationalite?: string;
    telephone: string;
    telephoneSecondaire?: string;
    email?: string;
    adresseCommune: string;
    adresseVille?: string;
    adresseQuartier?: string;
    contratId?: string;
    lienParente?: string;
    membrePrincipalId?: string;
    estEtudiant?: boolean;
    etablissementScolaire?: string;
    createdBy: string;
  }): Promise<Membre> {
    if (!validerTelephoneCI(data.telephone)) {
      throw new BadRequestException(`Numéro de téléphone invalide: ${data.telephone}`);
    }

    // Vérification doublon NNI
    if (data.nni) {
      const existant = await this.membreRepo.findOne({ where: { nni: data.nni } });
      if (existant) throw new ConflictException(`NNI ${data.nni} déjà enregistré`);
    }

    // Vérification doublon document
    const existantDoc = await this.membreRepo.findOne({
      where: { numeroDocument: data.numeroDocument, typeDocument: data.typeDocument },
    });
    if (existantDoc) {
      throw new ConflictException(`Document ${data.typeDocument} ${data.numeroDocument} déjà enregistré`);
    }

    // Limite d'âge enfant bénéficiaire
    if (data.lienParente === 'ENFANT') {
      const age = ageEnAnnees(data.dateNaissance);
      const ageMax = data.estEtudiant ? AGE_MAX_ETUDIANT : AGE_MAX_ENFANT;
      if (age > ageMax) {
        throw new BadRequestException(
          `Enfant trop âgé (${age} ans). Limite: ${ageMax} ans${data.estEtudiant ? ' (étudiant)' : ''}`,
        );
      }
    }

    // Déduplication phonétique (warning uniquement, pas blocage)
    const doublons = await this.rechercherDoublons(data.nom, data.prenoms, data.dateNaissance);
    if (doublons.length > 0) {
      this.logger.warn(
        `Doublon potentiel pour ${data.nom} ${data.prenoms}: ${doublons.map(m => m.id).join(', ')}`,
      );
    }

    const membre = this.membreRepo.create({
      ...data,
      telephone: normaliserTelephone(data.telephone),
      numeroCarte: genererNumeroCarte(),
      nomPhonetique: soundexAfricain(data.nom),
      prenomsPhonetique: soundexAfricain(data.prenoms),
      statut: 'ACTIF',
    });

    const saved = await this.membreRepo.save(membre);
    await this.emettreCarteTiersPay(saved.id);
    return this.findById(saved.id);
  }

  async rechercher(dto: RechercheMembreDto): Promise<{ data: Membre[]; total: number; page: number; limit: number }> {
    const { page = 1, limit = 20, statut, contratId, numeroCarte, telephone, nni, nom, prenoms } = dto;

    const where: FindOptionsWhere<Membre> = {};
    if (statut) where.statut = statut;
    if (contratId) where.contratId = contratId;
    if (numeroCarte) where.numeroCarte = numeroCarte;
    if (telephone) where.telephone = ILike(`%${telephone}%`);
    if (nni) where.nni = nni;
    if (nom) where.nom = ILike(`%${nom}%`);
    if (prenoms) where.prenoms = ILike(`%${prenoms}%`);

    const [data, total] = await this.membreRepo.findAndCount({
      where,
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    return { data, total, page, limit };
  }

  async rechercherDoublonsPublic(nom: string, prenoms: string, dateNaissance: Date): Promise<Membre[]> {
    return this.rechercherDoublons(nom, prenoms, dateNaissance);
  }

  async findById(id: string): Promise<Membre> {
    const membre = await this.membreRepo.findOne({ where: { id }, relations: ['cartes'] });
    if (!membre) throw new NotFoundException(`Membre ${id} introuvable`);
    return membre;
  }

  async findByContrat(contratId: string): Promise<Membre[]> {
    return this.membreRepo.find({
      where: { contratId },
      order: { lienParente: 'ASC', nom: 'ASC' },
    });
  }

  async findByNumeroCarte(numeroCarte: string): Promise<Membre> {
    const membre = await this.membreRepo.findOne({
      where: { numeroCarte },
      relations: ['cartes'],
    });
    if (!membre) throw new NotFoundException(`Carte ${numeroCarte} introuvable`);
    return membre;
  }

  async emettreCarteTiersPay(membreId: string): Promise<CarteTiersPay> {
    const membre = await this.findById(membreId);

    // Désactiver les cartes existantes
    await this.carteRepo.update({ membreId, estActive: true }, { estActive: false });

    const dateExpiration = new Date();
    dateExpiration.setFullYear(dateExpiration.getFullYear() + 1);

    const qrData = JSON.stringify({
      id: membre.id,
      carte: membre.numeroCarte,
      nom: membre.nom,
      contrat: membre.contratId,
      exp: dateExpiration.toISOString().split('T')[0],
    });

    const codePinHash = await bcrypt.hash('0000', 10);

    const carte = this.carteRepo.create({
      membreId,
      numero: `CTP-${membre.numeroCarte}-${Date.now().toString(36).toUpperCase()}`,
      qrCodeData: qrData,
      codePinHash,
      dateExpiration,
    });

    return this.carteRepo.save(carte);
  }

  async rattacherContrat(id: string, contratId: string): Promise<Membre> {
    const membre = await this.findById(id);
    membre.contratId = contratId;
    return this.membreRepo.save(membre);
  }

  async suspendre(id: string): Promise<Membre> {
    const membre = await this.findById(id);
    if (membre.statut === 'RADIE') throw new BadRequestException('Un membre radié ne peut pas être suspendu');
    membre.statut = 'SUSPENDU';
    return this.membreRepo.save(membre);
  }

  async reactiver(id: string): Promise<Membre> {
    const membre = await this.findById(id);
    if (membre.statut === 'RADIE') throw new BadRequestException('Un membre radié ne peut pas être réactivé');
    membre.statut = 'ACTIF';
    return this.membreRepo.save(membre);
  }

  async radier(id: string): Promise<Membre> {
    const membre = await this.findById(id);
    membre.statut = 'RADIE';
    membre.dateFinAffiliation = new Date();
    // Désactiver toutes les cartes
    await this.carteRepo.update({ membreId: id }, { estActive: false });
    return this.membreRepo.save(membre);
  }

  // Suppression physique — réservé à la compensation transactionnelle (rollback contrat)
  async supprimer(id: string): Promise<void> {
    const membre = await this.membreRepo.findOne({ where: { id } });
    if (!membre) return; // idempotent
    await this.carteRepo.delete({ membreId: id });
    await this.membreRepo.delete(id);
  }

  private async rechercherDoublons(nom: string, prenoms: string, dateNaissance: Date): Promise<Membre[]> {
    return this.membreRepo
      .createQueryBuilder('m')
      .where('m.nom_phonetique = :np', { np: soundexAfricain(nom) })
      .andWhere('m.date_naissance = :dob', { dob: dateNaissance })
      .getMany();
  }
}
