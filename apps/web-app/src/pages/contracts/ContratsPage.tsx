import React, { useState } from 'react';
import {
  Box, Typography, Button, Card, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Chip, IconButton, Dialog,
  TextField, MenuItem, CircularProgress, Alert, Tooltip, Stack, Paper,
} from '@mui/material';
import { Add, Visibility, Close } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { contratsApi, produitsApi } from '../../services/api';

const STATUT_COLORS: Record<string, 'success' | 'warning' | 'error' | 'info' | 'default'> = {
  ACTIF: 'success', SUSPENDU: 'warning', RESILIE: 'error', EN_ATTENTE: 'info',
};

const TYPE_DOCUMENT = ['CNI', 'PASSEPORT', 'TITRE_SEJOUR', 'PERMIS_CONDUIRE'];

function formatFCFA(n: number) {
  return new Intl.NumberFormat('fr-CI', { style: 'currency', currency: 'XOF', maximumFractionDigits: 0 }).format(n);
}
function formatDate(d: string) {
  return d ? new Date(d).toLocaleDateString('fr-CI') : '—';
}

const MEMBRE_FORM_INIT = {
  nom: '', prenoms: '', dateNaissance: '', genre: 'M',
  telephone: '', email: '', numeroDocument: '', typeDocument: 'CNI',
  adresseCommune: '',
};
const CONTRAT_FORM_INIT = {
  type: 'INDIVIDUEL', produitId: '', dateEffet: '', dateEcheance: '', estRenouvellementAuto: true,
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2 }}>
      <Typography variant="overline" color="primary" fontWeight={700} display="block" mb={2}>{title}</Typography>
      {children}
    </Paper>
  );
}

