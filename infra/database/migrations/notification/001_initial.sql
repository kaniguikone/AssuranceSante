-- =============================================================================
-- NOTIFICATION SERVICE — Migration initiale
-- =============================================================================

CREATE TYPE canal_notification AS ENUM (
  'SMS', 'EMAIL', 'PUSH', 'WHATSAPP', 'COURRIER'
);

CREATE TYPE type_notification AS ENUM (
  'BIENVENUE', 'RAPPEL_ECHEANCE', 'SUSPENSION', 'REACTIVATION', 'RESILIATION', 'RENOUVELLEMENT',
  'SINISTRE_RECU', 'SINISTRE_APPROUVE', 'SINISTRE_REJETE', 'REMBOURSEMENT_EFFECTUE',
  'PAIEMENT_CONFIRME', 'PAIEMENT_ECHOUE', 'RELANCE_PAIEMENT', 'MISE_EN_DEMEURE',
  'RAPPEL_VACCINATION', 'RAPPEL_BILAN_SANTE', 'CAMPAGNE_SANTE'
);

CREATE TYPE statut_notification AS ENUM (
  'EN_ATTENTE', 'ENVOYEE', 'ECHEC', 'LUE'
);

CREATE TABLE templates_notification (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type        type_notification NOT NULL,
  canal       canal_notification NOT NULL,
  langue      VARCHAR(5) NOT NULL DEFAULT 'fr',
  sujet       VARCHAR(255),
  corps       TEXT NOT NULL,  -- Template avec variables {{nom}}, {{montant}}, etc.
  est_actif   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(type, canal, langue)
);

CREATE TABLE notifications (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  destinataire_id     UUID NOT NULL,
  canal               canal_notification NOT NULL,
  type                type_notification NOT NULL,
  statut              statut_notification NOT NULL DEFAULT 'EN_ATTENTE',
  sujet               VARCHAR(255),
  corps               TEXT NOT NULL,
  telephone           VARCHAR(20),
  email               VARCHAR(255),
  tentatives          SMALLINT NOT NULL DEFAULT 0,
  prochaine_relance   TIMESTAMPTZ,
  envoyee_at          TIMESTAMPTZ,
  cout_fcfa           INTEGER,
  reference_externe   VARCHAR(255),
  metadonnees         JSONB,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index
CREATE INDEX idx_notifications_destinataire ON notifications(destinataire_id);
CREATE INDEX idx_notifications_statut ON notifications(statut);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_en_attente ON notifications(prochaine_relance)
  WHERE statut = 'EN_ATTENTE';
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
