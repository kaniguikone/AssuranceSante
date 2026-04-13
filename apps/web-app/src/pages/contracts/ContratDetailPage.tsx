import React, { useState } from 'react';
import {
  Box, Typography, Button, Chip, Tabs, Tab, CircularProgress, Alert,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Stack, Tooltip, IconButton, Dialog, DialogContent, DialogActions,
  TextField,
} from '@mui/material';
import {
  ArrowBack, PlayArrow, Pause, Cancel, EventNote, PersonAdd, Close,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { contratsApi, echeancesApi, echeancesResumeApi, membresApi } from '../../services/api';

const STATUT_COLORS: Record<string, 'success' | 'warning' | 'error' | 'info' | 'default'> = {
  ACTIF: 'success', SUSPENDU: 'warning', RESILIE: 'error', EN_ATTENTE: 'info',
};

const TYPE_DOCUMENT = ['CNI', 'PASSEPORT', 'TITRE_SEJOUR', 'PERMIS_CONDUIRE'];

const MEMBRE_FORM_INIT = {
  nom: '', prenoms: '', dateNaissance: '', genre: 'M',
  telephone: '', email: '', numeroDocument: '', typeDocument: 'CNI',
  adresseCommune: '',
};

function formatFCFA(n: number) {
  return new Intl.NumberFormat('fr-CI', { style: 'currency', currency: 'XOF', maximumFractionDigits: 0 }).format(n);
}
function formatDate(d: string) {
  return d ? new Date(d).toLocaleDateString('fr-CI') : '—';
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
      <Typography variant="caption" color="text.secondary" display="block">{label}</Typography>
      <Typography variant="body1" fontWeight={600} mt={0.5}>{value || '—'}</Typography>
    </Paper>
  );
}

