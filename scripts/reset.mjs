/**
 * Script de reset — SANTÉ-CI
 * Vide les tables métier sans supprimer les produits ni les users
 * Usage : node scripts/reset.mjs
 * Prérequis : container Docker sante-ci-postgres en cours d'exécution
 */

import { execSync } from 'node:child_process';

const CONTAINER = 'sante-ci-postgres';
const USER      = 'sante_ci';

function psql(db, sql) {
  try {
    execSync(
      `docker exec ${CONTAINER} psql -U ${USER} -d ${db} -c "${sql}"`,
      { stdio: 'pipe' }
    );
    return true;
  } catch (e) {
    console.error(`   ✗ ${db}: ${e.stderr?.toString().trim() ?? e.message}`);
    return false;
  }
}

const tables = [
  { db: 'sante_claim',    sql: 'TRUNCATE sinistres CASCADE;',                   label: 'sinistres' },
  { db: 'sante_billing',  sql: 'TRUNCATE echeances CASCADE;',                   label: 'écheances' },
  { db: 'sante_member',   sql: 'TRUNCATE membres, cartes_tiers_payant CASCADE;', label: 'membres + cartes' },
  { db: 'sante_contract', sql: 'TRUNCATE avenants, contrats CASCADE;',          label: 'contrats + avenants' },
];

console.log('🗑️  Reset des données SANTÉ-CI...\n');

for (const t of tables) {
  process.stdout.write(`   Vidage ${t.label}...`);
  const ok = psql(t.db, t.sql);
  console.log(ok ? ' ✓' : '');
}

console.log('\n✅ Reset terminé. Lance node scripts/seed.mjs pour repeupler.\n');
