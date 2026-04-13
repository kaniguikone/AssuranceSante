import { UUID, FCFA, ISO8601, ContactInfo, Address, AuditFields } from './common.types';

export enum TypePrestataire {
  CLINIQUE_HOPITAL = 'CLINIQUE_HOPITAL',
  CABINET_MEDICAL = 'CABINET_MEDICAL',
  PHARMACIE = 'PHARMACIE',
  LABORATOIRE = 'LABORATOIRE',
  CABINET_DENTAIRE = 'CABINET_DENTAIRE',
  OPTICIEN = 'OPTICIEN',
  CENTRE_RADIOLOGIE = 'CENTRE_RADIOLOGIE',
}

export enum StatutPrestataire {
  ACTIF = 'ACTIF',
  SUSPENDU = 'SUSPENDU',
  BLACKLISTE = 'BLACKLISTE',
  EN_COURS_AGREMENT = 'EN_COURS_AGREMENT',
}

export interface Prestataire extends AuditFields {
  id: UUID;
  code: string;                 // Format: PRE-XXXXXX
  type: TypePrestataire;
  raisonSociale: string;
  numeroAgrement: string;
  statut: StatutPrestataire;
  contact: ContactInfo;
  adresse: Address;
  latitude?: number;
  longitude?: number;
  specialites: string[];
  noteEvaluation: number;       // 0.0 - 5.0
  nombreEvaluations: number;
  accepteTiersPay: boolean;
  iban?: string;
  numeroMobileMoney?: string;
  dateConvention: ISO8601;
  dateFinConvention?: ISO8601;
}

export interface TarifConventionne extends AuditFields {
  id: UUID;
  prestataireId: UUID;
  codeActe: string;             // Code nomenclature CNAM-CI
  designation: string;
  tarif: FCFA;
  tarifMaxAutorise: FCFA;
  typePrestataire: TypePrestataire;
  valableDepuis: ISO8601;
  valableJusqu?: ISO8601;
}
