// ─── Utilitaires monétaires FCFA ───────────────────────────────────────────────

export function formatFCFA(montant: number): string {
  return new Intl.NumberFormat('fr-CI', {
    style: 'currency',
    currency: 'XOF',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(montant);
}

export function calculerRemboursement(params: {
  montantReclame: number;
  tauxRemboursement: number;   // En % ex: 80
  franchise: number;
  plafondAnnuelRestant: number;
}): {
  montantBase: number;
  montantFranchise: number;
  montantRembourse: number;
  montantCoPaiement: number;
} {
  const { montantReclame, tauxRemboursement, franchise, plafondAnnuelRestant } = params;

  const montantApresfranchise = Math.max(0, montantReclame - franchise);
  const montantRembourseAvantPlafond = Math.round(montantApresfranchise * (tauxRemboursement / 100));
  const montantRembourse = Math.min(montantRembourseAvantPlafond, plafondAnnuelRestant);
  const montantCoPaiement = montantApresfranchise - montantRembourse;

  return {
    montantBase: montantReclame,
    montantFranchise: franchise,
    montantRembourse,
    montantCoPaiement,
  };
}

export function calculerPenaliteRetard(
  montantDu: number,
  tauxJournalier: number,  // 0.005 ou 0.01
  joursRetard: number,
): number {
  return Math.round(montantDu * tauxJournalier * joursRetard);
}

export function calculerProrataMensuel(primeAnnuelle: number, joursRestants: number): number {
  const joursDansAnnee = 365;
  return Math.round((primeAnnuelle / joursDansAnnee) * joursRestants);
}
