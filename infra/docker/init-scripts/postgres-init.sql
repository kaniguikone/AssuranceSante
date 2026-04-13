-- =============================================================================
-- SANTÉ-CI — Initialisation PostgreSQL
-- Création des bases de données par microservice
-- =============================================================================

-- Base Keycloak
CREATE DATABASE sante_keycloak;

-- Bases de données des microservices
CREATE DATABASE sante_auth;
CREATE DATABASE sante_contract;
CREATE DATABASE sante_member;
CREATE DATABASE sante_billing;
CREATE DATABASE sante_payment;
CREATE DATABASE sante_claim;
CREATE DATABASE sante_provider;
CREATE DATABASE sante_fraud;
CREATE DATABASE sante_notification;
CREATE DATABASE sante_document;

-- Accorder les droits à l'utilisateur principal
GRANT ALL PRIVILEGES ON DATABASE sante_keycloak TO sante_ci;
GRANT ALL PRIVILEGES ON DATABASE sante_auth TO sante_ci;
GRANT ALL PRIVILEGES ON DATABASE sante_contract TO sante_ci;
GRANT ALL PRIVILEGES ON DATABASE sante_member TO sante_ci;
GRANT ALL PRIVILEGES ON DATABASE sante_billing TO sante_ci;
GRANT ALL PRIVILEGES ON DATABASE sante_payment TO sante_ci;
GRANT ALL PRIVILEGES ON DATABASE sante_claim TO sante_ci;
GRANT ALL PRIVILEGES ON DATABASE sante_provider TO sante_ci;
GRANT ALL PRIVILEGES ON DATABASE sante_fraud TO sante_ci;
GRANT ALL PRIVILEGES ON DATABASE sante_notification TO sante_ci;
GRANT ALL PRIVILEGES ON DATABASE sante_document TO sante_ci;

-- Extensions utiles (activées sur chaque base via migrations)
\c sante_auth
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

\c sante_contract
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

\c sante_member
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- Recherche floue sur noms

\c sante_billing
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

\c sante_payment
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

\c sante_claim
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

\c sante_provider
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis"; -- Géolocalisation (si disponible)

\c sante_fraud
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

\c sante_notification
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
