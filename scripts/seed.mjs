/**
 * Script de seed — SANTÉ-CI
 * Usage : node scripts/seed.mjs
 * Prérequis : tous les services backend doivent tourner
 */

const URLS = {
  contract: 'http://localhost:3002/api/v1',
  member:   'http://localhost:3003/api/v1',
  billing:  'http://localhost:3006/api/v1',
  claim:    'http://localhost:3005/api/v1',
};

async function api(base, method, path, body) {
  const res = await fetch(`${base}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`${method} ${base}${path} → ${res.status}: ${txt}`);
  }
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

const get    = (b, p)    => api(b, 'GET',   p);
const post   = (b, p, d) => api(b, 'POST',  p, d);
const patch  = (b, p, d) => api(b, 'PATCH', p, d);

// ────────────────────────────────────────────────────────────────────────────
// Données fictives
// ────────────────────────────────────────────────────────────────────────────

// Suffixe numérique aléatoire (4 chiffres) pour l'unicité du numeroDocument
const RUN_ID = String(Math.floor(1000 + Math.random() * 9000));

const SOUSCRIPTEURS = [
  { nom: 'KONÉ',       prenoms: 'Aboubakar',  dateNaissance: '1985-03-12', genre: 'M', telephone: '+2250701234501', email: 'abouba.kone@email.ci',     typeDocument: 'CNI',       numeroDocument: `CI2023A${RUN_ID}`, adresseCommune: 'Cocody' },
  { nom: 'DIALLO',     prenoms: 'Aminata',    dateNaissance: '1990-07-22', genre: 'F', telephone: '+2250701234502', email: 'aminata.diallo@email.ci',   typeDocument: 'PASSEPORT', numeroDocument: `P023${RUN_ID}`,    adresseCommune: 'Yopougon' },
  { nom: 'OUATTARA',   prenoms: 'Moussa',     dateNaissance: '1978-11-05', genre: 'M', telephone: '+2250701234503', email: 'moussa.ouattara@email.ci',  typeDocument: 'CNI',       numeroDocument: `CI2021B${RUN_ID}`, adresseCommune: 'Plateau' },
  { nom: 'TRAORÉ',     prenoms: 'Fatoumata',  dateNaissance: '1995-01-30', genre: 'F', telephone: '+2250701234504', email: 'fato.traore@email.ci',      typeDocument: 'CNI',       numeroDocument: `CI2022C${RUN_ID}`, adresseCommune: 'Marcory' },
  { nom: 'BAMBA',      prenoms: 'Ibrahim',    dateNaissance: '1982-09-18', genre: 'M', telephone: '+2250701234505', email: 'ibrahim.bamba@email.ci',    typeDocument: 'CNI',       numeroDocument: `CI2020D${RUN_ID}`, adresseCommune: 'Abobo' },
  { nom: 'COULIBALY',  prenoms: 'Rokia',      dateNaissance: '1999-06-11', genre: 'F', telephone: '+2250701234506', email: 'rokia.coulibaly@email.ci',  typeDocument: 'PASSEPORT', numeroDocument: `P0987${RUN_ID}`,   adresseCommune: 'Treichville' },
];

const AYANTS_DROIT = [
  { nom: 'KONÉ',     prenoms: 'Mariam',    dateNaissance: '1987-05-20', genre: 'F', telephone: '+2250702234501', typeDocument: 'CNI', numeroDocument: `CI2023AA${RUN_ID}`, adresseCommune: 'Cocody',  lienParente: 'CONJOINT' },
  { nom: 'KONÉ',     prenoms: 'Séverin',   dateNaissance: '2010-08-14', genre: 'M', telephone: '+2250702234502', typeDocument: 'CNI', numeroDocument: `CI2023AB${RUN_ID}`, adresseCommune: 'Cocody',  lienParente: 'ENFANT' },
  { nom: 'OUATTARA', prenoms: 'Kadiatou',  dateNaissance: '1982-02-28', genre: 'F', telephone: '+2250702234503', typeDocument: 'CNI', numeroDocument: `CI2021BC${RUN_ID}`, adresseCommune: 'Plateau', lienParente: 'CONJOINT' },
];

const SINISTRES_DEF = [
  { typeSoin: 'SOINS_AMBULATOIRES',      modeDepot: 'SCAN',           montantReclame: 45000,  action: 'approuver' },
  { typeSoin: 'MEDICAMENTS',             modeDepot: 'PHOTO',          montantReclame: 28500,  action: 'liquider' },
  { typeSoin: 'HOSPITALISATION_URGENCE', modeDepot: 'SAISIE_MANUELLE',montantReclame: 320000, action: 'none' },
  { typeSoin: 'ACTES_DENTAIRES',         modeDepot: 'SCAN',           montantReclame: 75000,  action: 'rejeter', motifRejet: 'Actes non couverts par la formule souscrite' },
  { typeSoin: 'ANALYSES',                modeDepot: 'SCAN',           montantReclame: 18000,  action: 'liquider' },
  { typeSoin: 'OPTIQUE',                 modeDepot: 'PHOTO',          montantReclame: 55000,  action: 'none' },
  { typeSoin: 'RADIOLOGIE',              modeDepot: 'SCAN',           montantReclame: 35000,  action: 'approuver' },
  { typeSoin: 'HOSPITALISATION_PLANIFIEE', modeDepot: 'SAISIE_MANUELLE', montantReclame: 480000, action: 'none' },
];

// ────────────────────────────────────────────────────────────────────────────
async function main() {
  console.log('🌱 Démarrage du seed SANTÉ-CI...\n');

  // 1. Seed produits
  console.log('📦 Initialisation des produits...');
  try {
    const produits = await post(URLS.contract, '/produits/seed');
    console.log(`   ✓ ${produits.length ?? '?'} produits créés`);
  } catch (e) {
    console.log('   ℹ Produits déjà existants (ou erreur):', e.message);
  }

  // Récupérer les produits
  const produits = await get(URLS.contract, '/produits');
  if (!produits.length) throw new Error('Aucun produit disponible — abandon');
  console.log(`   Produits disponibles: ${produits.map(p => p.formule).join(', ')}\n`);

  const getProduit = (formule) => produits.find(p => p.formule === formule) ?? produits[0];

  // 2. Créer les contrats
  console.log('📝 Création des contrats...');
  const contrats = [];
  const today = new Date();

  // joursEffet : offset en jours depuis aujourd'hui (max -29 à cause du CHECK DB)
  const configs = [
    { souscripteur: SOUSCRIPTEURS[0], formule: 'OR',      type: 'FAMILLE',    joursEffet: -25, dureeAns: 1, activer: true },
    { souscripteur: SOUSCRIPTEURS[1], formule: 'ARGENT',  type: 'INDIVIDUEL', joursEffet: -20, dureeAns: 1, activer: true },
    { souscripteur: SOUSCRIPTEURS[2], formule: 'PLATINE', type: 'INDIVIDUEL', joursEffet: -15, dureeAns: 1, activer: true },
    { souscripteur: SOUSCRIPTEURS[3], formule: 'BRONZE',  type: 'INDIVIDUEL', joursEffet:   0, dureeAns: 1, activer: false },
    { souscripteur: SOUSCRIPTEURS[4], formule: 'ARGENT',  type: 'FAMILLE',    joursEffet: -10, dureeAns: 1, activer: true },
    { souscripteur: SOUSCRIPTEURS[5], formule: 'OR',      type: 'INDIVIDUEL', joursEffet:  -5, dureeAns: 1, activer: true },
  ];

  for (const cfg of configs) {
    const produit = getProduit(cfg.formule);
    const dateEffet = new Date(today);
    dateEffet.setDate(dateEffet.getDate() + cfg.joursEffet);
    const dateEcheance = new Date(dateEffet);
    dateEcheance.setFullYear(dateEcheance.getFullYear() + cfg.dureeAns);

    try {
      const contrat = await post(URLS.contract, '/contracts', {
        type: cfg.type,
        produitId: produit.id,
        dateEffet: dateEffet.toISOString().split('T')[0],
        dateEcheance: dateEcheance.toISOString().split('T')[0],
        estRenouvellementAuto: true,
        nouveauSouscripteur: cfg.souscripteur,
      });
      contrats.push({ ...contrat, cfg });
      console.log(`   ✓ ${contrat.numero} — ${cfg.souscripteur.prenoms} ${cfg.souscripteur.nom} (${cfg.formule})`);
    } catch (e) {
      console.error(`   ✗ Erreur contrat ${cfg.souscripteur.nom}:`, e.message);
    }
  }

  console.log();

  // 3. Activer les contrats
  console.log('✅ Activation des contrats...');
  for (const c of contrats.filter(c => c.cfg.activer)) {
    try {
      await patch(URLS.contract, `/contracts/${c.id}/activer`);
      console.log(`   ✓ ${c.numero} activé`);
    } catch (e) {
      console.error(`   ✗ ${c.numero}:`, e.message);
    }
  }

  console.log();

  // 4. Ajouter des ayants droit sur le 1er contrat FAMILLE
  const contratFamille = contrats.find(c => c.cfg.type === 'FAMILLE' && c.cfg.activer);
  if (contratFamille) {
    console.log(`👨‍👩‍👧 Ajout d'ayants droit sur ${contratFamille.numero}...`);
    for (const ad of AYANTS_DROIT.slice(0, 2)) {
      try {
        await post(URLS.member, '/membres', {
          ...ad,
          contratId: contratFamille.id,
        });
        console.log(`   ✓ ${ad.prenoms} ${ad.nom} (${ad.lienParente})`);
      } catch (e) {
        console.error(`   ✗ ${ad.nom}:`, e.message);
      }
    }
    console.log();
  }

  // 5. Générer les échéances pour les contrats actifs
  console.log('📅 Génération des échéances...');
  const contratsActifs = contrats.filter(c => c.cfg.activer && c.souscripteurId);
  for (const c of contratsActifs) {
    try {
      const echeances = await post(URLS.billing, '/echeances/generer', {
        contratId: c.id,
        membreId: c.souscripteurId,
        primeMensuelle: Number(c.primeMensuelle),
        dateDebut: c.dateEffet,
        dateFin: c.dateEcheance,
      });
      console.log(`   ✓ ${c.numero}: ${echeances.length} échéances générées`);
    } catch (e) {
      console.error(`   ✗ ${c.numero}:`, e.message);
    }
  }

  console.log();

  // 6. Payer quelques échéances sur le 1er contrat
  if (contratsActifs.length > 0) {
    const premierContrat = contratsActifs[0];
    console.log(`💰 Paiement de quelques échéances (${premierContrat.numero})...`);
    try {
      const echeances = await get(URLS.billing, `/echeances/contrat/${premierContrat.id}`);
      const aPayer = echeances.slice(0, 3);
      let idx = 1;
      for (const e of aPayer) {
        await post(URLS.billing, `/echeances/${e.id}/paiement`, {
          montantPaye: Number(e.montantDu),
          transactionId: `VIR-SEED-${Date.now()}-${idx++}`,
        });
        console.log(`   ✓ Échéance ${e.periode} payée (${e.montantDu} XOF)`);
      }
    } catch (e) {
      console.error('   ✗', e.message);
    }
    console.log();
  }

  // 7. Créer les sinistres
  console.log('🏥 Création des sinistres...');
  const contratsAvecMembre = contrats.filter(c => c.souscripteurId && c.cfg.activer);
  const sinistresCreés = [];

  for (let i = 0; i < SINISTRES_DEF.length; i++) {
    const def = SINISTRES_DEF[i];
    const c = contratsAvecMembre[i % contratsAvecMembre.length];
    if (!c) continue;

    // dateSoin = dateEffet du contrat + quelques jours (toujours après l'effet)
    const dateSoin = new Date(c.dateEffet);
    dateSoin.setDate(dateSoin.getDate() + (i % 5) * 3 + 2);

    try {
      const s = await post(URLS.claim, '/sinistres', {
        contratId: c.id,
        membreId: c.souscripteurId,
        prestataireId: 'a0000000-0000-4000-8000-000000000001',
        typeSoin: def.typeSoin,
        modeDepot: def.modeDepot,
        dateSoin: dateSoin.toISOString().split('T')[0],
        dateEffetContrat: c.dateEffet,
        montantReclame: def.montantReclame,
      });
      sinistresCreés.push({ ...s, action: def.action, motifRejet: def.motifRejet });
      console.log(`   ✓ ${s.numero} — ${def.typeSoin} (${def.montantReclame.toLocaleString('fr-CI')} XOF)`);
    } catch (e) {
      console.error(`   ✗ Sinistre ${def.typeSoin}:`, e.message);
    }
  }

  console.log();

  // 8. Traiter les sinistres
  console.log('⚙️  Traitement des sinistres...');
  for (const s of sinistresCreés) {
    try {
      if (s.action === 'approuver') {
        await patch(URLS.claim, `/sinistres/${s.id}/approuver`);
        console.log(`   ✓ ${s.numero} approuvé`);
      } else if (s.action === 'rejeter') {
        await patch(URLS.claim, `/sinistres/${s.id}/rejeter`, { motif: s.motifRejet });
        console.log(`   ✓ ${s.numero} rejeté`);
      } else if (s.action === 'liquider') {
        await patch(URLS.claim, `/sinistres/${s.id}/approuver`);
        await patch(URLS.claim, `/sinistres/${s.id}/liquider`, {
          franchise: 2000,
          tauxRemboursement: 70,
          plafondAnnuelRestant: 500000,
          commentairesMedecin: 'Actes médicaux conformes et justifiés.',
        });
        console.log(`   ✓ ${s.numero} liquidé`);
      }
    } catch (e) {
      console.error(`   ✗ ${s.numero} (${s.action}):`, e.message);
    }
  }

  console.log('\n✅ Seed terminé avec succès !');
  console.log('\nRésumé :');
  console.log(`  • ${contrats.length} contrats créés`);
  console.log(`  • ${contratsActifs.length} contrats activés`);
  console.log(`  • ${sinistresCreés.length} sinistres créés`);
  console.log(`  • ${sinistresCreés.filter(s => s.action === 'liquider').length} sinistres liquidés`);
  console.log(`  • ${sinistresCreés.filter(s => s.action === 'rejeter').length} sinistres rejetés`);
  console.log(`  • ${sinistresCreés.filter(s => s.action === 'none').length} sinistres en attente de traitement`);
}

main().catch(e => {
  console.error('\n❌ Erreur fatale:', e.message);
  process.exit(1);
});
