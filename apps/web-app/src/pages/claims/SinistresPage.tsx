import React, { useState } from 'react';
import {
  Box, Typography, Button, Card, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Chip, IconButton, Dialog,
  TextField, MenuItem, CircularProgress, Alert, Tooltip, Stack, Paper,
} from '@mui/material';
import { Add, Visibility, Close } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { sinistresApi, contratsApi, membresApi } from '../../services/api';

const STATUT_COLORS: Record<string, 'default' | 'info' | 'warning' | 'success' | 'error'> = {
  RECU: 'default', EN_VERIFICATION: 'info', EN_VALIDATION_MEDICALE: 'info',
  APPROUVE: 'success', REJETE: 'error', EN_LIQUIDATION: 'warning', PAYE: 'success',
  CONTESTE: 'warning', FRAUDE_SUSPECTEE: 'error',
};

const TYPES_SOIN = [
  'SOINS_AMBULATOIRES', 'MEDICAMENTS', 'HOSPITALISATION_PLANIFIEE',
  'HOSPITALISATION_URGENCE', 'ACTES_DENTAIRES', 'OPTIQUE', 'ANALYSES', 'RADIOLOGIE',
];

function formatFCFA(n: number) {
  return new Intl.NumberFormat('fr-CI', { style: 'currency', currency: 'XOF', maximumFractionDigits: 0 }).format(n);
}
function formatDate(d: string) {
  return d ? new Date(d).toLocaleDateString('fr-CI') : '—';
}

const FORM_INIT = {
  contratId: '', membreId: '', prestataireId: 'a0000000-0000-4000-8000-000000000001',
  typeSoin: 'SOINS_AMBULATOIRES', modeDepot: 'SCAN',
  dateSoin: '', dateEffetContrat: '', montantReclame: '',
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2 }}>
      <Typography variant="overline" color="primary" fontWeight={700} display="block" mb={2}>{title}</Typography>
      {children}
    </Paper>
  );
}

