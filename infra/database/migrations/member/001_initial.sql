-- =============================================================================
-- MEMBER SERVICE — Migration initiale
-- =============================================================================

CREATE TYPE statut_membre AS ENUM ('ACTIF', 'SUSPENDU', 'RADIE');
CREATE TYPE lien_parente AS ENUM ('PRINCIPAL', 'CONJOINT', 'ENFANT', 'AUTRE');
CREATE TYPE type_document AS ENUM ('CNI', 'PASSEPORT', 'TITRE_SEJOUR', 'PERMIS_CONDUIRE');

CREATE TABLE membres (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  numero_carte            VARCHAR(20) UNIQUE NOT NULL,
  nni                     VARCHAR(50) UNIQUE,     -- Numéro National d'Identification
  type_document           type_document NOT NULL,
  numero_document         VARCHAR(50) NOT NULL,
  nom                     VARCHAR(100) NOT NULL,
  prenoms                 VARCHAR(150) NOT NULL,
  -- Recherche phonétique (soundex africain)
  nom_phonetique          VARCHAR(10),
  prenoms_phonetique      VARCHAR(10),
  date_naissance          DATE NOT NULL,
  genre                   CHAR(1) NOT NULL CHECK (genre IN ('M', 'F')),
  nationalite             VARCHAR(50) NOT NULL DEFAULT 'Ivoirienne',
  -- Contact
  telephone               VARCHAR(20) NOT NULL,
  telephone_secondaire    VARCHAR(20),
  email                   VARCHAR(255),
  adresse_rue             VARCHAR(200),
  adresse_quartier        VARCHAR(100),
  adresse_commune         VARCHAR(100) NOT NULL,
  adresse_ville           VARCHAR(100) NOT NULL DEFAULT 'Abidjan',
  adresse_region          VARCHAR(50),
  -- Documents
  photo_url               TEXT,
  empreinte_hash          VARCHAR(255),
  -- Statut
  statut                  statut_membre NOT NULL DEFAULT 'ACTIF',
  -- Contrat & affiliation
  contrat_id              UUID NOT NULL,
  employeur_id            UUID,
  lien_parente            lien_parente NOT NULL DEFAULT 'PRINCIPAL',
  membre_principal_id     UUID REFERENCES membres(id),
  date_affiliation        DATE NOT NULL DEFAULT CURRENT_DATE,
  date_fin_affiliation    DATE,
  -- Enfants étudiants
  est_etudiant            BOOLEAN DEFAULT FALSE,
  etablissement_scolaire  VARCHAR(200),
  -- Vérification SNEDAI
  snedai_verifie          BOOLEAN NOT NULL DEFAULT FALSE,
  snedai_verifie_at       TIMESTAMPTZ,
  -- Audit
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by              UUID NOT NULL,
  updated_by              UUID,

  CONSTRAINT chk_membre_principal CHECK (
    (lien_parente = 'PRINCIPAL' AND membre_principal_id IS NULL) OR
    (lien_parente != 'PRINCIPAL' AND membre_principal_id IS NOT NULL)
  )
);

CREATE TABLE cartes_tiers_payant (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  membre_id       UUID NOT NULL REFERENCES membres(id) ON DELETE CASCADE,
  numero          VARCHAR(20) UNIQUE NOT NULL,
  qr_code_data    TEXT NOT NULL,
  nfc_token       VARCHAR(255),
  code_pin_hash   VARCHAR(255) NOT NULL,
  date_emission   DATE NOT NULL DEFAULT CURRENT_DATE,
  date_expiration DATE NOT NULL,
  est_active      BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE mutations_emploi (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  membre_id             UUID NOT NULL REFERENCES membres(id),
  ancien_employeur_id   UUID,
  nouvel_employeur_id   UUID NOT NULL,
  ancien_contrat_id     UUID,
  nouveau_contrat_id    UUID NOT NULL,
  date_mutation         DATE NOT NULL,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by            UUID NOT NULL
);

-- Index pour performance
CREATE INDEX idx_membres_contrat ON membres(contrat_id);
CREATE INDEX idx_membres_statut ON membres(statut);
CREATE INDEX idx_membres_principal ON membres(membre_principal_id);
CREATE INDEX idx_membres_nni ON membres(nni) WHERE nni IS NOT NULL;
CREATE INDEX idx_membres_document ON membres(type_document, numero_document);
-- Index trigram pour recherche floue sur noms
CREATE INDEX idx_membres_nom_trgm ON membres USING GIN (nom gin_trgm_ops);
CREATE INDEX idx_membres_prenoms_trgm ON membres USING GIN (prenoms gin_trgm_ops);
-- Index phonétique
CREATE INDEX idx_membres_phonetique ON membres(nom_phonetique, prenoms_phonetique);