export function ContratDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [tab, setTab] = useState(0);
  const [actionError, setActionError] = useState<string | null>(null);
  const [resilierDialog, setResilierDialog] = useState(false);
  const [motifResiliation, setMotifResiliation] = useState('');
  const [openMembre, setOpenMembre] = useState(false);
  const [membreForm, setMembreForm] = useState(MEMBRE_FORM_INIT);
  const [membreError, setMembreError] = useState<string | null>(null);
  const [paiementDialog, setPaiementDialog] = useState<{ id: string; montantDu: number } | null>(null);
  const [paiementForm, setPaiementForm] = useState({ montantPaye: '', transactionId: '' });

  const { data: contrat, isLoading, error, refetch } = useQuery({
    queryKey: ['contrat', id],
    queryFn: () => contratsApi.get(id!).then(r => r.data),
    enabled: !!id,
  });

  const { data: echeances, isLoading: ecLoading } = useQuery({
    queryKey: ['echeances', id],
    queryFn: () => echeancesApi.byContrat(id!).then(r => r.data),
    enabled: !!id && tab === 1,
  });

  const { data: resumeData } = useQuery({
    queryKey: ['echeances-resume', id],
    queryFn: () => echeancesResumeApi.byContrat(id!).then(r => r.data),
    enabled: !!id && tab === 1,
  });

  const { data: membresContrat, isLoading: membresLoading } = useQuery({
    queryKey: ['membres-contrat', id],
    queryFn: () => membresApi.list({ contratId: id }).then(r => r.data),
    enabled: !!id && tab === 2,
  });

  const refresh = () => { refetch(); qc.invalidateQueries({ queryKey: ['contrats'] }); };

  const activerMut = useMutation({
    mutationFn: () => contratsApi.activate(id!),
    onSuccess: () => { refresh(); setActionError(null); },
    onError: (e: any) => setActionError(e.response?.data?.message ?? e.message),
  });

  const suspendreMut = useMutation({
    mutationFn: () => contratsApi.suspend(id!),
    onSuccess: () => { refresh(); setActionError(null); },
    onError: (e: any) => setActionError(e.response?.data?.message ?? e.message),
  });

  const reactiverMut = useMutation({
    mutationFn: () => contratsApi.reactivate(id!),
    onSuccess: () => { refresh(); setActionError(null); },
    onError: (e: any) => setActionError(e.response?.data?.message ?? e.message),
  });

  const resilierMut = useMutation({
    mutationFn: (motif: string) => contratsApi.terminate(id!, motif),
    onSuccess: () => { refresh(); setResilierDialog(false); setMotifResiliation(''); setActionError(null); },
    onError: (e: any) => setActionError(e.response?.data?.message ?? e.message),
  });

  const genererMut = useMutation({
    mutationFn: () => echeancesApi.generer({
      contratId: contrat!.id,
      membreId: contrat!.souscripteurId,
      primeMensuelle: Number(contrat!.primeMensuelle),
      dateDebut: contrat!.dateEffet,
      dateFin: contrat!.dateEcheance,
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['echeances', id] }); setTab(1); setActionError(null); },
    onError: (e: any) => setActionError(e.response?.data?.message ?? e.message),
  });

  const paiementMut = useMutation({
    mutationFn: ({ echeanceId, montantPaye, transactionId }: { echeanceId: string; montantPaye: number; transactionId: string }) =>
      echeancesApi.paiement(echeanceId, { montantPaye, transactionId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['echeances', id] });
      setPaiementDialog(null);
      setPaiementForm({ montantPaye: '', transactionId: '' });
    },
    onError: (e: any) => setActionError(e.response?.data?.message ?? e.message),
  });

  const createMembreMut = useMutation({
    mutationFn: (d: unknown) => membresApi.create(d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['membres-contrat', id] });
      qc.invalidateQueries({ queryKey: ['membres'] });
      setOpenMembre(false);
      setMembreForm(MEMBRE_FORM_INIT);
      setMembreError(null);
    },
    onError: (e: any) => {
      const msg = e.response?.data?.message;
      setMembreError(Array.isArray(msg) ? msg.join(', ') : (msg ?? e.message));
    },
  });

  const echeancesList: any[] = Array.isArray(echeances) ? echeances : (echeances as any)?.data ?? [];
  const membresList: any[] = Array.isArray(membresContrat) ? membresContrat : (membresContrat as any)?.data ?? [];

  if (isLoading) return (
    <Box display="flex" justifyContent="center" pt={8}><CircularProgress /></Box>
  );
  if (error || !contrat) return (
    <Box>
      <Button startIcon={<ArrowBack />} onClick={() => navigate('/contrats')} sx={{ mb: 2 }}>Retour</Button>
      <Alert severity="error">Contrat introuvable</Alert>
    </Box>
  );

  return (
    <Box>
      {/* Breadcrumb */}
      <Button startIcon={<ArrowBack />} onClick={() => navigate('/contrats')} sx={{ mb: 2 }} color="inherit">
        Retour aux contrats
      </Button>

      {/* Header */}
      <Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden', mb: 3 }}>
        <Box sx={{ px: 4, py: 3, bgcolor: 'primary.main', color: 'white' }}
          display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
          <Box>
            <Typography variant="h5" fontWeight={700}>{contrat.numero}</Typography>
            <Stack direction="row" spacing={1} mt={0.5}>
              <Chip label={contrat.statut} size="small"
                sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', fontWeight: 600 }} />
              <Chip label={contrat.type} size="small" variant="outlined"
                sx={{ color: 'rgba(255,255,255,0.8)', borderColor: 'rgba(255,255,255,0.4)' }} />
            </Stack>
          </Box>
          <Stack direction="row" spacing={1} flexWrap="wrap">
            {contrat.statut === 'EN_ATTENTE' && (
              <Button variant="outlined" size="small" startIcon={<PlayArrow />}
                sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.5)' }}
                disabled={activerMut.isPending} onClick={() => activerMut.mutate()}>
                Activer
              </Button>
            )}
            {contrat.statut === 'ACTIF' && (
              <Button variant="outlined" size="small" startIcon={<Pause />}
                sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.5)' }}
                disabled={suspendreMut.isPending} onClick={() => suspendreMut.mutate()}>
                Suspendre
              </Button>
            )}
            {contrat.statut === 'SUSPENDU' && (
              <Button variant="outlined" size="small" startIcon={<PlayArrow />}
                sx={{ color: '#c8e6c9', borderColor: 'rgba(200,230,201,0.6)' }}
                disabled={reactiverMut.isPending} onClick={() => reactiverMut.mutate()}>
                {reactiverMut.isPending ? <CircularProgress size={14} sx={{ color: 'white' }} /> : 'Réactiver'}
              </Button>
            )}
            {!['RESILIE', 'EXPIRE'].includes(contrat.statut) && (
              <Button variant="outlined" size="small" startIcon={<Cancel />}
                sx={{ color: '#ffcdd2', borderColor: 'rgba(255,205,210,0.5)' }}
                onClick={() => { setMotifResiliation(''); setResilierDialog(true); }}>
                Résilier
              </Button>
            )}
            {contrat.statut === 'ACTIF' && (
              <Button variant="outlined" size="small" startIcon={<EventNote />}
                sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.5)' }}
                disabled={genererMut.isPending} onClick={() => genererMut.mutate()}>
                {genererMut.isPending ? <CircularProgress size={14} sx={{ color: 'white' }} /> : 'Échéances'}
              </Button>
            )}
            <Button variant="outlined" size="small" startIcon={<PersonAdd />}
              sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.5)' }}
              onClick={() => { setMembreForm(MEMBRE_FORM_INIT); setMembreError(null); setOpenMembre(true); }}>
              + Membre
            </Button>
          </Stack>
        </Box>

        {actionError && (
          <Alert severity="error" onClose={() => setActionError(null)} sx={{ borderRadius: 0 }}>
            {actionError}
          </Alert>
        )}

        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ px: 3, borderBottom: 1, borderColor: 'divider' }}>
          <Tab label="Informations" />
          <Tab label="Échéances" />
          <Tab label="Membres" />
        </Tabs>
      </Paper>

      {/* Onglet Informations */}
      {tab === 0 && (
        <Box display="grid" gridTemplateColumns={{ xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' }} gap={2}>
          <InfoCard label="Type" value={contrat.type} />
          <InfoCard label="Formule" value={contrat.formule} />
          <InfoCard label="Statut" value={contrat.statut} />
          <InfoCard label="Date d'effet" value={formatDate(contrat.dateEffet)} />
          <InfoCard label="Date d'échéance" value={formatDate(contrat.dateEcheance)} />
          <InfoCard label="Prime mensuelle" value={contrat.primeMensuelle ? formatFCFA(contrat.primeMensuelle) : '—'} />
          <InfoCard label="Prime annuelle" value={contrat.primeAnnuelle ? formatFCFA(contrat.primeAnnuelle) : '—'} />
          <InfoCard label="Taux remboursement" value={contrat.tauxRemboursement ? `${contrat.tauxRemboursement}%` : '—'} />
          <InfoCard label="Franchise" value={contrat.franchise ? formatFCFA(contrat.franchise) : '—'} />
          <InfoCard label="Plafond annuel" value={contrat.plafondAnnuel ? formatFCFA(contrat.plafondAnnuel) : '—'} />
          <InfoCard label="Plafond hospitalisation" value={contrat.plafondHospitalisation ? formatFCFA(contrat.plafondHospitalisation) : '—'} />
          <InfoCard label="Renouvellement auto" value={contrat.estRenouvellementAuto ? 'Oui' : 'Non'} />
        </Box>
      )}

      {/* Onglet Échéances */}
      {tab === 1 && (
        ecLoading ? <Box display="flex" justifyContent="center" pt={4}><CircularProgress /></Box> : (
          <Box>
            {/* Résumé financier */}
            {resumeData && (
              <Box display="grid" gridTemplateColumns={{ xs: '1fr 1fr', md: '1fr 1fr 1fr 1fr' }} gap={2} mb={3}>
                {[
                  { label: 'Total dû', value: formatFCFA(Number(resumeData.totalDu ?? 0)), color: 'text.primary' },
                  { label: 'Total payé', value: formatFCFA(Number(resumeData.totalPaye ?? 0)), color: 'success.main' },
                  { label: 'Reste à payer', value: formatFCFA(Number(resumeData.resteAPayer ?? resumeData.totalRestant ?? 0)), color: 'error.main' },
                  { label: 'Échéances en retard', value: String(resumeData.echeancesEnRetard ?? 0), color: 'warning.main' },
                ].map(({ label, value, color }) => (
                  <Paper key={label} variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                    <Typography variant="caption" color="text.secondary" display="block">{label}</Typography>
                    <Typography variant="h6" fontWeight={700} color={color} mt={0.5}>{value}</Typography>
                  </Paper>
                ))}
              </Box>
            )}
          <Paper variant="outlined" sx={{ borderRadius: 2 }}>
            <TableContainer>
              <Table>
                <TableHead sx={{ bgcolor: 'grey.50' }}>
                  <TableRow>
                    {['Période', 'Date échéance', 'Montant dû', 'Montant payé', 'Statut', ''].map(h =>
                      <TableCell key={h} sx={{ fontWeight: 700 }}>{h}</TableCell>)}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {echeancesList.length === 0 ? (
                    <TableRow><TableCell colSpan={6} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                      Aucune échéance — cliquez "Échéances" pour générer
                    </TableCell></TableRow>
                  ) : echeancesList.map((e: any) => (
                    <TableRow key={e.id}>
                      <TableCell><Typography fontWeight={600}>{e.mois}/{e.annee ?? e.periode}</Typography></TableCell>
                      <TableCell>{formatDate(e.dateEcheance)}</TableCell>
                      <TableCell><Typography fontWeight={500}>{formatFCFA(e.montantDu)}</Typography></TableCell>
                      <TableCell>
                        <Typography fontWeight={500} color={Number(e.montantPaye) > 0 ? 'success.main' : 'text.secondary'}>
                          {Number(e.montantPaye) > 0 ? formatFCFA(e.montantPaye) : '—'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip label={e.statut} size="small"
                          color={e.statut === 'PAYE' ? 'success' : e.statut === 'EN_RETARD' ? 'error' : 'default'} />
                      </TableCell>
                      <TableCell align="right">
                        {e.statut !== 'PAYE' && (
                          <Button size="small" variant="outlined" color="success"
                            onClick={() => {
                              setPaiementForm({ montantPaye: String(e.montantDu), transactionId: '' });
                              setPaiementDialog({ id: e.id, montantDu: e.montantDu });
                            }}>
                            Payer
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
          </Box>
        )
      )}

      {/* Onglet Membres */}
      {tab === 2 && (
        membresLoading ? <Box display="flex" justifyContent="center" pt={4}><CircularProgress /></Box> : (
          <Paper variant="outlined" sx={{ borderRadius: 2 }}>
            <TableContainer>
              <Table>
                <TableHead sx={{ bgcolor: 'grey.50' }}>
                  <TableRow>
                    {['Membre', 'Téléphone', 'Lien', 'N° carte', 'Statut'].map(h =>
                      <TableCell key={h} sx={{ fontWeight: 700 }}>{h}</TableCell>)}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {membresList.length === 0 ? (
                    <TableRow><TableCell colSpan={5} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                      Aucun membre rattaché
                    </TableCell></TableRow>
                  ) : membresList.map((m: any) => (
                    <TableRow key={m.id} hover>
                      <TableCell>
                        <Typography fontWeight={600}>{m.prenoms} {m.nom}</Typography>
                        <Typography variant="caption" color="text.secondary">{m.email ?? ''}</Typography>
                      </TableCell>
                      <TableCell>{m.telephone}</TableCell>
                      <TableCell><Chip label={m.lienParente} size="small" /></TableCell>
                      <TableCell>
                        <Typography variant="caption" fontFamily="monospace">{m.numeroCarte}</Typography>
                      </TableCell>
                      <TableCell>
                        <Chip label={m.statut} size="small" color={m.statut === 'ACTIF' ? 'success' : 'warning'} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        )
      )}

      {/* ===== Dialog résiliation ===== */}
      <Dialog open={resilierDialog} onClose={() => setResilierDialog(false)}
        maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <Box sx={{ px: 3, py: 2.5, bgcolor: 'error.main', color: 'white' }}
          display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6" fontWeight={700}>Résilier le contrat</Typography>
          <IconButton onClick={() => setResilierDialog(false)} sx={{ color: 'white' }}><Close /></IconButton>
        </Box>
        <DialogContent sx={{ pt: 3 }}>
          <TextField label="Motif de résiliation *" fullWidth multiline rows={4}
            value={motifResiliation} onChange={e => setMotifResiliation(e.target.value)}
            placeholder="Décrivez la raison de la résiliation..." />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setResilierDialog(false)}>Annuler</Button>
          <Button variant="contained" color="error"
            disabled={!motifResiliation || resilierMut.isPending}
            onClick={() => resilierMut.mutate(motifResiliation)}>
            {resilierMut.isPending ? <CircularProgress size={20} sx={{ color: 'white' }} /> : 'Résilier'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ===== Dialog paiement ===== */}
      <Dialog open={!!paiementDialog} onClose={() => setPaiementDialog(null)}
        maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <Box sx={{ px: 3, py: 2.5, bgcolor: 'success.dark', color: 'white' }}
          display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6" fontWeight={700}>Enregistrer un paiement</Typography>
          <IconButton onClick={() => setPaiementDialog(null)} sx={{ color: 'white' }}><Close /></IconButton>
        </Box>
        <DialogContent sx={{ pt: 3 }}>
          <Stack spacing={2.5}>
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
              <Typography variant="caption" color="text.secondary">Montant dû</Typography>
              <Typography variant="h6" fontWeight={700} color="success.dark">
                {paiementDialog ? formatFCFA(paiementDialog.montantDu) : '—'}
              </Typography>
            </Paper>
            <TextField label="Montant payé (FCFA) *" type="number" fullWidth size="small"
              value={paiementForm.montantPaye}
              onChange={e => setPaiementForm(f => ({ ...f, montantPaye: e.target.value }))} />
            <TextField label="Référence transaction" fullWidth size="small"
              value={paiementForm.transactionId}
              onChange={e => setPaiementForm(f => ({ ...f, transactionId: e.target.value }))}
              placeholder="N° virement, référence reçu..." />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setPaiementDialog(null)}>Annuler</Button>
          <Button variant="contained" color="success"
            disabled={!paiementForm.montantPaye || paiementMut.isPending}
            onClick={() => paiementMut.mutate({
              echeanceId: paiementDialog!.id,
              montantPaye: Number(paiementForm.montantPaye),
              transactionId: paiementForm.transactionId,
            })}>
            {paiementMut.isPending ? <CircularProgress size={20} sx={{ color: 'white' }} /> : 'Confirmer'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ===== Dialog ajout membre ===== */}
      <Dialog open={openMembre} onClose={() => setOpenMembre(false)}
        maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <Box sx={{ px: 4, py: 3, bgcolor: 'primary.main', color: 'white' }}
          display="flex" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="h6" fontWeight={700}>Ajouter un membre</Typography>
            <Typography variant="caption" sx={{ opacity: 0.8 }}>Contrat {contrat.numero}</Typography>
          </Box>
          <IconButton onClick={() => setOpenMembre(false)} sx={{ color: 'white' }}><Close /></IconButton>
        </Box>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            {membreError && <Alert severity="error">{membreError}</Alert>}
            <Box display="grid" gridTemplateColumns="1fr 1fr" gap={2}>
              <TextField label="Nom *" value={membreForm.nom} size="small"
                onChange={e => setMembreForm(f => ({ ...f, nom: e.target.value }))} />
              <TextField label="Prénoms *" value={membreForm.prenoms} size="small"
                onChange={e => setMembreForm(f => ({ ...f, prenoms: e.target.value }))} />
              <TextField label="Date de naissance *" type="date" value={membreForm.dateNaissance} size="small"
                onChange={e => setMembreForm(f => ({ ...f, dateNaissance: e.target.value }))}
                InputLabelProps={{ shrink: true }} />
              <TextField select label="Genre *" value={membreForm.genre} size="small"
                onChange={e => setMembreForm(f => ({ ...f, genre: e.target.value }))}>
                <option value="M">Masculin</option>
                <option value="F">Féminin</option>
              </TextField>
              <TextField label="Téléphone *" value={membreForm.telephone} size="small"
                onChange={e => setMembreForm(f => ({ ...f, telephone: e.target.value }))} />
              <TextField label="Email" value={membreForm.email} size="small"
                onChange={e => setMembreForm(f => ({ ...f, email: e.target.value }))} />
              <TextField select label="Type document *" value={membreForm.typeDocument} size="small"
                onChange={e => setMembreForm(f => ({ ...f, typeDocument: e.target.value }))}>
                {TYPE_DOCUMENT.map(t => <option key={t} value={t}>{t}</option>)}
              </TextField>
              <TextField label="N° document *" value={membreForm.numeroDocument} size="small"
                onChange={e => setMembreForm(f => ({ ...f, numeroDocument: e.target.value }))} />
            </Box>
            <TextField label="Commune / Adresse *" value={membreForm.adresseCommune} size="small" fullWidth
              onChange={e => setMembreForm(f => ({ ...f, adresseCommune: e.target.value }))} />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setOpenMembre(false)}>Annuler</Button>
          <Button variant="contained" disabled={createMembreMut.isPending}
            onClick={() => createMembreMut.mutate({
              ...membreForm,
              email: membreForm.email || undefined,
              contratId: id,
            })}>
            {createMembreMut.isPending ? <CircularProgress size={20} sx={{ color: 'white' }} /> : 'Enregistrer'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
