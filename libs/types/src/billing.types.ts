import { UUID, FCFA, ISO8601, AuditFields } from './common.types';

export enum StatutEcheance {
  EN_ATTENTE = 'EN_ATTENTE',
  PAYE = 'PAYE',
  EN_RETARD = 'EN_RETARD',
  EN_GRACE = 'EN_GRACE',       // Dans la période de grâce (30j)
  IMPAYE = 'IMPAYE',
  ANNULE = 'ANNULE',
}

export enum StatutRelance {
  RAPPEL_DOUX = 'RAPPEL_DOUX',
  RELANCE_FORMELLE = 'RELANCE_FORMELLE',
  MISE_EN_DEMEURE = 'MISE_EN_DEMEURE',
}

export interface Echeance extends AuditFields {
  id: UUID;
  contratId: UUID;
  membreId: UUID;
  numero: string;               // Format: ECH-2024-XXXXXX
  periode: string;              // Format: "2024-01" (AAAA-MM)
  montantDu: FCFA;
  montantPaye: FCFA;
  dateEcheance: ISO8601;
  dateLimitePaiement: ISO8601;  // dateEcheance + 30j de grâce
  datePaiement?: ISO8601;
  statut: StatutEcheance;
  statutRelance?: StatutRelance;
  nombreRelances: number;
  penaliteRetard: FCFA;         // 0.5% par jour de retard après grâce
}

export interface BaremeCotisation {
  id: UUID;
  formule: string;              // GarantieFormule
  ageMin: number;
  ageMax: number;
  genre?: string;               // M, F, ou null (tous)
  region?: string;
  primeMensuelleBase: FCFA;
  coefficientProfession?: number;
  coefficientAntecedents?: number;
  valableDepuis: ISO8601;
  valableJusqu?: ISO8601;
}
