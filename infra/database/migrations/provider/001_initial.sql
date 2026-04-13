-- =============================================================================
-- PROVIDER SERVICE — Migration initiale
-- =============================================================================

CREATE TYPE type_prestataire AS ENUM (
  'CLINIQUE_HOPITAL', 'CABINET_MEDICAL', 'PHARMACIE', 'LABORATOIRE',
  'CABINET_DENTAIRE', 'OPTICIEN', 'CENTRE_RADIOLOGIE'
);

CREATE TYPE statut_prestataire AS ENUM (
  'ACTIF', 'SUSPENDU', 'BLACKLISTE', 'EN_COURS_AGREMENT'
);

CREATE TABLE prestataires (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code                  VARCHAR(15) UNIQUE NOT NULL,
  type                  type_prestataire NOT NULL,
  raison_sociale        VARCHAR(200) NOT NULL,
  numero_agrement       VARCHAR(50) UNIQUE NOT NULL,
  statut                statut_prestataire NOT NULL DEFAULT 'EN_COURS_AGREMENT',
  -- Contact
  telephone             VARCHAR(20) NOT NULL,
  email                 VARCHAR(255),
  -- Adresse et géolocalisation
  adresse_rue           VARCHAR(200),
  adresse_quartier      VARCHAR(100),
  adresse_commune       VARCHAR(100) NOT NULL,
  adresse_ville         VARCHAR(100) NOT NULL DEFAULT 'Abidjan',
  adresse_region        VARCHAR(50),
  latitude              NUMERIC(9,6),
  longitude             NUMERIC(9,6),
  -- Activité
  specialites           TEXT[],
  accepte_tiers_pay     BOOLEAN NOT NULL DEFAULT FALSE,
  -- Paiement
  iban                  VARCHAR(34),
  numero_mobile_money   VARCHAR(20),
  -- Évaluation
  note_evaluation       NUMERIC(3,1) NOT NULL DEFAULT 0.0 CHECK (note_evaluation BETWEEN 0 AND 5),
  nombre_evaluations    INTEGER NOT NULL DEFAULT 0,
  -- Convention
  date_convention       DATE NOT NULL,
  date_fin_convention   DATE,
  -- Audit
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by            UUID NOT NULL
);

CREATE TABLE tarifs_conventionnes (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  prestataire_id      UUID NOT NULL REFERENCES prestataires(id),
  code_acte           VARCHAR(20) NOT NULL,
  designation         VARCHAR(300) NOT NULL,
  tarif               BIGINT NOT NULL,
  tarif_max_autorise  BIGINT NOT NULL,
  type_prestataire    type_prestataire NOT NULL,
  valable_depuis      DATE NOT NULL,
  valable_jusqu       DATE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(prestataire_id, code_acte, valable_depuis)
);

CREATE TABLE evaluations_prestataires (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  prestataire_id  UUID NOT NULL REFERENCES prestataires(id),
  membre_id       UUID NOT NULL,
  sinistre_id     UUID,
  note            SMALLINT NOT NULL CHECK (note BETWEEN 1 AND 5),
  commentaire     TEXT,
  est_modere      BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(prestataire_id, membre_id, sinistre_id)
);

-- Index
CREATE INDEX idx_prestataires_type ON prestataires(type);
CREATE INDEX idx_prestataires_statut ON prestataires(statut);
CREATE INDEX idx_prestataires_geo ON prestataires(latitude, longitude) WHERE latitude IS NOT NULL;
CREATE INDEX idx_prestataires_commune ON prestataires(adresse_commune);
CREATE INDEX idx_tarifs_prestataire ON tarifs_conventionnes(prestataire_id);
CREATE INDEX idx_tarifs_code_acte ON tarifs_conventionnes(code_acte);
