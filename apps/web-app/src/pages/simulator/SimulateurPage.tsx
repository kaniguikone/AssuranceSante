import React, { useState } from 'react';
import {
  Box, Typography, Card, CardContent, TextField, MenuItem, Button,
  CircularProgress, Alert, Paper, Divider, Stack, Chip,
} from '@mui/material';
import { Calculate, TrendingUp } from '@mui/icons-material';
import { useMutation } from '@tanstack/react-query';
import { simulateurApi } from '../../services/api';

const FORMULES = ['BRONZE', 'ARGENT', 'OR', 'PLATINE'];

function formatFCFA(n: number) {
  return new Intl.NumberFormat('fr-CI', { style: 'currency', currency: 'XOF', maximumFractionDigits: 0 }).format(n);
}

const FORMULE_COLORS: Record<string, string> = {
  BRONZE: '#CD7F32', ARGENT: '#C0C0C0', OR: '#FFD700', PLATINE: '#E5E4E2',
};

const FORMULE_DESCRIPTIONS: Record<string, string> = {
  BRONZE: 'Couverture de base — soins courants, médicaments essentiels',
  ARGENT: 'Couverture standard — hospitalisation incluse jusqu\'à 3 nuits',
  OR: 'Couverture étendue — spécialistes, optique, dentaire',
  PLATINE: 'Couverture complète — tous soins, plafond élevé, rapatriement',
};

export function SimulateurPage() {
  const [form, setForm] = useState({
    formule: 'ARGENT',
    dateNaissance: '',
    nbBeneficiaires: 0,
  });

  const simulation = useMutation({
    mutationFn: () => simulateurApi.simuler({
      formule: form.formule,
      dateNaissance: form.dateNaissance,
      nbBeneficiaires: form.nbBeneficiaires,
    }).then(r => r.data),
  });

  const result = simulation.data as any;

  return (
    <Box maxWidth={700} mx="auto">
      <Typography variant="h4" fontWeight={700} gutterBottom>Simulateur de prime</Typography>
      <Typography variant="body2" color="text.secondary" mb={4}>
        Estimez votre cotisation mensuelle selon la formule choisie, votre âge et le nombre de bénéficiaires.
      </Typography>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" fontWeight={600} mb={3}>Vos informations</Typography>
          <Stack spacing={3}>
            <TextField
              select label="Formule *"
              value={form.formule}
              onChange={e => setForm(f => ({ ...f, formule: e.target.value }))}
              fullWidth size="small"
              helperText={FORMULE_DESCRIPTIONS[form.formule]}>
              {FORMULES.map(f => (
                <MenuItem key={f} value={f}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: FORMULE_COLORS[f] }} />
                    {f}
                  </Box>
                </MenuItem>
              ))}
            </TextField>

            <TextField
              label="Date de naissance *" type="date"
              value={form.dateNaissance}
              onChange={e => setForm(f => ({ ...f, dateNaissance: e.target.value }))}
              fullWidth size="small" InputLabelProps={{ shrink: true }}
              helperText="Utilisée pour déterminer la tranche d'âge tarifaire" />

            <TextField
              label="Nombre de bénéficiaires supplémentaires"
              type="number"
              value={form.nbBeneficiaires}
              onChange={e => setForm(f => ({ ...f, nbBeneficiaires: Math.max(0, Number(e.target.value)) }))}
              fullWidth size="small"
              inputProps={{ min: 0, max: 20 }}
              helperText="Conjoint, enfants… (+30% par bénéficiaire)" />

            <Button
              variant="contained" size="large" startIcon={<Calculate />}
              disabled={!form.dateNaissance || simulation.isPending}
              onClick={() => simulation.mutate()}>
              {simulation.isPending ? <CircularProgress size={22} sx={{ color: 'white' }} /> : 'Calculer ma prime'}
            </Button>
          </Stack>
        </CardContent>
      </Card>

      {simulation.isError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {(simulation.error as any)?.response?.data?.message ?? 'Erreur lors du calcul'}
        </Alert>
      )}

      {result && (
        <Card sx={{ border: 2, borderColor: FORMULE_COLORS[result.formule] ?? 'primary.main' }}>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6" fontWeight={700}>Résultat de la simulation</Typography>
              <Box display="flex" alignItems="center" gap={1}>
                <Box sx={{ width: 14, height: 14, borderRadius: '50%', bgcolor: FORMULE_COLORS[result.formule] }} />
                <Chip label={`Formule ${result.formule}`} size="small"
                  sx={{ bgcolor: `${FORMULE_COLORS[result.formule]}30`, fontWeight: 700 }} />
              </Box>
            </Box>

            <Box display="grid" gridTemplateColumns={{ xs: '1fr', sm: '1fr 1fr 1fr' }} gap={2} mb={3}>
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, textAlign: 'center' }}>
                <Typography variant="caption" color="text.secondary" display="block">Tranche d'âge</Typography>
                <Typography variant="h5" fontWeight={700} color="primary.main" mt={0.5}>
                  {result.age} ans
                </Typography>
              </Paper>
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, textAlign: 'center' }}>
                <Typography variant="caption" color="text.secondary" display="block">Prime de base / mois</Typography>
                <Typography variant="h5" fontWeight={700} color="primary.main" mt={0.5}>
                  {formatFCFA(result.primeMensuelleBase)}
                </Typography>
              </Paper>
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, textAlign: 'center' }}>
                <Typography variant="caption" color="text.secondary" display="block">Prime annuelle</Typography>
                <Typography variant="h5" fontWeight={700} color="primary.main" mt={0.5}>
                  {formatFCFA(result.primeAnnuelle)}
                </Typography>
              </Paper>
            </Box>

            {result.nbBeneficiaires > 0 && (
              <>
                <Divider sx={{ mb: 2 }} />
                <Box display="grid" gridTemplateColumns={{ xs: '1fr', sm: '1fr 1fr' }} gap={2}>
                  <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: 'primary.50' }}>
                    <Typography variant="caption" color="text.secondary" display="block">
                      {result.nbBeneficiaires} bénéficiaire{result.nbBeneficiaires > 1 ? 's' : ''} inclus
                    </Typography>
                    <Typography variant="h5" fontWeight={700} color="primary.dark" mt={0.5}>
                      {formatFCFA(result.primeAvecBeneficiaires)} / mois
                    </Typography>
                  </Paper>
                  <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: 'success.50' }}>
                    <Typography variant="caption" color="text.secondary" display="block">Total annuel famille</Typography>
                    <Typography variant="h5" fontWeight={700} color="success.dark" mt={0.5}>
                      {formatFCFA(result.primeAvecBeneficiaires * 12)}
                    </Typography>
                  </Paper>
                </Box>
              </>
            )}

            <Box mt={3} p={2} sx={{ bgcolor: 'info.50', borderRadius: 2, border: 1, borderColor: 'info.200' }}>
              <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                <TrendingUp color="info" fontSize="small" />
                <Typography variant="caption" fontWeight={700} color="info.dark">Information</Typography>
              </Box>
              <Typography variant="caption" color="text.secondary">
                Ces tarifs sont des estimations basées sur les barèmes SANTÉ-CI en vigueur.
                La prime définitive peut varier selon les antécédents médicaux et le profil de risque.
              </Typography>
            </Box>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}
