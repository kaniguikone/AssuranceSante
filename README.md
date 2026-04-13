# SANTÉ-CI — Système de Gestion d'Assurance Maladie

> Plateforme cloud-native de gestion d'assurance maladie adaptée au contexte ivoirien et africain.

## Démarrage rapide

### Prérequis
- Node.js 20+
- pnpm 9+
- Docker Desktop

### 1. Copier les variables d'environnement
```bash
cp .env.example .env
# Éditer .env avec vos valeurs
```

### 2. Démarrer l'infrastructure
```bash
pnpm infra:up
# PostgreSQL, Redis, Kafka, Keycloak, MinIO, Elasticsearch, ClickHouse
```

### 3. Installer les dépendances
```bash
pnpm install
```

### 4. Lancer tous les services
```bash
pnpm dev
```

## Architecture

```
apps/
├── auth-service/        :3001  Auth JWT + Keycloak + RBAC 15 rôles
├── contract-service/    :3002  Contrats, avenants, résiliations
├── member-service/      :3003  Assurés, cartes tiers-payant, biométrie
├── provider-service/    :3004  Réseau prestataires, géolocalisation
├── claim-service/       :3005  Sinistres, liquidation, workflow
├── billing-service/     :3006  Cotisations, barèmes, facturation
├── payment-service/     :3007  Orange Money, MTN MoMo, Wave
├── notification-service/:3008  SMS (Infobip), Email (SendGrid), Push
├── document-service/    :3009  OCR, PDF, archivage MinIO
├── analytics-service/   :3010  Reporting, BI, exports
├── fraud-service/       :3011  Scoring ML, alertes, blacklists
└── web-app/             :3000  Interface React + Material-UI

libs/
├── types/       Types TypeScript partagés
├── dtos/        DTOs communs
├── utils/       Utilitaires (dates, FCFA, téléphones, phonétique)
└── constants/   Constantes métier (délais, seuils, topics Kafka)

infra/
├── docker/      Docker Compose + configs Keycloak
└── database/    Migrations SQL par service
```

## Interfaces d'administration

| Service         | URL                        |
|-----------------|----------------------------|
| Web App         | http://localhost:3000       |
| Keycloak Admin  | http://localhost:8080       |
| Kafka UI        | http://localhost:8090       |
| MinIO Console   | http://localhost:9001       |
| Adminer (DB)    | http://localhost:8888       |
| MailHog (Email) | http://localhost:8025       |

## Formules de garantie

| Formule  | Couverture                        | Taux remb. | Franchise |
|----------|-----------------------------------|------------|-----------|
| Bronze   | Soins de base                     | 70%        | 5 000 XOF |
| Argent   | + Spécialistes                    | 75%        | 3 000 XOF |
| Or       | + Hospitalisation                 | 80%        | 2 000 XOF |
| Platine  | Tout inclus                       | 90%        | 0 XOF     |

## Opérateurs Mobile Money supportés

- Orange Money CI (actif)
- MTN MoMo (actif)
- Wave Pay (actif)
- Moov Money (Phase 2)

## Standards respectés

- HL7 FHIR R4 (données de santé)
- CIM-10 (codification maladies)
- OHADA (comptabilité)
- ISO 20022 (virements bancaires)
- OWASP Top 10 (sécurité)
- RGPD + loi ivoirienne données personnelles
