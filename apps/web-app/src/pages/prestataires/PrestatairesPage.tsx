import React, { useState } from 'react';
import {
  Box, Typography, Button, Card, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Chip, IconButton, Dialog,
  TextField, MenuItem, CircularProgress, Alert, Tooltip, Stack,
  DialogContent, DialogActions,
} from '@mui/material';
import { Add, Edit, Close, LocalHospital } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { prestatairesApi } from '../../services/api';

const TYPES = ['HOPITAL', 'CLINIQUE', 'PHARMACIE', 'CABINET_MEDICAL', 'LABORATOIRE', 'OPTICIEN', 'AUTRE'];

const TYPE_COLORS: Record<string, 'error' | 'warning' | 'success' | 'info' | 'default'> = {
  HOPITAL: 'error', CLINIQUE: 'warning', PHARMACIE: 'success',
  LABORATOIRE: 'info', OPTICIEN: 'default', CABINET_MEDICAL: 'default', AUTRE: 'default',
};

const FORM_INIT = { nom: '', type: 'CLINIQUE', adresse: '', ville: '', telephone: '', email: '' };

export function PrestatairesPage() {
  const qc = useQueryClient();
  const [openDialog, setOpenDialog] = useState(false);
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
    setForm({ nom: p.nom, type: p.type, adresse: p.adresse ?? '', ville: p.ville ?? '', telephone: p.telephone ?? '', email: p.email ?? '' });
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
    const payload: any = { nom: form.nom, type: form.type };
    if (form.adresse) payload.adresse = form.adresse;
    if (form.ville) payload.ville = form.ville;
    if (form.telephone) payload.telephone = form.telephone;
    if (form.email) payload.email = form.email;
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
                {['Nom', 'Type', 'Ville', 'Téléphone', 'Email', 'Statut', ''].map(h => (
                  <TableCell key={h} sx={{ fontWeight: 700 }}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={7} align="center" sx={{ py: 4 }}><CircularProgress /></TableCell></TableRow>
              ) : prestataires.length === 0 ? (
                <TableRow><TableCell colSpan={7} align="center" sx={{ py: 4, color: 'text.secondary' }}>
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
                  <TableCell>{p.telephone ?? '—'}</TableCell>
                  <TableCell>{p.email ?? '—'}</TableCell>
                  <TableCell>
                    <Chip label={p.estActif ? 'Actif' : 'Inactif'} size="small"
                      color={p.estActif ? 'success' : 'default'} />
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Modifier">
                      <IconButton size="small" onClick={() => openEdit(p)}><Edit fontSize="small" /></IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Dialog création / édition */}
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
