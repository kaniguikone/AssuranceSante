import { UUID, FCFA, ISO8601, AuditFields } from './common.types';

export enum TypeSoin {
  SOINS_AMBULATOIRES = 'SOINS_AMBULATOIRES',
  MEDICAMENTS = 'MEDICAMENTS',
  HOSPITALISATION_PLANIFIEE = 'HOSPITALISATION_PLANIFIEE',
  HOSPITALISATION_URGENCE = 'HOSPITALISATION_URGENCE',
  ACTES_DENTAIRES = 'ACTES_DENTAIRES',
  OPTIQUE = 'OPTIQUE',
  ANALYSES = 'ANALYSES',
  RADIOLOGIE = 'RADIOLOGIE',
}

export enum StatutSinistre {
  RECU = 'RECU',
  EN_VERIFICATION = 'EN_VERIFICATION',
  EN_VALIDATION_MEDICALE = 'EN_VALIDATION_MEDICALE',
  APPROUVE = 'APPROUVE',
  REJETE = 'REJETE',
  EN_LIQUIDATION = 'EN_LIQUIDATION',
  PAYE = 'PAYE',
  CONTESTE = 'CONTESTE',
  FRAUDE_SUSPECTEE = 'FRAUDE_SUSPECTEE',
}

export enum ModeDepot {
  SCAN = 'SCAN',
  PHOTO = 'PHOTO',
  SAISIE_MANUELLE = 'SAISIE_MANUELLE',
  TIERS_PAYANT = 'TIERS_PAYANT',  // Direct prestataire
}

export interface ActeMedical {
  codeCIM10?: string;           // Classification internationale maladie
  codeNomenclature?: string;    // Nomenclature CNAM-CI
  designation: string;
  quantite: number;
  prixUnitaire: FCFA;
  montantTotal: FCFA;
  dateActe: ISO8601;
}

export interface Sinistre extends AuditFields {
  id: UUID;
  numero: string;               // Format: SIN-2024-XXXXXXXXXX
  contratId: UUID;
  membreId: UUID;               // Assuré ou bénéficiaire concerné
  prestataireId: UUID;
  typeSoin: TypeSoin;
  statut: StatutSinistre;
  modeDepot: ModeDepot;
  dateSoin: ISO8601;
  dateDepot: ISO8601;
  dateLimiteTraitement: ISO8601; // Calculé selon type + délais garantis

  actesMedicaux: ActeMedical[];
  montantReclame: FCFA;
  montantBase: FCFA;            // Base de remboursement
  montantFranchise: FCFA;
  montantRembourse: FCFA;       // Après franchise et co-paiement
  montantCoPaiement: FCFA;      // Part assuré

  documentUrls: string[];       // URLs MinIO (feuilles de soins, ordonnances)
  ocrExtracted?: Record<string, unknown>; // Données extraites par OCR
  scoreFraude?: number;         // 0-100, issu du fraud-service
  niveauSuspicion?: 'FAIBLE' | 'MOYEN' | 'ELEVE' | 'CRITIQUE';
  commentairesMedecin?: string;
  motifRejet?: string;
  penaliteRetard: FCFA;         // Pénalité si délai dépassé
}

// Délais garantis par type de soin (en jours ouvrés, sauf urgence en heures)
export const DELAIS_TRAITEMENT = {
  [TypeSoin.SOINS_AMBULATOIRES]: { standard: 10, prioritaire: 5 },
  [TypeSoin.MEDICAMENTS]: { standard: 5, prioritaire: 2 },
  [TypeSoin.HOSPITALISATION_PLANIFIEE]: { standard: 15, prioritaire: 7 },
  [TypeSoin.HOSPITALISATION_URGENCE]: { standard: 2, prioritaire: 1 }, // en jours (48h/24h)
  [TypeSoin.ACTES_DENTAIRES]: { standard: 10, prioritaire: 5 },
  [TypeSoin.OPTIQUE]: { standard: 10, prioritaire: 5 },
  [TypeSoin.ANALYSES]: { standard: 5, prioritaire: 2 },
  [TypeSoin.RADIOLOGIE]: { standard: 5, prioritaire: 2 },
} as const;

export const TAUX_PENALITE_RETARD = {
  [TypeSoin.HOSPITALISATION_URGENCE]: 0.01, // 1% par jour
  DEFAULT: 0.005,                             // 0.5% par jour
} as const;
