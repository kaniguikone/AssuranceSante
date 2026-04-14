import React, { useState } from 'react';
import {
  Box, Typography, Button, Card, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Chip, IconButton, Dialog,
  TextField, MenuItem, CircularProgress, Alert, Tooltip, Stack,
  DialogContent, DialogActions, Paper, Switch, FormControlLabel,
} from '@mui/material';
import { Add, Edit, Close, LocalHospital, Visibility, CheckCircle } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { prestatairesApi } from '../../services/api';

const TYPES = ['HOPITAL', 'CLINIQUE', 'PHARMACIE', 'CABINET_MEDICAL', 'LABORATOIRE', 'OPTICIEN', 'AUTRE'];

const TYPE_COLORS: Record<string, 'error' | 'warning' | 'success' | 'info' | 'default'> = {
  HOPITAL: 'error', CLINIQUE: 'warning', PHARMACIE: 'success',
  LABORATOIRE: 'info', OPTICIEN: 'default', CABINET_MEDICAL: 'default', AUTRE: 'default',
};

const FORM_INIT = {
  nom: '', type: 'CLINIQUE', adresse: '', ville: '', telephone: '', email: '',
  specialites: '', conventionActive: false, numeroConvention: '', tauxConvention: '',
  tarifConsultation: '', tarifHospitalisation: '',
};

function formatFCFA(n: number) {
  return new Intl.NumberFormat('fr-CI', { style: 'currency', currency: 'XOF', maximumFractionDigits: 0 }).format(n);
}

