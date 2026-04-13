import { UUID } from './common.types';

// ─── Rôles RBAC (15 rôles selon specs) ────────────────────────────────────────
export enum UserRole {
  // Administration
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',

  // Gestion commerciale
  COMMERCIAL = 'COMMERCIAL',
  GESTIONNAIRE_CONTRATS = 'GESTIONNAIRE_CONTRATS',

  // Gestion sinistres
  GESTIONNAIRE_SINISTRES = 'GESTIONNAIRE_SINISTRES',
  MEDECIN_CONSEIL = 'MEDECIN_CONSEIL',
  LIQUIDATEUR = 'LIQUIDATEUR',

  // Finance
  COMPTABLE = 'COMPTABLE',
  CAISSIER = 'CAISSIER',

  // Fraude et conformité
  AGENT_FRAUDE = 'AGENT_FRAUDE',
  AUDITEUR = 'AUDITEUR',

  // Partenaires
  PRESTATAIRE = 'PRESTATAIRE', // Médecins, cliniques, pharmacies
  EMPLOYEUR = 'EMPLOYEUR',     // Entreprises avec contrats collectifs

  // Assurés
  ASSURE = 'ASSURE',
  BENEFICIAIRE = 'BENEFICIAIRE',
}

export interface JwtPayload {
  sub: UUID;          // userId
  email: string;
  roles: UserRole[];
  contractId?: UUID;  // Pour les assurés liés à un contrat
  iat?: number;
  exp?: number;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface UserSession {
  userId: UUID;
  email: string;
  roles: UserRole[];
  lastLoginAt: string;
  ipAddress: string;
}
