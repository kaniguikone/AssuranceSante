-- =============================================================================
-- BILLING SERVICE — Migration initiale
-- =============================================================================

CREATE TYPE statut_echeance AS ENUM (
  'EN_ATTENTE', 'PAYE', 'EN_RETARD', 'EN_GRACE', 'IMPAYE', 'ANNULE'
);
CREATE TYPE statut_relance AS ENUM (
  'RAPPEL_DOUX', 'RELANCE_FORMELLE', 'MISE_EN_DEMEURE'
);

CREATE TABLE baremes_cotisation (
  id                          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  formule                     VARCHAR(20) NOT NULL,
  age_min                     SMALLINT NOT NULL,
  age_max                     SMALLINT NOT NULL,
  genre                       CHAR(1),  -- NULL = tous genres
  region                      VARCHAR(50),  -- NULL = toutes régions
  prime_mensuelle_base        BIGINT NOT NULL,
  coefficient_profession      NUMERIC(4,2) NOT NULL DEFAULT 1.00,
  coefficient_antecedents     NUMERIC(4,2) NOT NULL DEFAULT 1.00,
  valable_depuis              DATE NOT NULL,
  valable_jusqu               DATE,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE echeances (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contrat_id            UUID NOT NULL,
  membre_id             UUID NOT NULL,
  numero                VARCHAR(25) UNIQUE NOT NULL,
  periode               VARCHAR(7) NOT NULL,  -- Format AAAA-MM
  montant_du            BIGINT NOT NULL,
  montant_paye          BIGINT NOT NULL DEFAULT 0,
  date_echeance         DATE NOT NULL,
  date_limite_paiement  DATE NOT NULL,  -- date_echeance + 30j de grâce
  date_paiement         TIMESTAMPTZ,
  statut                statut_echeance NOT NULL DEFAULT 'EN_ATTENTE',
  statut_relance        statut_relance,
  nombre_relances       SMALLINT NOT NULL DEFAULT 0,
  prochaine_relance_at  TIMESTAMPTZ,
  penalite_retard       BIGINT NOT NULL DEFAULT 0,
  transaction_id        UUID,  -- Ref payment-service
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE remises_commerciales (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contrat_id      UUID NOT NULL,
  type_remise     VARCHAR(50) NOT NULL,  -- CONTRAT_GROUPE, FIDELITE, etc.
  taux            NUMERIC(5,2) NOT NULL,
  montant_fixe    BIGINT,
  valable_depuis  DATE NOT NULL,
  valable_jusqu   DATE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index
CREATE INDEX idx_echeances_contrat ON echeances(contrat_id);
CREATE INDEX idx_echeances_statut ON echeances(statut);
CREATE INDEX idx_echeances_date_echeance ON echeances(date_echeance);
CREATE INDEX idx_echeances_periode ON echeances(periode);
CREATE INDEX idx_baremes_formule ON baremes_cotisation(formule, age_min, age_max);

-- Seed: barèmes de base (FCFA/mois)
INSERT INTO baremes_cotisation (formule, age_min, age_max, prime_mensuelle_base, valable_depuis)
VALUES
  ('BRONZE', 0,   17,  3500,  '2024-01-01'),
  ('BRONZE', 18,  35,  6500,  '2024-01-01'),
  ('BRONZE', 36,  50,  9000,  '2024-01-01'),
  ('BRONZE', 51,  65,  14000, '2024-01-01'),
  ('BRONZE', 66,  99,  20000, '2024-01-01'),
  ('ARGENT', 0,   17,  7000,  '2024-01-01'),
  ('ARGENT', 18,  35,  12000, '2024-01-01'),
  ('ARGENT', 36,  50,  18000, '2024-01-01'),
  ('ARGENT', 51,  65,  28000, '2024-01-01'),
  ('ARGENT', 66,  99,  40000, '2024-01-01'),
  ('OR',     0,   17,  12000, '2024-01-01'),
  ('OR',     18,  35,  22000, '2024-01-01'),
  ('OR',     36,  50,  35000, '2024-01-01'),
  ('OR',     51,  65,  55000, '2024-01-01'),
  ('OR',     66,  99,  80000, '2024-01-01'),
  ('PLATINE',0,   17,  25000, '2024-01-01'),
  ('PLATINE',18,  35,  45000, '2024-01-01'),
  ('PLATINE',36,  50,  70000, '2024-01-01'),
  ('PLATINE',51,  65,  110000,'2024-01-01'),
  ('PLATINE',66,  99,  160000,'2024-01-01');