export function PrestatairesPage() {
  const qc = useQueryClient();
  const [openDialog, setOpenDialog] = useState(false);
  const [detailDialog, setDetailDialog] = useState<any | null>(null);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState(FORM_INIT);
  const [formError, setFormError] = useState<string | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['prestataires'],
    queryFn: () => prestatairesApi.list().then(r => r.data),
  });

  const prestataires: any[] = Array.isArray(data) ? data : [];

  const openCreate = () => { setEditing(null); setForm(FORM_INIT); setFormError(null); setOpenDialog(true); };
  const openEdit = (p: any) => {
    setEditing(p);
    setForm({
      nom: p.nom, type: p.type,
      adresse: p.adresse ?? '', ville: p.ville ?? '',
      telephone: p.telephone ?? '', email: p.email ?? '',
      specialites: (p.specialites ?? []).join(', '),
      conventionActive: p.conventionActive ?? false,
      numeroConvention: p.numeroConvention ?? '',
      tauxConvention: p.tauxConvention ? String(p.tauxConvention) : '',
      tarifConsultation: p.tarifConsultation ? String(p.tarifConsultation) : '',
      tarifHospitalisation: p.tarifHospitalisation ? String(p.tarifHospitalisation) : '',
    });
    setFormError(null);
    setOpenDialog(true);
  };
  const closeDialog = () => { setOpenDialog(false); setEditing(null); setForm(FORM_INIT); setFormError(null); };

  const saveMut = useMutation({
    mutationFn: (d: unknown) => editing
      ? prestatairesApi.update(editing.id, d)
      : prestatairesApi.create(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['prestataires'] }); closeDialog(); },
    onError: (e: any) => {
      const msg = e.response?.data?.message;
      setFormError(Array.isArray(msg) ? msg.join(', ') : (msg ?? e.message));
    },
  });

  const handleSave = () => {
    if (!form.nom) { setFormError('Le nom est obligatoire'); return; }
    const specialitesList = form.specialites
      ? form.specialites.split(',').map((s: string) => s.trim()).filter(Boolean)
      : [];
    const payload: any = {
      nom: form.nom, type: form.type,
      specialites: specialitesList,
      conventionActive: form.conventionActive,
    };
    if (form.adresse) payload.adresse = form.adresse;
    if (form.ville) payload.ville = form.ville;
    if (form.telephone) payload.telephone = form.telephone;
    if (form.email) payload.email = form.email;
    if (form.numeroConvention) payload.numeroConvention = form.numeroConvention;
    if (form.tauxConvention) payload.tauxConvention = Number(form.tauxConvention);
    if (form.tarifConsultation) payload.tarifConsultation = Number(form.tarifConsultation);
    if (form.tarifHospitalisation) payload.tarifHospitalisation = Number(form.tarifHospitalisation);
    saveMut.mutate(payload);
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" fontWeight={700}>Prestataires de soins</Typography>
          <Typography variant="body2" color="text.secondary" mt={0.5}>
            Hôpitaux, cliniques, pharmacies et autres établissements de santé
          </Typography>
        </Box>
        <Button variant="contained" size="large" startIcon={<Add />} onClick={openCreate}>
          Nouveau prestataire
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>Erreur de chargement</Alert>}

      <Card>
        <TableContainer>
          <Table>
            <TableHead sx={{ bgcolor: 'grey.50' }}>
              <TableRow>
                {['Nom', 'Type', 'Ville', 'Spécialités', 'Convention', 'Tarif consult.', 'Statut', ''].map(h => (
                  <TableCell key={h} sx={{ fontWeight: 700 }}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={8} align="center" sx={{ py: 4 }}><CircularProgress /></TableCell></TableRow>
              ) : prestataires.length === 0 ? (
                <TableRow><TableCell colSpan={8} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                  Aucun prestataire — cliquez "Nouveau prestataire" pour commencer
                </TableCell></TableRow>
              ) : prestataires.map((p: any) => (
                <TableRow key={p.id} hover>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={1}>
                      <LocalHospital fontSize="small" color="primary" />
                      <Typography fontWeight={600}>{p.nom}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip label={p.type?.replace(/_/g, ' ')} size="small"
                      color={TYPE_COLORS[p.type] ?? 'default'} variant="outlined" />
                  </TableCell>
                  <TableCell>{p.ville ?? '—'}</TableCell>
                  <TableCell>
                    {p.specialites?.length > 0
                      ? <Box display="flex" gap={0.5} flexWrap="wrap">
                          {p.specialites.slice(0, 2).map((s: string) => (
                            <Chip key={s} label={s} size="small" variant="outlined" />
                          ))}
                          {p.specialites.length > 2 && (
                            <Chip label={`+${p.specialites.length - 2}`} size="small" />
                          )}
                        </Box>
                      : <Typography variant="caption" color="text.secondary">—</Typography>}
                  </TableCell>
                  <TableCell>
                    {p.conventionActive
                      ? <Chip icon={<CheckCircle />} label={`${p.tauxConvention ?? '?'}%`} size="small" color="success" />
                      : <Typography variant="caption" color="text.secondary">Non</Typography>}
                  </TableCell>
                  <TableCell>
                    {p.tarifConsultation ? formatFCFA(p.tarifConsultation) : '—'}
                  </TableCell>
                  <TableCell>
                    <Chip label={p.estActif ? 'Actif' : 'Inactif'} size="small"
                      color={p.estActif ? 'success' : 'default'} />
                  </TableCell>
                  <TableCell align="right">
                    <Stack direction="row" spacing={0.5}>
                      <Tooltip title="Voir détail">
                        <IconButton size="small" onClick={() => setDetailDialog(p)}>
                          <Visibility fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Modifier">
                        <IconButton size="small" onClick={() => openEdit(p)}><Edit fontSize="small" /></IconButton>
                      </Tooltip>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* ===== Dialog détail ===== */}
      <Dialog open={!!detailDialog} onClose={() => setDetailDialog(null)}
        maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        {detailDialog && (
          <>
            <Box sx={{ px: 4, py: 3, bgcolor: 'primary.main', color: 'white' }}
              display="flex" justifyContent="space-between" alignItems="center">
              <Box>
                <Typography variant="h6" fontWeight={700}>{detailDialog.nom}</Typography>
                <Chip label={detailDialog.type?.replace(/_/g, ' ')} size="small"
                  sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', mt: 0.5 }} />
              </Box>
              <IconButton onClick={() => setDetailDialog(null)} sx={{ color: 'white' }}><Close /></IconButton>
            </Box>
            <DialogContent>
              <Box display="grid" gridTemplateColumns="1fr 1fr" gap={2} mt={1}>
                {[
                  ['Adresse', detailDialog.adresse ?? '—'],
                  ['Ville', detailDialog.ville ?? '—'],
                  ['Téléphone', detailDialog.telephone ?? '—'],
                  ['Email', detailDialog.email ?? '—'],
                ].map(([label, val]) => (
                  <Paper key={label} variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
                    <Typography variant="caption" color="text.secondary" display="block">{label}</Typography>
                    <Typography variant="body2" fontWeight={600}>{val}</Typography>
                  </Paper>
                ))}
              </Box>

              {detailDialog.specialites?.length > 0 && (
                <Box mt={2}>
                  <Typography variant="overline" color="primary" fontWeight={700} display="block" mb={1}>Spécialités</Typography>
                  <Box display="flex" gap={1} flexWrap="wrap">
                    {detailDialog.specialites.map((s: string) => (
                      <Chip key={s} label={s} variant="outlined" />
                    ))}
                  </Box>
                </Box>
              )}

              {detailDialog.conventionActive && (
                <Box mt={2}>
                  <Typography variant="overline" color="success.main" fontWeight={700} display="block" mb={1}>Convention active</Typography>
                  <Box display="grid" gridTemplateColumns="1fr 1fr 1fr" gap={2}>
                    <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
                      <Typography variant="caption" color="text.secondary" display="block">N° convention</Typography>
                      <Typography variant="body2" fontWeight={600}>{detailDialog.numeroConvention ?? '—'}</Typography>
                    </Paper>
                    <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
                      <Typography variant="caption" color="text.secondary" display="block">Taux prise en charge</Typography>
                      <Typography variant="body2" fontWeight={700} color="success.main">{detailDialog.tauxConvention ?? '—'}%</Typography>
                    </Paper>
                    <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
                      <Typography variant="caption" color="text.secondary" display="block">Tarif consultation</Typography>
                      <Typography variant="body2" fontWeight={600}>{detailDialog.tarifConsultation ? formatFCFA(detailDialog.tarifConsultation) : '—'}</Typography>
                    </Paper>
                  </Box>
                  {detailDialog.tarifHospitalisation && (
                    <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2, mt: 1 }}>
                      <Typography variant="caption" color="text.secondary" display="block">Tarif hospitalisation / jour</Typography>
                      <Typography variant="body2" fontWeight={600}>{formatFCFA(detailDialog.tarifHospitalisation)}</Typography>
                    </Paper>
                  )}
                </Box>
              )}
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
              <Button onClick={() => { openEdit(detailDialog); setDetailDialog(null); }} startIcon={<Edit />}>
                Modifier
              </Button>
              <Button variant="contained" onClick={() => setDetailDialog(null)}>Fermer</Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* ===== Dialog création / édition ===== */}
      <Dialog open={openDialog} onClose={closeDialog}
        maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3, overflow: 'hidden' } }}>
        <Box sx={{ px: 4, py: 3, bgcolor: 'primary.main', color: 'white' }}
          display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6" fontWeight={700}>
            {editing ? 'Modifier le prestataire' : 'Nouveau prestataire'}
          </Typography>
          <IconButton onClick={closeDialog} sx={{ color: 'white' }}><Close /></IconButton>
        </Box>

        <DialogContent>
          <Stack spacing={2} mt={1}>
            {formError && <Alert severity="error">{formError}</Alert>}
            <TextField label="Nom *" value={form.nom} fullWidth size="small"
              onChange={e => setForm(f => ({ ...f, nom: e.target.value }))} />
            <TextField select label="Type *" value={form.type} fullWidth size="small"
              onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
              {TYPES.map(t => <MenuItem key={t} value={t}>{t.replace(/_/g, ' ')}</MenuItem>)}
            </TextField>
            <Box display="grid" gridTemplateColumns="1fr 1fr" gap={2}>
              <TextField label="Adresse" value={form.adresse} size="small"
                onChange={e => setForm(f => ({ ...f, adresse: e.target.value }))} />
              <TextField label="Ville" value={form.ville} size="small"
                onChange={e => setForm(f => ({ ...f, ville: e.target.value }))} />
              <TextField label="Téléphone" value={form.telephone} size="small"
                onChange={e => setForm(f => ({ ...f, telephone: e.target.value }))} />
              <TextField label="Email" value={form.email} size="small"
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
            </Box>
            <TextField label="Spécialités (séparées par virgule)" value={form.specialites} size="small" fullWidth
              onChange={e => setForm(f => ({ ...f, specialites: e.target.value }))}
              placeholder="Cardiologie, Pédiatrie, Chirurgie…" />
            <FormControlLabel
              control={<Switch checked={form.conventionActive}
                onChange={e => setForm(f => ({ ...f, conventionActive: e.target.checked }))} />}
              label="Convention active avec SANTÉ-CI" />
            {form.conventionActive && (
              <Box display="grid" gridTemplateColumns="1fr 1fr 1fr" gap={2}>
                <TextField label="N° convention" value={form.numeroConvention} size="small"
                  onChange={e => setForm(f => ({ ...f, numeroConvention: e.target.value }))} />
                <TextField label="Taux (%)" type="number" value={form.tauxConvention} size="small"
                  onChange={e => setForm(f => ({ ...f, tauxConvention: e.target.value }))}
                  inputProps={{ min: 0, max: 100 }} />
                <TextField label="Tarif consultation (FCFA)" type="number" value={form.tarifConsultation} size="small"
                  onChange={e => setForm(f => ({ ...f, tarifConsultation: e.target.value }))} />
              </Box>
            )}
          </Stack>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={closeDialog}>Annuler</Button>
          <Button variant="contained" disabled={saveMut.isPending} onClick={handleSave} sx={{ minWidth: 120 }}>
            {saveMut.isPending ? <CircularProgress size={20} sx={{ color: 'white' }} /> : (editing ? 'Enregistrer' : 'Créer')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
