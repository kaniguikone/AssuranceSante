// ─── Constantes globales SANTÉ-CI ─────────────────────────────────────────────

// Délai de grâce paiement (jours)
export const DELAI_GRACE_PAIEMENT_JOURS = 30;

// Délai réactivation après suspension (jours)
export const DELAI_REACTIVATION_SUSPENSION_JOURS = 60;

// Minimum adhérents contrat collectif
export const MIN_ADHERENTS_COLLECTIF = 10;

// Seuil double validation avenant (FCFA)
export const SEUIL_DOUBLE_VALIDATION_AVENANT = 5_000_000;

// Préavis résiliation par assureur (mois)
export const PREAVIS_RESILIATION_ASSUREUR_MOIS = 3;

// Limite date d'effet (jours avant souscription)
export const LIMITE_DATE_EFFET_JOURS = 30;

// Âge max enfant bénéficiaire
export const AGE_MAX_ENFANT_BENEFICIAIRE = 21;
export const AGE_MAX_ENFANT_ETUDIANT = 25;

// Taux pénalité retard remboursement
export const TAUX_PENALITE_STANDARD = 0.005;  // 0.5%/jour
export const TAUX_PENALITE_URGENCE = 0.01;    // 1%/jour

// Notifications préalables renouvellement (jours)
export const DELAIS_NOTIFICATION_RENOUVELLEMENT = [60, 30, 15];

// SMS
export const COUT_SMS_FCFA = 35;
export const TIMEOUT_SMS_SECONDES = 30;

// Kafka topics
export const KAFKA_TOPICS = {
  CONTRACT_CREATED: 'contract.created',
  CONTRACT_SUSPENDED: 'contract.suspended',
  CONTRACT_TERMINATED: 'contract.terminated',
  MEMBER_REGISTERED: 'member.registered',
  CLAIM_SUBMITTED: 'claim.submitted',
  CLAIM_APPROVED: 'claim.approved',
  CLAIM_REJECTED: 'claim.rejected',
  PAYMENT_CONFIRMED: 'payment.confirmed',
  PAYMENT_FAILED: 'payment.failed',
  ECHEANCE_DUE: 'billing.echeance.due',
  NOTIFICATION_SEND: 'notification.send',
} as const;

// Codes région Côte d'Ivoire
export const REGIONS_CI = [
  'ABIDJAN', 'BOUAKE', 'DALOA', 'KORHOGO', 'SAN_PEDRO',
  'YAMOUSSOUKRO', 'MAN', 'DIVO', 'ABENGOUROU', 'GAGNOA',
] as const;

export type RegionCI = (typeof REGIONS_CI)[number];
