// ─── Générateurs de numéros métier ────────────────────────────────────────────

function pad(n: number, size: number): string {
  return String(n).padStart(size, '0');
}

function annee(): string {
  return String(new Date().getFullYear());
}

function seqAleatoire(longueur = 6): string {
  return Math.random().toString(36).substring(2, 2 + longueur).toUpperCase();
}

export function genererNumeroContrat(): string {
  return `CT-${annee()}-${seqAleatoire(6)}`;
}

export function genererNumeroAvenant(): string {
  return `AV-${annee()}-${seqAleatoire(6)}`;
}

export function genererNumeroCarte(): string {
  return `SC-${seqAleatoire(8)}`;
}

export function genererNumeroSinistre(): string {
  return `SIN-${annee()}-${seqAleatoire(8)}`;
}

export function genererNumeroEcheance(periode: string): string {
  return `ECH-${periode}-${seqAleatoire(4)}`;
}

export function genererReferenceTransaction(): string {
  const ts = Date.now().toString(36).toUpperCase();
  return `TXN-${annee()}-${ts}`;
}

export function genererCodePrestataire(): string {
  return `PRE-${seqAleatoire(6)}`;
}
