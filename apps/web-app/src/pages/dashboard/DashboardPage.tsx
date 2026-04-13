import React from 'react';
import {
  Grid, Card, CardContent, Typography, Box, Chip, LinearProgress, CircularProgress,
} from '@mui/material';
import { TrendingUp, People, LocalHospital, Payment, Warning, GppBad } from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { contratsApi, membresApi, sinistresApi } from '../../services/api';

function formatFCFA(n: number) {
  return new Intl.NumberFormat('fr-CI', { style: 'currency', currency: 'XOF', maximumFractionDigits: 0 }).format(n);
}

function KpiCard({ titre, valeur, sousTitre, icone, couleur, loading }: {
  titre: string; valeur: string | number; sousTitre?: string;
  icone: React.ReactNode; couleur: string; loading?: boolean;
}) {
  return (
    <Card>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
          <Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>{titre}</Typography>
            {loading
              ? <CircularProgress size={28} sx={{ mt: 0.5 }} />
              : <Typography variant="h4" fontWeight={700}>{valeur}</Typography>}
            {sousTitre && !loading && (
              <Typography variant="caption" color="text.secondary">{sousTitre}</Typography>
            )}
          </Box>
          <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: `${couleur}15`, color: couleur, display: 'flex' }}>
            {icone}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

function SinistraliteGauge({ taux, loading }: { taux: number; loading?: boolean }) {
  const couleur = taux > 80 ? 'error' : taux > 60 ? 'warning' : 'success';
  return (
    <Card>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6" fontWeight={600}>Taux de sinistralité estimé</Typography>
          {loading ? <CircularProgress size={20} /> : <Chip label={`${taux}%`} color={couleur} size="small" />}
        </Box>
        <LinearProgress variant="determinate" value={loading ? 0 : Math.min(taux, 100)}
          color={couleur} sx={{ height: 10, borderRadius: 5 }} />
        <Box display="flex" justifyContent="space-between" mt={1}>
          <Typography variant="caption" color="text.secondary">Seuil alerte : 80%</Typography>
          <Typography variant="caption" color={taux > 80 ? 'error.main' : 'text.secondary'}>
            {loading ? '...' : taux > 80 ? 'Alerte dépassée' : 'Normal'}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
}

export function DashboardPage() {
  const navigate = useNavigate();

  const { data: contratsData, isLoading: contratsLoading } = useQuery({
    queryKey: ['contrats'],
    queryFn: () => contratsApi.list().then(r => r.data),
  });

  const { data: membresData, isLoading: membresLoading } = useQuery({
    queryKey: ['membres'],
    queryFn: () => membresApi.list({ limit: 100 }).then(r => r.data),
  });

  const { data: sinistresData, isLoading: sinistresLoading } = useQuery({
    queryKey: ['sinistres'],
    queryFn: () => sinistresApi.list().then(r => r.data),
  });

  const { data: alertesData } = useQuery({
    queryKey: ['sinistres-alertes'],
    queryFn: () => sinistresApi.alertes().then(r => r.data),
  });
  const alertes: any[] = Array.isArray(alertesData) ? alertesData : [];

  const contrats: any[] = Array.isArray(contratsData) ? contratsData : (contratsData?.data ?? []);
  const membres: any[] = Array.isArray(membresData) ? membresData : (membresData?.data ?? []);
  const sinistres: any[] = Array.isArray(sinistresData) ? sinistresData : [];

  // Calculs KPIs
  const contratsActifs = contrats.filter(c => c.statut === 'ACTIF').length;
  const contratsTotaux = contrats.length;
  const membresActifs = membres.filter(m => m.statut === 'ACTIF').length;
  const membresTotaux = membres.length;

  const sinistresEnCours = sinistres.filter(s =>
    ['RECU', 'EN_VERIFICATION', 'EN_VALIDATION_MEDICALE'].includes(s.statut)
  ).length;
  const sinistresApprouves = sinistres.filter(s => s.statut === 'APPROUVE').length;
  const sinistresTotal = sinistres.length;

  const primesMensuelles = contrats
    .filter(c => c.statut === 'ACTIF')
    .reduce((sum, c) => sum + Number(c.primeMensuelle ?? 0), 0);

  const montantReclame = sinistres
    .filter(s => ['APPROUVE', 'EN_LIQUIDATION', 'PAYE'].includes(s.statut))
    .reduce((sum, s) => sum + Number(s.montantReclame ?? 0), 0);

  const tauxSinistralite = primesMensuelles > 0
    ? Math.round((montantReclame / primesMensuelles) * 100)
    : 0;

  return (
    <Box>
      <Typography variant="h4" fontWeight={700} gutterBottom>Tableau de bord</Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>
        {new Date().toLocaleDateString('fr-CI', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
      </Typography>

      <Grid container spacing={3}>
        {/* KPI 1 — Contrats */}
        <Grid item xs={12} sm={6} lg={3}>
          <KpiCard
            titre="Contrats actifs"
            valeur={`${contratsActifs} / ${contratsTotaux}`}
            sousTitre={`${contrats.filter(c => c.statut === 'EN_ATTENTE').length} en attente d'activation`}
            icone={<Payment />} couleur="#1B6B2F"
            loading={contratsLoading}
          />
        </Grid>

        {/* KPI 2 — Membres */}
        <Grid item xs={12} sm={6} lg={3}>
          <KpiCard
            titre="Membres couverts"
            valeur={`${membresActifs} / ${membresTotaux}`}
            sousTitre={`${membres.filter(m => m.statut === 'SUSPENDU').length} suspendus`}
            icone={<People />} couleur="#1565C0"
            loading={membresLoading}
          />
        </Grid>

        {/* KPI 3 — Sinistres */}
        <Grid item xs={12} sm={6} lg={3}>
          <KpiCard
            titre="Sinistres en cours"
            valeur={sinistresEnCours}
            sousTitre={`${sinistresApprouves} approuvés à liquider · ${sinistresTotal} total`}
            icone={<LocalHospital />} couleur="#E65100"
            loading={sinistresLoading}
          />
        </Grid>

        {/* KPI 4 — Cotisations */}
        <Grid item xs={12} sm={6} lg={3}>
          <KpiCard
            titre="Cotisations mensuelles"
            valeur={formatFCFA(primesMensuelles)}
            sousTitre="Contrats actifs uniquement"
            icone={<TrendingUp />} couleur="#6A1B9A"
            loading={contratsLoading}
          />
        </Grid>

        {/* Sinistralité */}
        <Grid item xs={12} md={6}>
          <SinistraliteGauge taux={tauxSinistralite} loading={contratsLoading || sinistresLoading} />
        </Grid>

        {/* Répartition sinistres */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>Répartition des sinistres</Typography>
              {sinistresLoading ? <CircularProgress size={24} /> : (
                <Box display="grid" gridTemplateColumns="1fr 1fr" gap={1.5} mt={1}>
                  {[
                    ['Reçus', sinistres.filter(s => s.statut === 'RECU').length, '#757575'],
                    ['En vérification', sinistres.filter(s => s.statut === 'EN_VERIFICATION').length, '#1565C0'],
                    ['Approuvés', sinistres.filter(s => s.statut === 'APPROUVE').length, '#2E7D32'],
                    ['Payés', sinistres.filter(s => s.statut === 'PAYE').length, '#1B6B2F'],
                    ['Rejetés', sinistres.filter(s => s.statut === 'REJETE').length, '#C62828'],
                    ['Total', sinistresTotal, '#6A1B9A'],
                  ].map(([label, val, color]) => (
                    <Box key={label as string} sx={{ p: 1.5, borderRadius: 2, bgcolor: `${color}10`, border: 1, borderColor: `${color}30` }}>
                      <Typography variant="caption" color="text.secondary">{label}</Typography>
                      <Typography variant="h6" fontWeight={700} sx={{ color }}>{val}</Typography>
                    </Box>
                  ))}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Contrats par statut */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>Contrats par statut</Typography>
              {contratsLoading ? <CircularProgress size={24} /> : (
                <Box display="grid" gridTemplateColumns="1fr 1fr" gap={1.5} mt={1}>
                  {[
                    ['En attente', contrats.filter(c => c.statut === 'EN_ATTENTE').length, '#1565C0'],
                    ['Actifs', contratsActifs, '#2E7D32'],
                    ['Suspendus', contrats.filter(c => c.statut === 'SUSPENDU').length, '#E65100'],
                    ['Résiliés', contrats.filter(c => c.statut === 'RESILIE').length, '#C62828'],
                  ].map(([label, val, color]) => (
                    <Box key={label as string} sx={{ p: 1.5, borderRadius: 2, bgcolor: `${color}10`, border: 1, borderColor: `${color}30` }}>
                      <Typography variant="caption" color="text.secondary">{label}</Typography>
                      <Typography variant="h6" fontWeight={700} sx={{ color }}>{val}</Typography>
                    </Box>
                  ))}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Avertissement sinistres approuvés */}
        {sinistresApprouves > 0 && (
          <Grid item xs={12} md={6}>
            <Card sx={{ border: 2, borderColor: 'warning.main' }}>
              <CardContent>
                <Box display="flex" alignItems="center" gap={1} mb={1}>
                  <Warning color="warning" />
                  <Typography variant="h6" fontWeight={600}>Action requise</Typography>
                  <Chip label={sinistresApprouves} color="warning" size="small" />
                </Box>
                <Typography variant="body2" color="text.secondary">
                  {sinistresApprouves} sinistre{sinistresApprouves > 1 ? 's' : ''} approuvé{sinistresApprouves > 1 ? 's' : ''} en attente de liquidation.
                  Rendez-vous sur la page Sinistres pour les traiter.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Alertes fraude */}
        {alertes.length > 0 && (
          <Grid item xs={12}>
            <Card sx={{ border: 2, borderColor: 'error.main' }}>
              <CardContent>
                <Box display="flex" alignItems="center" gap={1} mb={2}>
                  <GppBad color="error" />
                  <Typography variant="h6" fontWeight={600} color="error">Alertes fraude</Typography>
                  <Chip label={alertes.length} color="error" size="small" />
                </Box>
                <Box display="grid" gridTemplateColumns={{ xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' }} gap={1.5}>
                  {alertes.slice(0, 6).map((s: any) => (
                    <Box key={s.id} sx={{ p: 1.5, borderRadius: 2, bgcolor: 'error.50', border: 1, borderColor: 'error.200',
                      cursor: 'pointer', '&:hover': { bgcolor: 'error.100' } }}
                      onClick={() => navigate(`/sinistres/${s.id}`)}>
                      <Typography variant="body2" fontWeight={700} color="error.dark">{s.numero}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        Score fraude : {s.scoreFraude ?? '—'}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>
    </Box>
  );
}
