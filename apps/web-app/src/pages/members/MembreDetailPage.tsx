import React, { useState } from 'react';
import {
  Box, Typography, Button, Chip, CircularProgress, Alert, Paper, Stack,
  Tabs, Tab, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
} from '@mui/material';
import { ArrowBack, OpenInNew } from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { membresApi, sinistresApi } from '../../services/api';

function formatDate(d: string) {
  return d ? new Date(d).toLocaleDateString('fr-CI') : '—';
}
function formatFCFA(n: number) {
  return new Intl.NumberFormat('fr-CI', { style: 'currency', currency: 'XOF', maximumFractionDigits: 0 }).format(n);
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
      <Typography variant="caption" color="text.secondary" display="block">{label}</Typography>
      <Typography variant="body1" fontWeight={600} mt={0.5}>{value || '—'}</Typography>
    </Paper>
  );
}

const SINISTRE_COLORS: Record<string, 'default' | 'info' | 'warning' | 'success' | 'error'> = {
  RECU: 'default', EN_VERIFICATION: 'info', EN_VALIDATION_MEDICALE: 'info',
  APPROUVE: 'success', REJETE: 'error', EN_LIQUIDATION: 'warning', PAYE: 'success',
  CONTESTE: 'warning', FRAUDE_SUSPECTEE: 'error',
};

