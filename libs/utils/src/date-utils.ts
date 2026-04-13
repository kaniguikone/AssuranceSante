// ─── Utilitaires de dates (tenant compte des jours ouvrés CI) ─────────────────

// Jours fériés fixes Côte d'Ivoire
const JOURS_FERIES_FIXES = [
  '01-01', // Jour de l'An
  '05-01', // Fête du Travail
  '08-07', // Fête Nationale
  '08-15', // Assomption
  '11-01', // Toussaint
  '11-15', // Journée Nationale de la Paix
  '12-25', // Noël
];

export function estJourFerie(date: Date): boolean {
  const mmdd = `${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  return JOURS_FERIES_FIXES.includes(mmdd);
}

export function estJourOuvre(date: Date): boolean {
  const jour = date.getDay(); // 0=Dim, 6=Sam
  return jour !== 0 && jour !== 6 && !estJourFerie(date);
}

export function ajouterJoursOuvres(date: Date, joursOuvres: number): Date {
  const result = new Date(date);
  let joursAjoutes = 0;
  while (joursAjoutes < joursOuvres) {
    result.setDate(result.getDate() + 1);
    if (estJourOuvre(result)) joursAjoutes++;
  }
  return result;
}

export function diffJoursOuvres(debut: Date, fin: Date): number {
  const start = new Date(Math.min(debut.getTime(), fin.getTime()));
  const end = new Date(Math.max(debut.getTime(), fin.getTime()));
  let jours = 0;
  const current = new Date(start);
  while (current < end) {
    current.setDate(current.getDate() + 1);
    if (estJourOuvre(current)) jours++;
  }
  return jours;
}

export function calculerDateLimiteTraitement(
  dateDepot: Date,
  delaiJoursOuvres: number,
): Date {
  return ajouterJoursOuvres(dateDepot, delaiJoursOuvres);
}

export function formatDateCI(date: Date): string {
  return date.toLocaleDateString('fr-CI', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function ageEnAnnees(dateNaissance: Date, referenceDate = new Date()): number {
  let age = referenceDate.getFullYear() - dateNaissance.getFullYear();
  const m = referenceDate.getMonth() - dateNaissance.getMonth();
  if (m < 0 || (m === 0 && referenceDate.getDate() < dateNaissance.getDate())) age--;
  return age;
}
