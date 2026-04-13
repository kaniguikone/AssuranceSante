// ─── Algorithme de déduplication phonétique adapté aux noms africains ─────────
// Adapté du Soundex pour les phonèmes français et africains
// Gère les cas: Aboubakar/Abubakar, Koné/Kone, Traoré/Traore, etc.

// Normalisation des caractères accentués et variantes orthographiques
const SUBSTITUTIONS: [RegExp, string][] = [
  [/[àâä]/g, 'a'],
  [/[éèêë]/g, 'e'],
  [/[îï]/g, 'i'],
  [/[ôö]/g, 'o'],
  [/[ùûü]/g, 'u'],
  [/ç/g, 's'],
  [/[ñ]/g, 'n'],
  [/ou/g, 'u'],   // Oumar/Umar
  [/ph/g, 'f'],
  [/ck/g, 'k'],
  [/qu/g, 'k'],
  [/x/g, 'ks'],
  [/w/g, 'v'],
  [/y(?=[aeiou])/g, 'i'], // Yao → iao
  [/ai/g, 'e'],
  [/au/g, 'o'],
  [/eau/g, 'o'],
];

const CODE_PHONETIQUE: Record<string, string> = {
  a: '0', e: '0', i: '0', o: '0', u: '0', // Voyelles ignorées
  b: '1', p: '1',
  c: '2', g: '2', j: '2', k: '2', q: '2', s: '2', x: '2', z: '2',
  d: '3', t: '3',
  l: '4',
  m: '5', n: '5',
  r: '6',
  f: '7', v: '7',
  h: '8',
};

export function soundexAfricain(nom: string): string {
  if (!nom) return '';

  let s = nom.toLowerCase().trim();

  // Appliquer les substitutions
  for (const [regex, replacement] of SUBSTITUTIONS) {
    s = s.replace(regex, replacement);
  }

  // Supprimer les caractères non-alphabétiques
  s = s.replace(/[^a-z]/g, '');
  if (!s) return '';

  const premiere = s[0].toUpperCase();
  const code = s
    .substring(1)
    .split('')
    .map(c => CODE_PHONETIQUE[c] || '')
    .filter((c, i, arr) => c !== '0' && c !== arr[i - 1]) // Dédupliquer consécutifs
    .slice(0, 3)
    .join('');

  return (premiere + code + '000').substring(0, 4);
}

export function similaritePhonétique(nom1: string, nom2: string): number {
  const code1 = soundexAfricain(nom1);
  const code2 = soundexAfricain(nom2);
  if (code1 === code2) return 1.0;

  // Calcul distance Levenshtein sur les codes
  let matches = 0;
  for (let i = 0; i < Math.min(code1.length, code2.length); i++) {
    if (code1[i] === code2[i]) matches++;
  }
  return matches / 4;
}

export function estDupliquePotentiel(
  nom1: string, prenom1: string,
  nom2: string, prenom2: string,
  seuilSimilarite = 0.75,
): boolean {
  const simNom = similaritePhonétique(nom1, nom2);
  const simPrenom = similaritePhonétique(prenom1, prenom2);
  return (simNom + simPrenom) / 2 >= seuilSimilarite;
}
