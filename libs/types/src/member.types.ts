import { UUID, ISO8601, Gender, DocumentType, ContactInfo, AuditFields } from './common.types';

export enum StatutMembre {
  ACTIF = 'ACTIF',
  SUSPENDU = 'SUSPENDU',
  RADIE = 'RADIE',
}

export enum LienParente {
  PRINCIPAL = 'PRINCIPAL',
  CONJOINT = 'CONJOINT',
  ENFANT = 'ENFANT',
  AUTRE = 'AUTRE',
}

export interface Membre extends AuditFields {
  id: UUID;
  numeroCarte: string;          // Format: SC-XXXXXXXX (Santé-CI)
  nni?: string;                 // Numéro National d'Identification
  typeDocument: DocumentType;
  numeroDocument: string;
  nom: string;
  prenoms: string;
  dateNaissance: ISO8601;
  genre: Gender;
  nationalite: string;
  contact: ContactInfo;
  photoUrl?: string;            // URL MinIO
  empreinteHash?: string;       // Hash de l'empreinte digitale
  statut: StatutMembre;
  contratId: UUID;
  employeurId?: UUID;
  lienParente: LienParente;
  membrePrincipalId?: UUID;     // Pour ayants droit
  dateAffiliation: ISO8601;
  dateFinAffiliation?: ISO8601;
  estEtudiant?: boolean;        // Enfants: jusqu'à 25 ans si études
  etablissementScolaire?: string;
  snedaiVerifie: boolean;       // Vérification identité via SNEDAI
  snedaiVerifieAt?: ISO8601;
}

export interface CarteTiersPay {
  id: UUID;
  membreId: UUID;
  numero: string;
  qrCodeData: string;
  nfcToken?: string;
  codePin: string;              // Hashé en base
  dateEmission: ISO8601;
  dateExpiration: ISO8601;
  estActive: boolean;
}
