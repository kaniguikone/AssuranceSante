import React, { useState } from 'react';
import {
  Box, Typography, Card, CardContent, CircularProgress, Alert,
  Grid, Chip, Paper, Stack, Dialog, IconButton,
} from '@mui/material';
import { Close, MedicalServices } from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { produitsApi } from '../../services/api';

function formatFCFA(n: number) {
  return new Intl.NumberFormat('fr-CI', { style: 'currency', currency: 'XOF', maximumFractionDigits: 0 }).format(n);
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <Box display="flex" justifyContent="space-between" alignItems="center" py={0.75}
      sx={{ borderBottom: 1, borderColor: 'divider', '&:last-child': { border: 0 } }}>
      <Typography variant="body2" color="text.secondary">{label}</Typography>
      <Typography variant="body2" fontWeight={600}>{value || '—'}</Typography>
    </Box>
  );
}

export function ProduitsPage() {
  const [selected, setSelected] = useState<any>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['produits'],
    queryFn: () => produitsApi.list().then(r => r.data),
  });

  const produits: any[] = Array.isArray(data) ? data : (data?.data ?? []);

  return (
    <Box>
      <Box mb={3}>
        <Typography variant="h4" fontWeight={700}>Produits & Formules</Typography>
        <Typography variant="body2" color="text.secondary" mt={0.5}>
          Catalogue des formules d'assurance disponibles
        </Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>Erreur de chargement des produits</Alert>}

      {isLoading ? (
        <Box display="flex" justifyContent="center" pt={8}><CircularProgress /></Box>
      ) : (
        <Grid container spacing={3}>
          {produits.length === 0 ? (
            <Grid item xs={12}>
              <Alert severity="info">Aucun produit disponible</Alert>
            </Grid>
          ) : produits.map((p: any) => (
            <Grid item xs={12} sm={6} lg={4} key={p.id}>
              <Card
                sx={{ cursor: 'pointer', height: '100%', transition: 'box-shadow .2s',
                  '&:hover': { boxShadow: 4 } }}
                onClick={() => setSelected(p)}
              >
                <Box sx={{ px: 3, pt: 3, pb: 1, bgcolor: 'primary.main', color: 'white', borderRadius: '4px 4px 0 0' }}>
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                    <Box>
                      <Typography variant="h6" fontWeight={700}>{p.nom}</Typography>
                      <Typography variant="caption" sx={{ opacity: 0.8 }}>{p.code ?? p.id?.slice(0, 8)}</Typography>
                    </Box>
                    <MedicalServices sx={{ opacity: 0.6, fontSize: 32 }} />
                  </Box>
                </Box>
                <CardContent>
                  <Stack spacing={1}>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography variant="body2" color="text.secondary">Prime mensuelle</Typography>
                      <Typography variant="h6" fontWeight={700} color="primary.main">
                        {formatFCFA(Number(p.primeMensuelleBase))}
                      </Typography>
                    </Box>
                    {p.tauxRemboursement && (
                      <Box display="flex" justifyContent="space-between">
                        <Typography variant="body2" color="text.secondary">Taux remboursement</Typography>
                        <Chip label={`${p.tauxRemboursement}%`} size="small" color="success" />
                      </Box>
                    )}
                    {p.plafondAnnuel && (
                      <Box display="flex" justifyContent="space-between">
                        <Typography variant="body2" color="text.secondary">Plafond annuel</Typography>
                        <Typography variant="body2" fontWeight={600}>{formatFCFA(Number(p.plafondAnnuel))}</Typography>
                      </Box>
                    )}
                    {p.estActif !== undefined && (
                      <Box display="flex" justifyContent="flex-end" pt={0.5}>
                        <Chip label={p.estActif ? 'Actif' : 'Inactif'} size="small"
                          color={p.estActif ? 'success' : 'default'} />
                      </Box>
                    )}
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Dialog détail produit */}
      <Dialog open={!!selected} onClose={() => setSelected(null)}
        maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3, overflow: 'hidden' } }}>
        {selected && (
          <Box>
            <Box sx={{ px: 4, py: 3, bgcolor: 'primary.main', color: 'white' }}
              display="flex" justifyContent="space-between" alignItems="center">
              <Box>
                <Typography variant="h6" fontWeight={700}>{selected.nom}</Typography>
                <Typography variant="caption" sx={{ opacity: 0.8 }}>{selected.code ?? ''}</Typography>
              </Box>
              <IconButton onClick={() => setSelected(null)} sx={{ color: 'white' }}><Close /></IconButton>
            </Box>

            <Box sx={{ p: 3 }}>
              <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2, mb: 2 }}>
                <Typography variant="overline" color="primary" fontWeight={700} display="block" mb={1.5}>
                  Tarification
                </Typography>
                <InfoRow label="Prime mensuelle de base" value={formatFCFA(Number(selected.primeMensuelleBase))} />
                {selected.primeAnnuelle && (
                  <InfoRow label="Prime annuelle" value={formatFCFA(Number(selected.primeAnnuelle))} />
                )}
              </Paper>

              <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2, mb: 2 }}>
                <Typography variant="overline" color="primary" fontWeight={700} display="block" mb={1.5}>
                  Garanties
                </Typography>
                <InfoRow label="Taux de remboursement" value={selected.tauxRemboursement ? `${selected.tauxRemboursement}%` : '—'} />
                <InfoRow label="Franchise" value={selected.franchise ? formatFCFA(Number(selected.franchise)) : '—'} />
                <InfoRow label="Plafond annuel" value={selected.plafondAnnuel ? formatFCFA(Number(selected.plafondAnnuel)) : '—'} />
                <InfoRow label="Plafond hospitalisation" value={selected.plafondHospitalisation ? formatFCFA(Number(selected.plafondHospitalisation)) : '—'} />
              </Paper>

              {selected.description && (
                <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2 }}>
                  <Typography variant="overline" color="primary" fontWeight={700} display="block" mb={1}>
                    Description
                  </Typography>
                  <Typography variant="body2" color="text.secondary">{selected.description}</Typography>
                </Paper>
              )}
            </Box>
          </Box>
        )}
      </Dialog>
    </Box>
  );
}