export function MembreDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [tab, setTab] = useState(0);

  const { data: membre, isLoading, error } = useQuery({
    queryKey: ['membre', id],
    queryFn: () => membresApi.get(id!).then(r => r.data),
    enabled: !!id,
  });

  const { data: sinistresData, isLoading: sinistresLoading } = useQuery({
    queryKey: ['sinistres-membre', id],
    queryFn: () => sinistresApi.byMembre(id!).then(r => r.data),
    enabled: !!id && tab === 1,
  });

  const sinistres: any[] = Array.isArray(sinistresData) ? sinistresData : [];

  if (isLoading) return (
    <Box display="flex" justifyContent="center" pt={8}><CircularProgress /></Box>
  );
  if (error || !membre) return (
    <Box>
      <Button startIcon={<ArrowBack />} onClick={() => navigate('/membres')} sx={{ mb: 2 }}>Retour</Button>
      <Alert severity="error">Membre introuvable</Alert>
    </Box>
  );

  return (
    <Box>
      <Button startIcon={<ArrowBack />} onClick={() => navigate('/membres')} sx={{ mb: 2 }} color="inherit">
        Retour aux membres
      </Button>

      {/* Header */}
      <Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden', mb: 3 }}>
        <Box sx={{ px: 4, py: 3, bgcolor: 'primary.main', color: 'white' }}
          display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
          <Box>
            <Typography variant="h5" fontWeight={700}>{membre.prenoms} {membre.nom}</Typography>
            <Typography variant="body2" sx={{ opacity: 0.8, mt: 0.5 }}>{membre.numeroCarte}</Typography>
          </Box>
          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
            <Chip label={membre.statut} size="small"
              sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', fontWeight: 600 }} />
            <Chip label={membre.lienParente} size="small" variant="outlined"
              sx={{ color: 'rgba(255,255,255,0.8)', borderColor: 'rgba(255,255,255,0.4)' }} />
            {membre.contratId && (
              <Button size="small" variant="outlined" endIcon={<OpenInNew />}
                sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.5)', fontSize: 11 }}
                onClick={() => navigate(`/contrats/${membre.contratId}`)}>
                Voir contrat
              </Button>
            )}
          </Stack>
        </Box>

        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ px: 3, borderBottom: 1, borderColor: 'divider' }}>
          <Tab label="Informations" />
          <Tab label="Sinistres" />
        </Tabs>
      </Paper>

      {/* Onglet Informations */}
      {tab === 0 && (
        <Box display="grid" gridTemplateColumns={{ xs: '1fr', md: '1fr 1fr' }} gap={3}>
          <Paper variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="overline" color="primary" fontWeight={700} display="block" mb={2}>Identité</Typography>
            <Box display="grid" gridTemplateColumns="1fr 1fr" gap={1.5}>
              <InfoCard label="Nom complet" value={`${membre.prenoms} ${membre.nom}`} />
              <InfoCard label="Date de naissance" value={formatDate(membre.dateNaissance)} />
              <InfoCard label="Genre" value={membre.genre === 'M' ? 'Masculin' : 'Féminin'} />
              <InfoCard label="Nationalité" value={membre.nationalite ?? '—'} />
              <InfoCard label="Type document" value={membre.typeDocument} />
              <InfoCard label="N° document" value={membre.numeroDocument} />
            </Box>
          </Paper>

          <Paper variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="overline" color="primary" fontWeight={700} display="block" mb={2}>Contact & Adresse</Typography>
            <Box display="grid" gridTemplateColumns="1fr 1fr" gap={1.5}>
              <InfoCard label="Téléphone" value={membre.telephone} />
              <InfoCard label="Email" value={membre.email ?? '—'} />
              <InfoCard label="Commune" value={membre.adresseCommune} />
              <InfoCard label="Ville" value={membre.adresseVille ?? '—'} />
            </Box>
          </Paper>

          <Paper variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="overline" color="primary" fontWeight={700} display="block" mb={2}>Affiliation</Typography>
            <Box display="grid" gridTemplateColumns="1fr 1fr" gap={1.5}>
              <InfoCard label="Lien parenté" value={membre.lienParente ?? '—'} />
              <InfoCard label="Date affiliation" value={formatDate(membre.dateAffiliation)} />
              <InfoCard label="N° immatriculation" value={membre.numeroImmatriculation ?? '—'} />
              <InfoCard label="Créé le" value={formatDate(membre.createdAt)} />
            </Box>
          </Paper>

          {membre.cartes?.length > 0 && (
            <Paper variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
              <Typography variant="overline" color="primary" fontWeight={700} display="block" mb={2}>Carte tiers-payant</Typography>
              {membre.cartes.map((carte: any) => (
                <Box key={carte.id} display="grid" gridTemplateColumns="1fr 1fr" gap={1.5}>
                  <InfoCard label="Numéro carte" value={carte.numero} />
                  <InfoCard label="Date émission" value={formatDate(carte.dateEmission)} />
                  <InfoCard label="Date expiration" value={formatDate(carte.dateExpiration)} />
                  <InfoCard label="Active" value={carte.estActive ? 'Oui' : 'Non'} />
                </Box>
              ))}
            </Paper>
          )}
        </Box>
      )}

      {/* Onglet Sinistres */}
      {tab === 1 && (
        sinistresLoading ? (
          <Box display="flex" justifyContent="center" pt={4}><CircularProgress /></Box>
        ) : (
          <Paper variant="outlined" sx={{ borderRadius: 2 }}>
            <TableContainer>
              <Table>
                <TableHead sx={{ bgcolor: 'grey.50' }}>
                  <TableRow>
                    {['Numéro', 'Type soin', 'Date soin', 'Montant réclamé', 'Montant remboursé', 'Statut', ''].map(h => (
                      <TableCell key={h} sx={{ fontWeight: 700 }}>{h}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sinistres.length === 0 ? (
                    <TableRow><TableCell colSpan={7} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                      Aucun sinistre pour ce membre
                    </TableCell></TableRow>
                  ) : sinistres.map((s: any) => (
                    <TableRow key={s.id} hover sx={{ cursor: 'pointer' }}
                      onClick={() => navigate(`/sinistres/${s.id}`)}>
                      <TableCell><Typography fontWeight={600} color="primary">{s.numero}</Typography></TableCell>
                      <TableCell><Chip label={s.typeSoin?.replace(/_/g, ' ')} size="small" variant="outlined" /></TableCell>
                      <TableCell>{formatDate(s.dateSoin)}</TableCell>
                      <TableCell><Typography fontWeight={500}>{formatFCFA(Number(s.montantReclame))}</Typography></TableCell>
                      <TableCell>{Number(s.montantRembourse) > 0 ? formatFCFA(Number(s.montantRembourse)) : '—'}</TableCell>
                      <TableCell><Chip label={s.statut} color={SINISTRE_COLORS[s.statut] ?? 'default'} size="small" /></TableCell>
                      <TableCell align="right">
                        <OpenInNew fontSize="small" color="action" />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        )
      )}
    </Box>
  );
}
