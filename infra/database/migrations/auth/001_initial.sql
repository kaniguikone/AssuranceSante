-- =============================================================================
-- AUTH SERVICE — Migration initiale
-- =============================================================================

CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  keycloak_id   VARCHAR(255) UNIQUE NOT NULL,
  email         VARCHAR(255) UNIQUE NOT NULL,
  nom           VARCHAR(100) NOT NULL,
  prenoms       VARCHAR(150) NOT NULL,
  telephone     VARCHAR(20),
  est_actif     BOOLEAN NOT NULL DEFAULT TRUE,
  mfa_active    BOOLEAN NOT NULL DEFAULT FALSE,
  derniere_connexion TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by    UUID
);

CREATE TABLE user_roles (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role        VARCHAR(50) NOT NULL,
  granted_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  granted_by  UUID NOT NULL,
  revoked_at  TIMESTAMPTZ,
  UNIQUE(user_id, role)
);

CREATE TABLE audit_logs (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID REFERENCES users(id),
  action        VARCHAR(100) NOT NULL,
  ressource     VARCHAR(100) NOT NULL,
  ressource_id  VARCHAR(255),
  donnees_avant JSONB,
  donnees_apres JSONB,
  ip_address    INET,
  user_agent    TEXT,
  statut        VARCHAR(20) NOT NULL DEFAULT 'SUCCESS', -- SUCCESS, FAILURE
  message_erreur TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE refresh_tokens (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash  VARCHAR(255) NOT NULL UNIQUE,
  expire_at   TIMESTAMPTZ NOT NULL,
  revoked_at  TIMESTAMPTZ,
  ip_address  INET,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_ressource ON audit_logs(ressource, ressource_id);
CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
