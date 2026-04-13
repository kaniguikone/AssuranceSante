-- =============================================================================
-- CONTRACT SERVICE — Migration initiale
-- =============================================================================

CREATE TYPE statut_contrat AS ENUM (
  'EN_ATTENTE', 'ACTIF', 'SUSPENDU', 'RESILIE', 'EXPIRE', 'EN_COURS_RESILIATION'
);

CREATE TYPE type_contrat AS ENUM (
  'INDIVIDUEL', 'FAMILLE', 'COLLECTIF', 'ENTREPRISE'
);

CREATE TYPE garantie_formule AS ENUM (
  'BRONZE', 'ARGENT', 'OR', 'PLATINE'
);

CREATE TYPE type_avenant AS ENUM (
  'CHANGEMENT_FORMULE', 'AJOUT_BENEFICIAIRE', 'RETRAIT_BENEFICIAIRE',
  'CHANGEMENT_COORDONNEES', 'MODIFICATION_FRANCHISE', 'AUTRE'
);

CREATE TABLE produits (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  formule               garantie_formule NOT NULL,
  nom                   VARCHAR(100) NOT NULL,
  description           TEXT,
  franchise             BIGINT NOT NULL DEFAULT 0,
  plafond_annuel        BIGINT NOT NULL,
  taux_remboursement    SMALLINT NOT NULL CHECK (taux_remboursement BETWEEN 0 AND 100),
  co_paiement           SMALLINT NOT NULL DEFAULT 0,
  plafond_hospitalisation BIGINT,
  plafond_dentaire      BIGINT,
  plafond_optique       BIGINT,
  est_actif             BOOLEAN NOT NULL DEFAULT TRUE,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE contrats (
  id                        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  numero                    VARCHAR(20) UNIQUE NOT NULL,
  type                      type_contrat NOT NULL,
  statut                    statut_contrat NOT NULL DEFAULT 'EN_ATTENTE',
  souscripteur_id           UUID NOT NULL,  -- Ref member-service
  employeur_id              UUID,           -- Pour contrats collectifs
  produit_id                UUID NOT NULL REFERENCES produits(id),
  formule                   garantie_formule NOT NULL,
  -- Paramètres garantie (snapshot au moment de la souscription)
  franchise                 BIGINT NOT NULL,
  plafond_annuel            BIGINT NOT NULL,
  taux_remboursement        SMALLINT NOT NULL,
  co_paiement               SMALLINT NOT NULL,
  plafond_hospitalisation   BIGINT,
  plafond_dentaire          BIGINT,
  plafond_optique           BIGINT,
  -- Dates
  date_souscription         DATE NOT NULL DEFAULT CURRENT_DATE,
  date_effet                DATE NOT NULL,
  date_echeance             DATE NOT NULL,
  date_suspension           TIMESTAMPTZ,
  date_resiliation          TIMESTAMPTZ,
  motif_resiliation         TEXT,
  -- Financier
  prime_annuelle            BIGINT NOT NULL,
  prime_mensuelle           BIGINT NOT NULL,
  -- Documents
  document_contrat_url      TEXT,
  signature_hash            VARCHAR(255),
  -- Collectifs
  est_renouvellement_auto   BOOLEAN NOT NULL DEFAULT TRUE,
  nombre_adherents_min      SMALLINT DEFAULT 10,
  -- Audit
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by                UUID NOT NULL,
  updated_by                UUID,

  -- Contrainte: date d'effet ne peut être antérieure à J-30
  CONSTRAINT chk_date_effet CHECK (date_effet >= (date_souscription - INTERVAL '30 days'))
);

CREATE TABLE avenants (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contrat_id          UUID NOT NULL REFERENCES contrats(id),
  numero              VARCHAR(20) UNIQUE NOT NULL,
  type                type_avenant NOT NULL,
  description         TEXT NOT NULL,
  date_effet          DATE NOT NULL,
  prime_avant         BIGINT NOT NULL,
  prime_apres         BIGINT NOT NULL,
  validation_requise  BOOLEAN NOT NULL DEFAULT FALSE,
  valide_par          UUID,
  valide_par_2        UUID,   -- Double validation si prime > 5M FCFA
  valide_at           TIMESTAMPTZ,
  document_url        TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by          UUID NOT NULL
);

CREATE TABLE historique_contrats (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contrat_id  UUID NOT NULL REFERENCES contrats(id),
  action      VARCHAR(50) NOT NULL,
  statut_avant statut_contrat,
  statut_apres statut_contrat,
  donnees     JSONB,
  effectue_par UUID NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index
CREATE INDEX idx_contrats_souscripteur ON contrats(souscripteur_id);
CREATE INDEX idx_contrats_statut ON contrats(statut);
CREATE INDEX idx_contrats_date_echeance ON contrats(date_echeance);
CREATE INDEX idx_contrats_employeur ON contrats(employeur_id);
CREATE INDEX idx_avenants_contrat ON avenants(contrat_id);
CREATE INDEX idx_historique_contrat ON historique_contrats(contrat_id);

-- Seed: produits de base
INSERT INTO produits (formule, nom, description, franchise, plafond_annuel, taux_remboursement, co_paiement)
VALUES
  ('BRONZE', 'Formule Bronze', 'Soins de base : consultations généralistes, médicaments essentiels', 5000, 500000, 70, 30),
  ('ARGENT', 'Formule Argent', 'Bronze + spécialistes et analyses', 3000, 1500000, 75, 25),
  ('OR', 'Formule Or', 'Argent + hospitalisation et chirurgie', 2000, 5000000, 80, 20),
  ('PLATINE', 'Formule Platine', 'Couverture complète tout inclus', 0, 15000000, 90, 10);
