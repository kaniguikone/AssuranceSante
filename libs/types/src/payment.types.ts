import { UUID, FCFA, ISO8601, AuditFields } from './common.types';

export enum OperateurPaiement {
  ORANGE_MONEY = 'ORANGE_MONEY',
  MTN_MOMO = 'MTN_MOMO',
  WAVE = 'WAVE',
  MOOV_MONEY = 'MOOV_MONEY',
  VIREMENT_BANCAIRE = 'VIREMENT_BANCAIRE',
  ESPECES = 'ESPECES',
}

export enum TypeTransaction {
  COTISATION = 'COTISATION',         // Paiement de prime par assuré
  REMBOURSEMENT = 'REMBOURSEMENT',   // Remboursement sinistre vers assuré
  PAIEMENT_PRESTATAIRE = 'PAIEMENT_PRESTATAIRE', // Paiement tiers-payant
  REMISE_COMMERCIALE = 'REMISE_COMMERCIALE',
}

export enum StatutTransaction {
  INITIEE = 'INITIEE',
  EN_ATTENTE = 'EN_ATTENTE',     // En attente confirmation opérateur
  CONFIRMEE = 'CONFIRMEE',
  ECHOUEE = 'ECHOUEE',
  ANNULEE = 'ANNULEE',
  REMBOURSEE = 'REMBOURSEE',     // Transaction inversée
}

export interface Transaction extends AuditFields {
  id: UUID;
  reference: string;            // Format: TXN-2024-XXXXXXXXXX
  referenceOperateur?: string;  // ID transaction côté Orange/MTN/Wave
  type: TypeTransaction;
  operateur: OperateurPaiement;
  montant: FCFA;
  frais: FCFA;                  // Frais opérateur
  montantNet: FCFA;             // montant - frais
  devise: string;               // 'XOF' (FCFA)
  statut: StatutTransaction;
  payeurId?: UUID;              // membreId ou employeurId
  beneficiaireId?: UUID;        // membreId ou prestataireId
  echeanceId?: UUID;
  sinistraliteId?: UUID;
  numerotelephone?: string;     // Pour mobile money
  ibanBeneficiaire?: string;    // Pour virement
  metadonnees?: Record<string, unknown>; // Données spécifiques opérateur
  webhookRecu: boolean;
  webhookData?: Record<string, unknown>;
}
