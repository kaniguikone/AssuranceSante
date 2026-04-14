import React, { useState } from 'react';
import {
  Box, Typography, Card, CardContent, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Chip, Button, Dialog, DialogContent,
  DialogActions, TextField, MenuItem, CircularProgress, Alert, Stack, Paper,
  LinearProgress, Tooltip, IconButton,
} from '@mui/material';
import { GppBad, CheckCircle, Cancel, OpenInNew, Security } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { sinistresApi, fraudeApi } from '../../services/api';

function formatFCFA(n: number) {
  return new Intl.NumberFormat('fr-CI', { style: 'currency', currency: 'XOF', maximumFractionDigits: 0 }).format(n);
}
function formatDate(d: string) {
  return d ? new Date(d).toLocaleDateString('fr-CI') : '—';
}

const NIVEAUX = ['FAIBLE', 'MODERE', 'ELEVE', 'CRITIQUE'];
const NIVEAU_COLORS: Record<string, 'default' | 'warning' | 'error' | 'success'> = {
  FAIBLE: 'default', MODERE: 'warning', ELEVE: 'error', CRITIQUE: 'error',
};

export function FraudePage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [marquerDialog, setMarquerDialog] = useState<any | null>(null);
  const [cloturerDialog, setCloturerDialog] = useState<any | null>(null);
  const [marquerForm, setMarquerForm] = useState({ scoreFraude: 70, niveauSuspicion: 'ELEVE' });
  const [cloturerForm, setCloturerForm] = useState({ decision: 'FRAUDE_INFIRMEE', commentaire: '' });
  const [actionError, setActionError] = useState<string | null>(null);

  const { data: alertesData, isLoading, refetch } = useQuery({
    queryKey: ['sinistres-fraude'],
    queryFn: () => sinistresApi.alertes().then(r => r.data),
  });

  const alertes: any[] = Array.isArray(alertesData) ? alertesData : [];

  const marquerMut = useMutation({
    mutationFn: (id: string) => fraudeApi.marquer(id, marquerForm),
    onSuccess: () => { refetch(); qc.invalidateQueries({ queryKey: ['sinistres'] }); setMarquerDialog(null); setActionError(null); },
    onError: (e: any) => setActionError(e.response?.data?.message ?? e.message),
  });

  const cloturerMut = useMutation({
    mutationFn: (id: string) => fraudeApi.cloturer(id, cloturerForm),
    onSuccess: () => { refetch(); qc.invalidateQueries({ queryKey: ['sinistres'] }); setCloturerDialog(null); setActionError(null); },
    onError: (e: any) => setActionError(e.response?.data?.message ?? e.message),
  });

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Box display="flex" alignItems="center" gap={1} mb={0.5}>
            <GppBad color="error" />
            <Typography variant="h4" fontWeight={700}>Gestion des fraudes</Typography>
          </Box>
          <Typography variant="body2" color="text.secondary">
            Sinistres avec score de suspicion ≥ 50 ou marqués FRAUDE_SUSPECTEE
          </Typography>
        </Box>
        <Chip label={`${alertes.length} alerte${alertes.length > 1 ? 's' : ''}`} color="error" />
      </Box>

      {/* Statistiques */}
      <Box display="grid" gridTemplateColumns={{ xs: '1fr 1fr', md: '1fr 1fr 1fr 1fr' }} gap={2} mb={3}>
        {[
          { label: 'Total alertes', val: alertes.length, color: '#C62828' },
          { label: 'Score moyen', val: alertes.length ? Math.round(alertes.reduce((s, a) => s + (a.scoreFraude ?? 0), 0) / alertes.length) + '%' : '—', color: '#E65100' },
          { label: 'Critiques (≥80)', val: alertes.filter(a => (a.scoreFraude ?? 0) >= 80).length, color: '#B71C1C' },
          { label: 'En enquête', val: alertes.filter(a => a.statut === 'FRAUDE_SUSPECTEE').length, color: '#4A148C' },
        ].map(({ label, val, color }) => (
          <Paper key={label} variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
            <Typography variant="caption" color="text.secondary" display="block">{label}</Typography>
            <Typography variant="h5" fontWeight={700} sx={{ color }} mt={0.5}>{val}</Typography>
          </Paper>
        ))}
      </Box>

      {isLoading ? <Box display="flex" justifyContent="center" pt={4}><CircularProgress /></Box> : (
        <Card>
          <CardContent sx={{ p: 0 }}>
            <TableContainer>
              <Table>
                <TableHead sx={{ bgcolor: 'error.50' }}>
                  <TableRow>
                    {['Sinistre', 'Type soin', 'Date', 'Montant', 'Score fraude', 'Niveau', 'Statut', 'Actions'].map(h =>
                      <TableCell key={h} sx={{ fontWeight: 700 }}>{h}</TableCell>)}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {alertes.length === 0 ? (
                    <TableRow><TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                      <Box display="flex" flexDirection="column" alignItems="center" gap={1}>
                        <Security sx={{ fontSize: 48, color: 'success.main', opacity: 0.5 }} />
                        <Typography color="text.secondary">Aucune alerte fraude active</Typography>
                      </Box>
                    </TableCell></TableRow>
                  ) : alertes.map((s: any) => (
                    <TableRow key={s.id} hover sx={{ bgcolor: (s.scoreFraude ?? 0) >= 80 ? 'error.50' : undefined }}>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={0.5}>
                          <Typography fontWeight={700} color="error.dark" variant="body2">{s.numero}</Typography>
                          <Tooltip title="Voir le sinistre">
                            <IconButton size="small" onClick={() => navigate(`/sinistres/${s.id}`)}>
                              <OpenInNew fontSize="inherit" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                      <TableCell><Chip label={s.typeSoin?.replace(/_/g, ' ')} size="small" variant="outlined" /></TableCell>
                      <TableCell><Typography variant="caption">{formatDate(s.dateSoin)}</Typography></TableCell>
                      <TableCell><Typography fontWeight={600}>{formatFCFA(Number(s.montantReclame))}</Typography></TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Box sx={{ width: 60 }}>
                            <LinearProgress variant="determinate" value={s.scoreFraude ?? 0}
                              color={(s.scoreFraude ?? 0) >= 80 ? 'error' : 'warning'}
                              sx={{ height: 6, borderRadius: 3 }} />
                          </Box>
                          <Typography variant="body2" fontWeight={700}
                            color={(s.scoreFraude ?? 0) >= 80 ? 'error.main' : 'warning.main'}>
                            {s.scoreFraude ?? '—'}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip label={s.niveauSuspicion ?? '—'} size="small"
                          color={NIVEAU_COLORS[s.niveauSuspicion ?? ''] ?? 'default'} />
                      </TableCell>
                      <TableCell>
                        <Chip label={s.statut} size="small"
                          color={s.statut === 'FRAUDE_SUSPECTEE' ? 'error' : 'default'} />
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={0.5}>
                          {s.statut !== 'FRAUDE_SUSPECTEE' && (
                            <Tooltip title="Ouvrir enquête fraude">
                              <Button size="small" color="error" variant="outlined"
                                startIcon={<GppBad />}
                                onClick={() => { setMarquerForm({ scoreFraude: s.scoreFraude ?? 70, niveauSuspicion: s.niveauSuspicion ?? 'ELEVE' }); setMarquerDialog(s); }}>
                                Enquête
                              </Button>
                            </Tooltip>
                          )}
                          {s.statut === 'FRAUDE_SUSPECTEE' && (
                            <Tooltip title="Clôturer l'enquête">
                              <Button size="small" color="warning" variant="outlined"
                                startIcon={<CheckCircle />}
                                onClick={() => { setCloturerForm({ decision: 'FRAUDE_INFIRMEE', commentaire: '' }); setCloturerDialog(s); }}>
                                Clôturer
                              </Button>
                            </Tooltip>
                          )}
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* Dialog ouvrir enquête */}
      <Dialog open={!!marquerDialog} onClose={() => setMarquerDialog(null)} maxWidth="xs" fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}>
        <Box sx={{ px: 3, py: 2.5, bgcolor: 'error.main', color: 'white' }}
          display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6" fontWeight={700}>Ouvrir enquête fraude</Typography>
        </Box>
        <DialogContent>
          <Stack spacing={2.5} mt={1}>
            {actionError && <Alert severity="error">{actionError}</Alert>}
            <Typography variant="body2" color="text.secondary">
              Sinistre : <strong>{marquerDialog?.numero}</strong>
            </Typography>
            <TextField label="Score de fraude (0-100)" type="number" size="small" fullWidth
              value={marquerForm.scoreFraude}
              onChange={e => setMarquerForm(f => ({ ...f, scoreFraude: Math.min(100, Math.max(0, Number(e.target.value))) }))}
              inputProps={{ min: 0, max: 100 }} />
            <TextField select label="Niveau de suspicion" size="small" fullWidth
              value={marquerForm.niveauSuspicion}
              onChange={e => setMarquerForm(f => ({ ...f, niveauSuspicion: e.target.value }))}>
              {NIVEAUX.map(n => <MenuItem key={n} value={n}>{n}</MenuItem>)}
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setMarquerDialog(null)}>Annuler</Button>
          <Button variant="contained" color="error" disabled={marquerMut.isPending}
            onClick={() => marquerMut.mutate(marquerDialog!.id)}>
            {marquerMut.isPending ? <CircularProgress size={20} sx={{ color: 'white' }} /> : 'Confirmer enquête'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog clôturer enquête */}
      <Dialog open={!!cloturerDialog} onClose={() => setCloturerDialog(null)} maxWidth="xs" fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}>
        <Box sx={{ px: 3, py: 2.5, bgcolor: 'warning.main', color: 'white' }}
          display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6" fontWeight={700}>Clôturer l'enquête</Typography>
        </Box>
        <DialogContent>
          <Stack spacing={2.5} mt={1}>
            {actionError && <Alert severity="error">{actionError}</Alert>}
            <Typography variant="body2" color="text.secondary">
              Sinistre : <strong>{cloturerDialog?.numero}</strong>
            </Typography>
            <TextField select label="Décision *" size="small" fullWidth
              value={cloturerForm.decision}
              onChange={e => setCloturerForm(f => ({ ...f, decision: e.target.value }))}>
              <MenuItem value="FRAUDE_INFIRMEE">
                <Box display="flex" alignItems="center" gap={1}>
                  <CheckCircle fontSize="small" color="success" /> Fraude infirmée — reprendre en traitement
                </Box>
              </MenuItem>
              <MenuItem value="FRAUDE_CONFIRMEE">
                <Box display="flex" alignItems="center" gap={1}>
                  <Cancel fontSize="small" color="error" /> Fraude confirmée — rejeter le sinistre
                </Box>
              </MenuItem>
            </TextField>
            <TextField label="Commentaire" multiline rows={3} size="small" fullWidth
              value={cloturerForm.commentaire}
              onChange={e => setCloturerForm(f => ({ ...f, commentaire: e.target.value }))}
              placeholder="Détails de la décision..." />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setCloturerDialog(null)}>Annuler</Button>
          <Button variant="contained" color="warning" disabled={cloturerMut.isPending}
            onClick={() => cloturerMut.mutate(cloturerDialog!.id)}>
            {cloturerMut.isPending ? <CircularProgress size={20} sx={{ color: 'white' }} /> : 'Valider décision'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
