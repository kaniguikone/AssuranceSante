import { UUID, ISO8601, AuditFields } from './common.types';

export enum CanalNotification {
  SMS = 'SMS',
  EMAIL = 'EMAIL',
  PUSH = 'PUSH',
  WHATSAPP = 'WHATSAPP',
  COURRIER = 'COURRIER',
}

export enum TypeNotification {
  // Contrats
  BIENVENUE = 'BIENVENUE',
  RAPPEL_ECHEANCE = 'RAPPEL_ECHEANCE',       // J-60, J-30, J-15
  SUSPENSION = 'SUSPENSION',
  REACTIVATION = 'REACTIVATION',
  RESILIATION = 'RESILIATION',
  RENOUVELLEMENT = 'RENOUVELLEMENT',

  // Sinistres
  SINISTRE_RECU = 'SINISTRE_RECU',
  SINISTRE_APPROUVE = 'SINISTRE_APPROUVE',
  SINISTRE_REJETE = 'SINISTRE_REJETE',
  REMBOURSEMENT_EFFECTUE = 'REMBOURSEMENT_EFFECTUE',

  // Paiements
  PAIEMENT_CONFIRME = 'PAIEMENT_CONFIRME',
  PAIEMENT_ECHOUE = 'PAIEMENT_ECHOUE',
  RELANCE_PAIEMENT = 'RELANCE_PAIEMENT',
  MISE_EN_DEMEURE = 'MISE_EN_DEMEURE',

  // Prévention
  RAPPEL_VACCINATION = 'RAPPEL_VACCINATION',
  RAPPEL_BILAN_SANTE = 'RAPPEL_BILAN_SANTE',
  CAMPAGNE_SANTE = 'CAMPAGNE_SANTE',
}

export enum StatutNotification {
  EN_ATTENTE = 'EN_ATTENTE',
  ENVOYEE = 'ENVOYEE',
  ECHEC = 'ECHEC',
  LUE = 'LUE',
}

export interface Notification extends AuditFields {
  id: UUID;
  destinataireId: UUID;         // membreId
  canal: CanalNotification;
  type: TypeNotification;
  statut: StatutNotification;
  sujet?: string;               // Pour email
  corps: string;
  telephone?: string;
  email?: string;
  tentatives: number;
  prochainEssai?: ISO8601;
  envoyeeAt?: ISO8601;
  coutFcfa?: number;            // 35 FCFA pour SMS
  referenceExterne?: string;    // ID Infobip/SendGrid
}
