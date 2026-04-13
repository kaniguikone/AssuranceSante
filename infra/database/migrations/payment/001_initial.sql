-- =============================================================================
-- PAYMENT SERVICE — Migration initiale
-- =============================================================================

CREATE TYPE operateur_paiement AS ENUM (
  'ORANGE_MONEY', 'MTN_MOMO', 'WAVE', 'MOOV_MONEY',
  'VIREMENT_BANCAIRE', 'ESPECES'
);

CREATE TYPE type_transaction AS ENUM (
  'COTISATION', 'REMBOURSEMENT', 'PAIEMENT_PRESTATAIRE', 'REMISE_COMMERCIALE'
);

CREATE TYPE statut_transaction AS ENUM (
  'INITIEE', 'EN_ATTENTE', 'CONFIRMEE', 'ECHOUEE', 'ANNULEE', 'REMBOURSEE'
);

CREATE TABLE transactions (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reference             VARCHAR(30) UNIQUE NOT NULL,
  reference_operateur   VARCHAR(255),
  type                  type_transaction NOT NULL,
  operateur             operateur_paiement NOT NULL,
  montant               BIGINT NOT NULL,
  frais                 BIGINT NOT NULL DEFAULT 0,
  montant_net           BIGINT NOT NULL,
  devise                VARCHAR(5) NOT NULL DEFAULT 'XOF',
  statut                statut_transaction NOT NULL DEFAULT 'INITIEE',
  payeur_id             UUID,
  beneficiaire_id       UUID,
  echeance_id           UUID,
  sinistre_id           UUID,
  numero_telephone      VARCHAR(20),
  iban_beneficiaire     VARCHAR(34),
  metadonnees           JSONB,
  webhook_recu          BOOLEAN NOT NULL DEFAULT FALSE,
  webhook_data          JSONB,
  webhook_at            TIMESTAMPTZ,
  expire_at             TIMESTAMPTZ,  -- Pour les liens de paiement
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by            UUID
);

CREATE TABLE rapprochements (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transaction_id    UUID NOT NULL REFERENCES transactions(id),
  statut_operateur  VARCHAR(50) NOT NULL,
  montant_operateur BIGINT NOT NULL,
  ecart             BIGINT NOT NULL DEFAULT 0,
  rapproche_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  rapproche_par     UUID
);

-- Index
CREATE INDEX idx_transactions_statut ON transactions(statut);
CREATE INDEX idx_transactions_payeur ON transactions(payeur_id);
CREATE INDEX idx_transactions_echeance ON transactions(echeance_id);
CREATE INDEX idx_transactions_sinistre ON transactions(sinistre_id);
CREATE INDEX idx_transactions_operateur ON transactions(operateur, statut);
CREATE INDEX idx_transactions_reference ON transactions(reference);
CREATE INDEX idx_transactions_created_at ON transactions(created_at DESC);
