import { UUID, FCFA, ISO8601, AuditFields } from './common.types';

// ─── Formules de garantie ──────────────────────────────────────────────────────
export enum GarantieFormule {
  BRONZE = 'BRONZE',   // Soins de base
  ARGENT = 'ARGENT',   // + Spécialistes
  OR = 'OR',           // + Hospitalisation
  PLATINE = 'PLATINE', // Tout inclus
}

export enum TypeContrat {
  INDIVIDUEL = 'INDIVIDUEL',
  FAMILLE = 'FAMILLE',
  COLLECTIF = 'COLLECTIF',   // Entreprise
  ENTREPRISE = 'ENTREPRISE',
}

export enum StatutContrat {
  EN_ATTENTE = 'EN_ATTENTE',       // Souscrit, pas encore effectif
  ACTIF = 'ACTIF',
  SUSPENDU = 'SUSPENDU',           // Non-paiement (réactivable sous 60j)
  RESILIE = 'RESILIE',
  EXPIRE = 'EXPIRE',               // Non renouvelé
  EN_COURS_RESILIATION = 'EN_COURS_RESILIATION',
}

export enum TypeAvenant {
  CHANGEMENT_FORMULE = 'CHANGEMENT_FORMULE',
  AJOUT_BENEFICIAIRE = 'AJOUT_BENEFICIAIRE',
  RETRAIT_BENEFICIAIRE = 'RETRAIT_BENEFICIAIRE',
  CHANGEMENT_COORDONNEES = 'CHANGEMENT_COORDONNEES',
  MODIFICATION_FRANCHISE = 'MODIFICATION_FRANCHISE',
  AUTRE = 'AUTRE',
}

export interface GarantieConfig {
  formule: GarantieFormule;
  franchise: FCFA;              // Montant franchise par sinistre
  plafondAnnuel: FCFA;          // Plafond remboursement annuel
  tauxRemboursement: number;    // En % (ex: 80)
  coPaiement: number;           // % à charge de l'assuré
  plafondHospitalisation?: FCFA;
  plafondDentaire?: FCFA;
  plafondOptique?: FCFA;
}

export interface Contrat extends AuditFields {
  id: UUID;
  numero: string;               // Format: CT-2024-XXXXXX
  type: TypeContrat;
  statut: StatutContrat;
  souscripteurId: UUID;         // Référence au member-service
  employeurId?: UUID;           // Pour contrats collectifs
  formule: GarantieFormule;
  garantieConfig: GarantieConfig;
  dateEffet: ISO8601;
  dateEcheance: ISO8601;
  dateResiliation?: ISO8601;
  motifResiliation?: string;
  primeAnnuelle: FCFA;
  primeMensuelle: FCFA;
  documentContratUrl?: string;  // URL MinIO
  signatureElectroniqueHash?: string;
  nombreAdherentsMin?: number;  // Pour collectifs: min 10
  estRenouvellementAuto: boolean;
}

export interface Avenant extends AuditFields {
  id: UUID;
  contratId: UUID;
  numero: string;               // Format: AV-2024-XXXXXX
  type: TypeAvenant;
  description: string;
  dateEffet: ISO8601;
  primeAvant: FCFA;
  primeApres: FCFA;
  validationRequise: boolean;   // true si prime > 5M FCFA
  validePar?: UUID;
  validatePar2?: UUID;          // Double validation
  documentUrl?: string;
}