export function SinistresPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [openCreate, setOpenCreate] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [form, setForm] = useState(FORM_INIT);

  const { data, isLoading } = useQuery({
    queryKey: ['sinistres'],
    queryFn: () => sinistresApi.list().then(r => r.data),
  });

  const { data: contratsData } = useQuery({
    queryKey: ['contrats'],
    queryFn: () => contratsApi.list().then(r => r.data),
  });

  const { data: membresData, isLoading: membresLoading } = useQuery({
    queryKey: ['membres-sinistre', form.contratId],
    queryFn: () => membresApi.list({ contratId: form.contratId }).then(r => r.data),
    enabled: !!form.contratId,
  });

  const contrats: any[] = Array.isArray(contratsData) ? contratsData : (contratsData?.data ?? []);
  const sinistres: any[] = Array.isArray(data) ? data : [];
  const membresDuContrat: any[] = Array.isArray(membresData) ? membresData : (membresData?.data ?? []);

  const handleContratChange = (contratId: string) => {
    const contrat = contrats.find(c => c.id === contratId);
    setForm(f => ({
      ...f, contratId, membreId: '',
      dateEffetContrat: contrat?.dateEffet ? contrat.dateEffet.split('T')[0] : '',
    }));
  };

  const createMut = useMutation({
    mutationFn: (d: unknown) => sinistresApi.create(d),
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: ['sinistres'] });
      setOpenCreate(false);
      setForm(FORM_INIT);
      setFormError(null);
      navigate(`/sinistres/${r.data.id}`);
    },
    onError: (e: any) => {
      const msg = e.response?.data?.message;
      setFormError(Array.isArray(msg) ? msg.join(', ') : (msg ?? e.message));
    },
  });

  const handleDeposer = () => {
    if (!form.contratId || !form.membreId || !form.dateSoin || !form.montantReclame) {
      setFormError('Contrat, membre, date du soin et montant sont obligatoires');
      return;
    }
    setFormError(null);
    createMut.mutate({ ...form, montantReclame: Number(form.montantReclame) });
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight={700}>Sinistres</Typography>
        <Button variant="contained" size="large" startIcon={<Add />} onClick={() => setOpenCreate(true)}>
          Déposer un sinistre
        </Button>
      </Box>

      <Card>
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
              {isLoading ? (
                <TableRow><TableCell colSpan={7} align="center" sx={{ py: 4 }}><CircularProgress /></TableCell></TableRow>
              ) : sinistres.length === 0 ? (
                <TableRow><TableCell colSpan={7} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                  Aucun sinistre déclaré
                </TableCell></TableRow>
              ) : sinistres.map((s: any) => (
                <TableRow key={s.id} hover sx={{ cursor: 'pointer' }} onClick={() => navigate(`/sinistres/${s.id}`)}>
                  <TableCell><Typography fontWeight={600} color="primary">{s.numero}</Typography></TableCell>
                  <TableCell><Chip label={s.typeSoin?.replace(/_/g, ' ')} size="small" variant="outlined" /></TableCell>
                  <TableCell>{formatDate(s.dateSoin)}</TableCell>
                  <TableCell><Typography fontWeight={500}>{formatFCFA(Number(s.montantReclame))}</Typography></TableCell>
                  <TableCell>{Number(s.montantRembourse) > 0 ? formatFCFA(Number(s.montantRembourse)) : '—'}</TableCell>
                  <TableCell><Chip label={s.statut} color={STATUT_COLORS[s.statut] ?? 'default'} size="small" /></TableCell>
                  <TableCell align="right" onClick={e => e.stopPropagation()}>
                    <Tooltip title="Voir détail">
                      <IconButton size="small" onClick={() => navigate(`/sinistres/${s.id}`)}>
                        <Visibility fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* ===== Dialog dépôt sinistre ===== */}
      <Dialog open={openCreate}
        onClose={() => { setOpenCreate(false); setForm(FORM_INIT); setFormError(null); }}
        maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3, overflow: 'hidden' } }}>
        <Box display="flex" flexDirection="column" maxHeight="90vh">
          <Box sx={{ px: 4, py: 3, borderBottom: 1, borderColor: 'divider', bgcolor: 'primary.main', color: 'white' }}
            display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6" fontWeight={700}>Déposer un sinistre</Typography>
            <IconButton onClick={() => { setOpenCreate(false); setForm(FORM_INIT); setFormError(null); }} sx={{ color: 'white' }}>
              <Close />
            </IconButton>
          </Box>

          <Box sx={{ flex: 1, overflowY: 'auto', p: 4 }}>
            <Box display="grid" gridTemplateColumns="1fr 1fr" gap={3}>
              <Box display="flex" flexDirection="column" gap={2.5}>
                <Section title="Contrat & Assuré">
                  <Stack spacing={2}>
                    <TextField select label="Contrat *" value={form.contratId} fullWidth size="small"
                      onChange={e => handleContratChange(e.target.value)}>
                      {contrats.length === 0
                        ? <MenuItem value="" disabled>Aucun contrat disponible</MenuItem>
                        : contrats.map((c: any) => (
                          <MenuItem key={c.id} value={c.id}>
                            <Box>
                              <Typography variant="body2" fontWeight={600}>{c.numero}</Typography>
                              <Typography variant="caption" color="text.secondary">{c.type} — {c.statut}</Typography>
                            </Box>
                          </MenuItem>
                        ))}
                    </TextField>
                    <TextField select label="Membre *" value={form.membreId} fullWidth size="small"
                      onChange={e => setForm(f => ({ ...f, membreId: e.target.value }))}
                      disabled={!form.contratId}
                      helperText={!form.contratId ? 'Sélectionnez d\'abord un contrat' : undefined}>
                      {membresLoading
                        ? <MenuItem value="" disabled>Chargement...</MenuItem>
                        : membresDuContrat.length === 0
                          ? <MenuItem value="" disabled>Aucun membre pour ce contrat</MenuItem>
                          : membresDuContrat.map((m: any) => (
                            <MenuItem key={m.id} value={m.id}>
                              {m.prenoms} {m.nom} — {m.lienParente}
                            </MenuItem>
                          ))}
                    </TextField>
                  </Stack>
                </Section>
                <Section title="Dates">
                  <Stack spacing={2}>
                    <TextField label="Date du soin *" type="date" value={form.dateSoin} fullWidth size="small"
                      onChange={e => setForm(f => ({ ...f, dateSoin: e.target.value }))}
                      InputLabelProps={{ shrink: true }} />
                    <TextField label="Date effet contrat" type="date" value={form.dateEffetContrat} fullWidth size="small"
                      onChange={e => setForm(f => ({ ...f, dateEffetContrat: e.target.value }))}
                      InputLabelProps={{ shrink: true }}
                      helperText="Remplie automatiquement à la sélection du contrat" />
                  </Stack>
                </Section>
              </Box>

              <Box display="flex" flexDirection="column" gap={2.5}>
                <Section title="Nature du soin">
                  <Stack spacing={2}>
                    <TextField select label="Type de soin *" value={form.typeSoin} fullWidth size="small"
                      onChange={e => setForm(f => ({ ...f, typeSoin: e.target.value }))}>
                      {TYPES_SOIN.map(t => <MenuItem key={t} value={t}>{t.replace(/_/g, ' ')}</MenuItem>)}
                    </TextField>
                    <TextField select label="Mode de dépôt *" value={form.modeDepot} fullWidth size="small"
                      onChange={e => setForm(f => ({ ...f, modeDepot: e.target.value }))}>
                      {['SCAN', 'PHOTO', 'SAISIE_MANUELLE', 'TIERS_PAYANT'].map(m =>
                        <MenuItem key={m} value={m}>{m.replace(/_/g, ' ')}</MenuItem>)}
                    </TextField>
                  </Stack>
                </Section>
                <Section title="Montant">
                  <TextField label="Montant réclamé (FCFA) *" type="number" value={form.montantReclame}
                    fullWidth size="small"
                    onChange={e => setForm(f => ({ ...f, montantReclame: e.target.value }))}
                    inputProps={{ min: 0 }} />
                </Section>
              </Box>
            </Box>
          </Box>

          <Box sx={{ px: 4, py: 2.5, borderTop: 1, borderColor: 'divider', bgcolor: 'grey.50' }}>
            {formError && <Alert severity="error" sx={{ mb: 2 }}>{formError}</Alert>}
            <Stack direction="row" spacing={2} justifyContent="flex-end">
              <Button size="large" onClick={() => { setOpenCreate(false); setForm(FORM_INIT); setFormError(null); }}>
                Annuler
              </Button>
              <Button variant="contained" size="large" disabled={createMut.isPending} onClick={handleDeposer}
                sx={{ minWidth: 160 }}>
                {createMut.isPending ? <CircularProgress size={22} sx={{ color: 'white' }} /> : 'Déposer'}
              </Button>
            </Stack>
          </Box>
        </Box>
      </Dialog>
    </Box>
  );
}