export function ContratsPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [openCreate, setOpenCreate] = useState(false);
  const [form, setForm] = useState(CONTRAT_FORM_INIT);
  const [souscripteurForm, setSouscripteurForm] = useState(MEMBRE_FORM_INIT);
  const [formError, setFormError] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['contrats'],
    queryFn: () => contratsApi.list().then(r => r.data),
  });
  const { data: produits } = useQuery({
    queryKey: ['produits'],
    queryFn: () => produitsApi.list().then(r => r.data),
  });

  const createMutation = useMutation({
    mutationFn: () => contratsApi.create({
      ...form,
      nouveauSouscripteur: { ...souscripteurForm, email: souscripteurForm.email || undefined },
    }),
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: ['contrats'] });
      qc.invalidateQueries({ queryKey: ['membres'] });
      setOpenCreate(false);
      resetForm();
      navigate(`/contrats/${r.data.id}`);
    },
    onError: (e: any) => {
      const msg = e.response?.data?.message;
      setFormError(Array.isArray(msg) ? msg.join(', ') : (msg ?? e.message));
    },
  });

  const resetForm = () => {
    setForm(CONTRAT_FORM_INIT);
    setSouscripteurForm(MEMBRE_FORM_INIT);
    setFormError(null);
  };

  const handleCreate = () => {
    if (!form.produitId || !form.dateEffet || !form.dateEcheance) {
      setFormError('Produit et dates sont obligatoires');
      return;
    }
    if (!souscripteurForm.nom || !souscripteurForm.prenoms || !souscripteurForm.telephone
      || !souscripteurForm.numeroDocument || !souscripteurForm.dateNaissance || !souscripteurForm.adresseCommune) {
      setFormError('Tous les champs du souscripteur marqués * sont obligatoires');
      return;
    }
    setFormError(null);
    createMutation.mutate();
  };

  const contrats: any[] = Array.isArray(data) ? data : (data?.data ?? []);
  const produitsList: any[] = Array.isArray(produits) ? produits : (produits?.data ?? []);

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight={700}>Contrats</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={() => setOpenCreate(true)} size="large">
          Nouveau contrat
        </Button>
      </Box>

      <Card>
        <TableContainer>
          <Table>
            <TableHead sx={{ bgcolor: 'grey.50' }}>
              <TableRow>
                {['Numéro', 'Type', 'Produit', 'Date effet', 'Date échéance', 'Prime annuelle', 'Statut', ''].map(h => (
                  <TableCell key={h} sx={{ fontWeight: 700 }}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={8} align="center" sx={{ py: 4 }}><CircularProgress /></TableCell></TableRow>
              ) : contrats.length === 0 ? (
                <TableRow><TableCell colSpan={8} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                  Aucun contrat — cliquez "Nouveau contrat" pour commencer
                </TableCell></TableRow>
              ) : contrats.map((c: any) => (
                <TableRow key={c.id} hover sx={{ cursor: 'pointer' }} onClick={() => navigate(`/contrats/${c.id}`)}>
                  <TableCell><Typography fontWeight={600} color="primary">{c.numero}</Typography></TableCell>
                  <TableCell><Chip label={c.type} size="small" variant="outlined" /></TableCell>
                  <TableCell>{c.produit?.nom ?? c.formule}</TableCell>
                  <TableCell>{formatDate(c.dateEffet)}</TableCell>
                  <TableCell>{formatDate(c.dateEcheance)}</TableCell>
                  <TableCell><Typography fontWeight={500}>{c.primeAnnuelle ? formatFCFA(c.primeAnnuelle) : '—'}</Typography></TableCell>
                  <TableCell><Chip label={c.statut} color={STATUT_COLORS[c.statut] ?? 'default'} size="small" /></TableCell>
                  <TableCell align="right" onClick={e => e.stopPropagation()}>
                    <Tooltip title="Voir détail">
                      <IconButton size="small" onClick={() => navigate(`/contrats/${c.id}`)}>
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

      {/* ===== Dialog création contrat ===== */}
      <Dialog open={openCreate} onClose={() => { setOpenCreate(false); resetForm(); }}
        maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3, overflow: 'hidden' } }}>
        <Box sx={{ px: 4, py: 3, borderBottom: 1, borderColor: 'divider', bgcolor: 'primary.main', color: 'white' }}
          display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6" fontWeight={700}>Nouveau contrat</Typography>
          <IconButton onClick={() => { setOpenCreate(false); resetForm(); }} sx={{ color: 'white' }}><Close /></IconButton>
        </Box>

        <Box sx={{ p: 4, overflowY: 'auto' }}>
          <Box display="grid" gridTemplateColumns="1fr 1fr" gap={3}>
            <Section title="Informations du contrat">
              <Stack spacing={2}>
                <TextField select label="Type de contrat *" value={form.type} fullWidth size="small"
                  onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                  {['INDIVIDUEL', 'FAMILLE', 'COLLECTIF', 'ENTREPRISE'].map(t =>
                    <MenuItem key={t} value={t}>{t}</MenuItem>)}
                </TextField>
                <TextField select label="Produit / Formule *" value={form.produitId} fullWidth size="small"
                  onChange={e => setForm(f => ({ ...f, produitId: e.target.value }))}>
                  {produitsList.length === 0
                    ? <MenuItem value="" disabled>Aucun produit disponible</MenuItem>
                    : produitsList.map((p: any) => (
                      <MenuItem key={p.id} value={p.id}>
                        <Box>
                          <Typography variant="body2" fontWeight={600}>{p.nom}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {formatFCFA(Number(p.primeMensuelleBase))}/mois
                          </Typography>
                        </Box>
                      </MenuItem>
                    ))}
                </TextField>
                <TextField label="Date d'effet *" type="date" value={form.dateEffet} fullWidth size="small"
                  onChange={e => setForm(f => ({ ...f, dateEffet: e.target.value }))}
                  InputLabelProps={{ shrink: true }} />
                <TextField label="Date d'échéance *" type="date" value={form.dateEcheance} fullWidth size="small"
                  onChange={e => setForm(f => ({ ...f, dateEcheance: e.target.value }))}
                  InputLabelProps={{ shrink: true }} />
              </Stack>
            </Section>

            <Section title="Souscripteur (nouveau membre)">
              <Stack spacing={2}>
                <Box display="grid" gridTemplateColumns="1fr 1fr" gap={1.5}>
                  <TextField label="Nom *" value={souscripteurForm.nom} size="small"
                    onChange={e => setSouscripteurForm(f => ({ ...f, nom: e.target.value }))} />
                  <TextField label="Prénoms *" value={souscripteurForm.prenoms} size="small"
                    onChange={e => setSouscripteurForm(f => ({ ...f, prenoms: e.target.value }))} />
                  <TextField label="Date de naissance *" type="date" value={souscripteurForm.dateNaissance} size="small"
                    onChange={e => setSouscripteurForm(f => ({ ...f, dateNaissance: e.target.value }))}
                    InputLabelProps={{ shrink: true }} />
                  <TextField select label="Genre *" value={souscripteurForm.genre} size="small"
                    onChange={e => setSouscripteurForm(f => ({ ...f, genre: e.target.value }))}>
                    <MenuItem value="M">Masculin</MenuItem>
                    <MenuItem value="F">Féminin</MenuItem>
                  </TextField>
                  <TextField label="Téléphone *" value={souscripteurForm.telephone} size="small"
                    onChange={e => setSouscripteurForm(f => ({ ...f, telephone: e.target.value }))}
                    placeholder="+2250700000000" />
                  <TextField label="Email" value={souscripteurForm.email} size="small"
                    onChange={e => setSouscripteurForm(f => ({ ...f, email: e.target.value }))} />
                  <TextField select label="Type document *" value={souscripteurForm.typeDocument} size="small"
                    onChange={e => setSouscripteurForm(f => ({ ...f, typeDocument: e.target.value }))}>
                    {TYPE_DOCUMENT.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                  </TextField>
                  <TextField label="N° document *" value={souscripteurForm.numeroDocument} size="small"
                    onChange={e => setSouscripteurForm(f => ({ ...f, numeroDocument: e.target.value }))} />
                </Box>
                <TextField label="Commune / Adresse *" value={souscripteurForm.adresseCommune} size="small" fullWidth
                  onChange={e => setSouscripteurForm(f => ({ ...f, adresseCommune: e.target.value }))} />
              </Stack>
            </Section>
          </Box>
        </Box>

        <Box sx={{ px: 4, py: 2.5, borderTop: 1, borderColor: 'divider', bgcolor: 'grey.50' }}>
          {formError && <Alert severity="error" sx={{ mb: 2 }}>{formError}</Alert>}
          <Stack direction="row" spacing={2} justifyContent="flex-end">
            <Button size="large" onClick={() => { setOpenCreate(false); resetForm(); }}>Annuler</Button>
            <Button variant="contained" size="large" disabled={createMutation.isPending} onClick={handleCreate}
              sx={{ minWidth: 160 }}>
              {createMutation.isPending ? <CircularProgress size={22} sx={{ color: 'white' }} /> : 'Créer le contrat'}
            </Button>
          </Stack>
        </Box>
      </Dialog>
    </Box>
  );
}
