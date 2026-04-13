// ─── Utilitaires numéros de téléphone CI ──────────────────────────────────────

// Préfixes opérateurs Côte d'Ivoire
const PREFIXES_ORANGE = ['07', '08', '09', '27', '47', '57', '67', '77', '87', '97'];
const PREFIXES_MTN = ['04', '05', '06', '24', '44', '54', '64', '74', '84', '94'];
const PREFIXES_WAVE = ['01', '21'];
const PREFIXES_MOOV = ['01', '02', '03'];

export type OperateurCI = 'ORANGE' | 'MTN' | 'WAVE' | 'MOOV' | 'INCONNU';

export function normaliserTelephone(telephone: string): string {
  // Supprimer espaces, tirets, points
  let tel = telephone.replace(/[\s\-\.]/g, '');

  // Remplacer +225 ou 00225 par rien
  tel = tel.replace(/^(\+225|00225)/, '');

  // S'assurer que le numéro a 10 chiffres (format CI)
  if (tel.length === 8) tel = `0${tel}`; // Cas rare anciens numéros
  if (tel.length !== 10) return telephone; // Format invalide, retourner tel quel

  return `+225${tel}`;
}

export function identifierOperateur(telephone: string): OperateurCI {
  const tel = telephone.replace(/^(\+225|00225)/, '');
  const prefixe = tel.substring(0, 2);

  if (PREFIXES_ORANGE.includes(prefixe)) return 'ORANGE';
  if (PREFIXES_MTN.includes(prefixe)) return 'MTN';
  if (PREFIXES_WAVE.includes(prefixe)) return 'WAVE';
  if (PREFIXES_MOOV.includes(prefixe)) return 'MOOV';
  return 'INCONNU';
}

export function validerTelephoneCI(telephone: string): boolean {
  const tel = telephone.replace(/^(\+225|00225)/, '').replace(/[\s\-\.]/g, '');
  return /^\d{10}$/.test(tel);
}
