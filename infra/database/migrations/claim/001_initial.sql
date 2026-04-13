-- =============================================================================
-- CLAIM SERVICE — Migration initiale
-- =============================================================================

CREATE TYPE type_soin AS ENUM (
  'SOINS_AMBULATOIRES', 'MEDICAMENTS', 'HOSPITALISATION_PLANIFIEE',
  'HOSPITALISATION_URGENCE', 'ACTES_DENTAIRES', 'OPTIQUE', 'ANALYSES', 'RADIOLOGIE'
);

CREATE TYPE statut_sinistre AS ENUM (
  'RECU', 'EN_VERIFICATION', 'EN_VALIDATION_MEDICALE',
  'APPROUVE', 'REJETE', 'EN_LIQUIDATION', 'PAYE', 'CONTESTE', 'FRAUDE_SUSPECTEE'
);

CREATE TYPE mode_depot AS ENUM (
  'SCAN', 'PHOTO', 'SAISIE_MANUELLE', 'TIERS_PAYANT'
);

CREATE TYPE niveau_suspicion AS ENUM ('FAIBLE', 'MOYEN', 'ELEVE', 'CRITIQUE');

CREATE TABLE sinistres (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  numero                  VARCHAR(25) UNIQUE NOT NULL,
  contrat_id              UUID NOT NULL,
  membre_id               UUID NOT NULL,
  prestataire_id          UUID NOT NULL,
  type_soin               type_soin NOT NULL,
  statut                  statut_sinistre NOT NULL DEFAULT 'RECU',
  mode_depot              mode_depot NOT NULL,
  date_soin               DATE NOT NULL,
  date_depot              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  date_limite_traitement  TIMESTAMPTZ NOT NULL,
  -- Montants (FCFA, stockés en centimes = entiers)
  montant_reclame         BIGINT NOT NULL,
  montant_base            BIGINT NOT NULL DEFAULT 0,
  montant_franchise       BIGINT NOT NULL DEFAULT 0,
  montant_rembourse       BIGINT NOT NULL DEFAULT 0,
  montant_co_paiement     BIGINT NOT NULL DEFAULT 0,
  penalite_retard         BIGINT NOT NULL DEFAULT 0,
  -- IA anti-fraude
  score_fraude            SMALLINT CHECK (score_fraude BETWEEN 0 AND 100),
  niveau_suspicion        niveau_suspicion,
  -- Validation
  commentaires_medecin    TEXT,
  motif_rejet             TEXT,
  valide_par              UUID,
  valide_at               TIMESTAMPTZ,
  -- Paiement
  transaction_id          UUID,
  -- OCR
  ocr_extracted           JSONB,
  -- Audit
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by              UUID NOT NULL,
  updated_by              UUID,

  -- Tout sinistre antérieur à la date d'effet est automatiquement rejeté
  -- (contrôle applicatif dans le service)
  CONSTRAINT chk_sinistre_montants CHECK (montant_reclame > 0)
);

CREATE TABLE actes_medicaux (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sinistre_id         UUID NOT NULL REFERENCES sinistres(id) ON DELETE CASCADE,
  code_cim10          VARCHAR(10),
  code_nomenclature   VARCHAR(20),
  designation         VARCHAR(300) NOT NULL,
  quantite            SMALLINT NOT NULL DEFAULT 1,
  prix_unitaire       BIGINT NOT NULL,
  montant_total       BIGINT NOT NULL,
  date_acte           DATE NOT NULL
);

CREATE TABLE documents_sinistre (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sinistre_id UUID NOT NULL REFERENCES sinistres(id) ON DELETE CASCADE,
  type_doc    VARCHAR(50) NOT NULL,  -- FEUILLE_SOINS, ORDONNANCE, FACTURE, etc.
  url         TEXT NOT NULL,
  nom_fichier VARCHAR(255),
  taille_ko   INTEGER,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE historique_sinistres (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sinistre_id UUID NOT NULL REFERENCES sinistres(id),
  statut_avant statut_sinistre,
  statut_apres statut_sinistre NOT NULL,
  commentaire TEXT,
  effectue_par UUID NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index
CREATE INDEX idx_sinistres_contrat ON sinistres(contrat_id);
CREATE INDEX idx_sinistres_membre ON sinistres(membre_id);
CREATE INDEX idx_sinistres_statut ON sinistres(statut);
CREATE INDEX idx_sinistres_type_soin ON sinistres(type_soin);
CREATE INDEX idx_sinistres_date_depot ON sinistres(date_depot DESC);
CREATE INDEX idx_sinistres_score_fraude ON sinistres(score_fraude) WHERE score_fraude >= 50;
CREATE INDEX idx_actes_sinistre ON actes_medicaux(sinistre_id);
