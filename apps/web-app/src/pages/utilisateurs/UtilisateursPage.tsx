import React, { useState } from 'react';
import {
  Box, Typography, Button, Card, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Chip, IconButton, Dialog,
  TextField, MenuItem, CircularProgress, Alert, Tooltip, Stack,
  DialogContent, DialogActions, Avatar,
} from '@mui/material';
import { Add, Edit, Close, Block, CheckCircle } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { utilisateursApi } from '../../services/api';

const ROLES = ['ADMIN', 'GESTIONNAIRE', 'MEDECIN_CONSEIL', 'AUDITEUR', 'AGENT_SAISIE'];
const ROLE_COLORS: Record<string, 'error' | 'warning' | 'info' | 'default' | 'success'> = {
  ADMIN: 'error', GESTIONNAIRE: 'info', MEDECIN_CONSEIL: 'success', AUDITEUR: 'warning', AGENT_SAISIE: 'default',
};

function formatDate(d: string) {
  return d ? new Date(d).toLocaleDateString('fr-CI') : '—';
}

const CREATE_INIT = { nom: '', prenoms: '', email: '', telephone: '', password: '', roles: ['GESTIONNAIRE'] as string[] };

export function UtilisateursPage() {
  const qc = useQueryClient();
  const [openCreate, setOpenCreate] = useState(false);
  const [openEdit, setOpenEdit] = useState<any>(null);
  const [form, setForm] = useState(CREATE_INIT);
  const [editForm, setEditForm] = useState({ nom: '', prenoms: '', telephone: '', roles: [] as string[], newPassword: '' });
  const [formError, setFormError] = useState<string | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['utilisateurs'],
    queryFn: () => utilisateursApi.list().then(r => r.data),
  });

  const utilisateurs: any[] = Array.isArray(data) ? data : [];

  const createMut = useMutation({
    mutationFn: (d: unknown) => utilisateursApi.create(d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['utilisateurs'] });
      setOpenCreate(false);
      setForm(CREATE_INIT);
      setFormError(null);
    },
    onError: (e: any) => {
      const msg = e.response?.data?.message;
      setFormError(Array.isArray(msg) ? msg.join(', ') : (msg ?? e.message));
    },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: unknown }) => utilisateursApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['utilisateurs'] });
      setOpenEdit(null);
      setFormError(null);
    },
    onError: (e: any) => {
      const msg = e.response?.data?.message;
      setFormError(Array.isArray(msg) ? msg.join(', ') : (msg ?? e.message));
    },
  });

  const toggleMut = useMutation({
    mutationFn: ({ id, estActif }: { id: string; estActif: boolean }) =>
      utilisateursApi.update(id, { estActif }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['utilisateurs'] }),
  });

  const handleCreate = () => {
    if (!form.nom || !form.prenoms || !form.email) {
      setFormError('Nom, prénoms et email sont obligatoires');
      return;
    }
    if (!form.password || form.password.length < 6) {
      setFormError('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }
    createMut.mutate({ ...form, telephone: form.telephone || undefined });
  };

  // Le getter TypeScript n'est pas sérialisé en JSON → on lit userRoles directement
  const getRoles = (u: any): string[] =>
    [...new Set((u.userRoles ?? []).filter((r: any) => !r.revokedAt).map((r: any) => r.role))] as string[];

  const handleEdit = (u: any) => {
    setOpenEdit(u);
    setEditForm({ nom: u.nom, prenoms: u.prenoms, telephone: u.telephone ?? '', roles: getRoles(u), newPassword: '' });
    setFormError(null);
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" fontWeight={700}>Utilisateurs</Typography>
          <Typography variant="body2" color="text.secondary" mt={0.5}>
            Comptes et rôles d'accès à la plateforme
          </Typography>
        </Box>
        <Button variant="contained" size="large" startIcon={<Add />} onClick={() => { setForm(CREATE_INIT); setFormError(null); setOpenCreate(true); }}>
          Nouvel utilisateur
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>Erreur de chargement</Alert>}

      <Card>
        <TableContainer>
          <Table>
            <TableHead sx={{ bgcolor: 'grey.50' }}>
              <TableRow>
                {['Utilisateur', 'Email', 'Téléphone', 'Rôles', 'Dernière connexion', 'Statut', ''].map(h => (
                  <TableCell key={h} sx={{ fontWeight: 700 }}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={7} align="center" sx={{ py: 4 }}><CircularProgress /></TableCell></TableRow>
              ) : utilisateurs.length === 0 ? (
                <TableRow><TableCell colSpan={7} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                  Aucun utilisateur — cliquez "Nouvel utilisateur" pour commencer
                </TableCell></TableRow>
              ) : utilisateurs.map((u: any) => (
                <TableRow key={u.id} hover sx={{ opacity: u.estActif ? 1 : 0.5 }}>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={1.5}>
                      <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main', fontSize: 13 }}>
                        {u.prenoms?.[0]}{u.nom?.[0]}
                      </Avatar>
                      <Box>
                        <Typography fontWeight={600}>{u.prenoms} {u.nom}</Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell>{u.telephone ?? '—'}</TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={0.5} flexWrap="wrap">
                      {getRoles(u).length === 0 ? (
                        <Typography variant="caption" color="text.secondary">Aucun rôle</Typography>
                      ) : getRoles(u).map((r: string) => (
                        <Chip key={r} label={r} size="small" color={ROLE_COLORS[r] ?? 'default'} />
                      ))}
                    </Stack>
                  </TableCell>
                  <TableCell>{formatDate(u.derniereConnexion)}</TableCell>
                  <TableCell>
                    <Chip label={u.estActif ? 'Actif' : 'Inactif'} size="small"
                      color={u.estActif ? 'success' : 'default'} />
                  </TableCell>
                  <TableCell align="right">
                    <Stack direction="row" spacing={0.5}>
                      <Tooltip title="Modifier">
                        <IconButton size="small" onClick={() => handleEdit(u)}><Edit fontSize="small" /></IconButton>
                      </Tooltip>
                      <Tooltip title={u.estActif ? 'Désactiver' : 'Réactiver'}>
                        <IconButton size="small" color={u.estActif ? 'warning' : 'success'}
                          onClick={() => toggleMut.mutate({ id: u.id, estActif: !u.estActif })}>
                          {u.estActif ? <Block fontSize="small" /> : <CheckCircle fontSize="small" />}
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Dialog création */}
      <Dialog open={openCreate} onClose={() => setOpenCreate(false)}
        maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3, overflow: 'hidden' } }}>
        <Box sx={{ px: 4, py: 3, bgcolor: 'primary.main', color: 'white' }}
          display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6" fontWeight={700}>Nouvel utilisateur</Typography>
          <IconButton onClick={() => setOpenCreate(false)} sx={{ color: 'white' }}><Close /></IconButton>
        </Box>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            {formError && <Alert severity="error">{formError}</Alert>}
            <Box display="grid" gridTemplateColumns="1fr 1fr" gap={2}>
              <TextField label="Nom *" value={form.nom} size="small"
                onChange={e => setForm(f => ({ ...f, nom: e.target.value }))} />
              <TextField label="Prénoms *" value={form.prenoms} size="small"
                onChange={e => setForm(f => ({ ...f, prenoms: e.target.value }))} />
            </Box>
            <TextField label="Email *" value={form.email} fullWidth size="small" type="email"
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
            <TextField label="Téléphone" value={form.telephone} fullWidth size="small"
              onChange={e => setForm(f => ({ ...f, telephone: e.target.value }))} />
            <TextField label="Mot de passe *" type="password" value={form.password} fullWidth size="small"
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              helperText="Minimum 6 caractères" />
            <TextField select label="Rôle" value={form.roles[0] ?? ''} fullWidth size="small"
              onChange={e => setForm(f => ({ ...f, roles: [e.target.value] }))}>
              {ROLES.map(r => <MenuItem key={r} value={r}>{r}</MenuItem>)}
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setOpenCreate(false)}>Annuler</Button>
          <Button variant="contained" disabled={createMut.isPending} onClick={handleCreate} sx={{ minWidth: 140 }}>
            {createMut.isPending ? <CircularProgress size={20} sx={{ color: 'white' }} /> : 'Créer'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog édition */}
      <Dialog open={!!openEdit} onClose={() => setOpenEdit(null)}
        maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3, overflow: 'hidden' } }}>
        <Box sx={{ px: 4, py: 3, bgcolor: 'primary.main', color: 'white' }}
          display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6" fontWeight={700}>Modifier l'utilisateur</Typography>
          <IconButton onClick={() => setOpenEdit(null)} sx={{ color: 'white' }}><Close /></IconButton>
        </Box>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            {formError && <Alert severity="error">{formError}</Alert>}
            <Box display="grid" gridTemplateColumns="1fr 1fr" gap={2}>
              <TextField label="Nom" value={editForm.nom} size="small"
                onChange={e => setEditForm(f => ({ ...f, nom: e.target.value }))} />
              <TextField label="Prénoms" value={editForm.prenoms} size="small"
                onChange={e => setEditForm(f => ({ ...f, prenoms: e.target.value }))} />
            </Box>
            <TextField label="Téléphone" value={editForm.telephone} fullWidth size="small"
              onChange={e => setEditForm(f => ({ ...f, telephone: e.target.value }))} />
            <TextField select label="Rôle" value={editForm.roles[0] ?? ''} fullWidth size="small"
              onChange={e => setEditForm(f => ({ ...f, roles: [e.target.value] }))}>
              {ROLES.map(r => <MenuItem key={r} value={r}>{r}</MenuItem>)}
            </TextField>
            <TextField label="Nouveau mot de passe" type="password" value={editForm.newPassword} fullWidth size="small"
              onChange={e => setEditForm(f => ({ ...f, newPassword: e.target.value }))}
              helperText="Laisser vide pour ne pas changer" />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setOpenEdit(null)}>Annuler</Button>
          <Button variant="contained" disabled={updateMut.isPending}
            onClick={() => {
              const { newPassword, ...rest } = editForm;
              const payload: any = { ...rest, telephone: rest.telephone || undefined };
              if (newPassword && newPassword.length >= 6) payload.password = newPassword;
              updateMut.mutate({ id: openEdit.id, data: payload });
            }}
            sx={{ minWidth: 140 }}>
            {updateMut.isPending ? <CircularProgress size={20} sx={{ color: 'white' }} /> : 'Enregistrer'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
