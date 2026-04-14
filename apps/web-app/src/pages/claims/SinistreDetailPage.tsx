import React, { useState } from 'react';
import {
  Box, Typography, Button, Chip, CircularProgress, Alert,
  Paper, Stack, IconButton, Dialog, DialogContent, DialogActions,
  TextField, MenuItem, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  LinearProgress,
} from '@mui/material';
import { ArrowBack, CheckCircle, Cancel, AccountBalance, Close, OpenInNew, GppBad, History } from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sinistresApi, auditApi, fraudeApi } from '../../services/api';

const STATUT_COLORS: Record<string, 'default' | 'info' | 'warning' | 'success' | 'error'> = {
  RECU: 'default', EN_VERIFICATION: 'info', EN_VALIDATION_MEDICALE: 'info',
  APPROUVE: 'success', REJETE: 'error', EN_LIQUIDATION: 'warning', PAYE: 'success',
  CONTESTE: 'warning', FRAUDE_SUSPECTEE: 'error',
};

function formatFCFA(n: number) {
  return new Intl.NumberFormat('fr-CI', { style: 'currency', currency: 'XOF', maximumFractionDigits: 0 }).format(n);
}
function formatDate(d: string) {
  return d ? new Date(d).toLocaleDateString('fr-CI') : '—';
}

function InfoCard({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
      <Typography variant="caption" color="text.secondary" display="block">{label}</Typography>
      <Typography variant="body1" fontWeight={600} mt={0.5} color={color ?? 'text.primary'}>
        {value || '—'}
      </Typography>
    </Paper>
  );
}

export function SinistreDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [rejetDialog, setRejetDialog] = useState(false);
  const [liquidDialog, setLiquidDialog] = useState(false);
  const [fraudeDialog, setFraudeDialog] = useState(false);
  const [auditVisible, setAuditVisible] = useState(false);
  const [motifRejet, setMotifRejet] = useState('');
  const [liquidForm, setLiquidForm] = useState({
    franchise: 2000, tauxRemboursement: 70, plafondAnnuelRestant: 500000, commentairesMedecin: '',
  });
  const [fraudeForm, setFraudeForm] = useState({ scoreFraude: 70, niveauSuspicion: 'ELEVE' });

  const { data: sinistre, isLoading, error, refetch } = useQuery({
    queryKey: ['sinistre', id],
    queryFn: () => sinistresApi.get(id!).then(r => r.data),
    enabled: !!id,
  });

  const refresh = () => { refetch(); qc.invalidateQueries({ queryKey: ['sinistres'] }); };

  const approuverMut = useMutation({
    mutationFn: () => sinistresApi.approuver(id!),
    onSuccess: refresh,
  });

  const rejeterMut = useMutation({
    mutationFn: (motif: string) => sinistresApi.rejeter(id!, motif),
    onSuccess: () => { refresh(); setRejetDialog(false); setMotifRejet(''); },
  });

  const liquiderMut = useMutation({
    mutationFn: (data: unknown) => sinistresApi.liquider(id!, data),
    onSuccess: () => { refresh(); setLiquidDialog(false); },
  });

  const fraudeMut = useMutation({
    mutationFn: () => fraudeApi.marquer(id!, fraudeForm),
    onSuccess: () => { refresh(); setFraudeDialog(false); },
  });

  const { data: auditData, isLoading: auditLoading } = useQuery({
    queryKey: ['audit-sinistre', id],
    queryFn: () => auditApi.byRessource('sinistre', id!).then(r => r.data),
    enabled: !!id && auditVisible,
  });
  const auditList: any[] = Array.isArray(auditData) ? auditData : [];

  if (isLoading) return (
    <Box display="flex" justifyContent="center" pt={8}><CircularProgress /></Box>
  );
  if (error || !sinistre) return (
    <Box>
      <Button startIcon={<ArrowBack />} onClick={() => navigate('/sinistres')} sx={{ mb: 2 }}>Retour</Button>
      <Alert severity="error">Sinistre introuvable</Alert>
    </Box>
  );

  const enCours = ['RECU', 'EN_VERIFICATION', 'EN_VALIDATION_MEDICALE'].includes(sinistre.statut);

  return (
    <Box>
      {/* Breadcrumb */}
      <Button startIcon={<ArrowBack />} onClick={() => navigate('/sinistres')} sx={{ mb: 2 }} color="inherit">
        Retour aux sinistres
      </Button>

      {/* Header */}
      <Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden', mb: 3 }}>
        <Box sx={{ px: 4, py: 3, bgcolor: 'primary.main', color: 'white' }}
          display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
          <Box>
            <Typography variant="h5" fontWeight={700}>{sinistre.numero}</Typography>
            <Stack direction="row" spacing={1} mt={0.5}>
              <Chip label={sinistre.statut} size="small"
                sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', fontWeight: 600 }} />
              <Chip label={sinistre.typeSoin?.replace(/_/g, ' ')} size="small" variant="outlined"
                sx={{ color: 'rgba(255,255,255,0.8)', borderColor: 'rgba(255,255,255,0.4)' }} />
            </Stack>
          </Box>
          <Stack direction="row" spacing={1}>
            {enCours && (
              <Button variant="outlined" size="small" startIcon={<CheckCircle />}
                sx={{ color: '#c8e6c9', borderColor: 'rgba(200,230,201,0.6)' }}
                disabled={approuverMut.isPending} onClick={() => approuverMut.mutate()}>
                {approuverMut.isPending ? <CircularProgress size={14} sx={{ color: 'white' }} /> : 'Approuver'}
              </Button>
            )}
            {sinistre.statut === 'APPROUVE' && (
              <Button variant="outlined" size="small" startIcon={<AccountBalance />}
                sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.5)' }}
                onClick={() => setLiquidDialog(true)}>
                Liquider
              </Button>
            )}
            {!['REJETE', 'PAYE'].includes(sinistre.statut) && (
              <Button variant="outlined" size="small" startIcon={<Cancel />}
                sx={{ color: '#ffcdd2', borderColor: 'rgba(255,205,210,0.5)' }}
                onClick={() => { setMotifRejet(''); setRejetDialog(true); }}>
                Rejeter
              </Button>
            )}
            {!['FRAUDE_SUSPECTEE', 'REJETE', 'PAYE'].includes(sinistre.statut) && (
              <Button variant="outlined" size="small" startIcon={<GppBad />}
                sx={{ color: '#ffcdd2', borderColor: 'rgba(255,205,210,0.5)' }}
                onClick={() => setFraudeDialog(true)}>
                Fraude
              </Button>
            )}
            <Button variant="outlined" size="small" startIcon={<History />}
              sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.4)' }}
              onClick={() => setAuditVisible(v => !v)}>
              Audit
            </Button>
          </Stack>
        </Box>
      </Paper>

      {/* Contenu */}
      <Box display="grid" gridTemplateColumns={{ xs: '1fr', md: '1fr 1fr' }} gap={3}>

        {/* Section Identification */}
        <Paper variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
          <Typography variant="overline" color="primary" fontWeight={700} display="block" mb={2}>
            Identification
          </Typography>
          <Box display="grid" gridTemplateColumns="1fr 1fr" gap={1.5}>
            <InfoCard label="Numéro" value={sinistre.numero} />
            <InfoCard label="Statut" value={sinistre.statut} />
            <InfoCard label="Type de soin" value={sinistre.typeSoin?.replace(/_/g, ' ')} />
            <InfoCard label="Mode de dépôt" value={sinistre.modeDepot?.replace(/_/g, ' ')} />
          </Box>
        </Paper>

        {/* Section Dates */}
        <Paper variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
          <Typography variant="overline" color="primary" fontWeight={700} display="block" mb={2}>
            Dates
          </Typography>
          <Box display="grid" gridTemplateColumns="1fr 1fr" gap={1.5}>
            <InfoCard label="Date du soin" value={formatDate(sinistre.dateSoin)} />
            <InfoCard label="Date de dépôt" value={formatDate(sinistre.createdAt)} />
            <InfoCard label="Date effet contrat" value={formatDate(sinistre.dateEffetContrat)} />
            <InfoCard label="Date limite traitement" value={formatDate(sinistre.dateLimiteTraitement)} />
          </Box>
        </Paper>

        {/* Section Montants */}
        <Paper variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
          <Typography variant="overline" color="primary" fontWeight={700} display="block" mb={2}>
            Montants
          </Typography>
          <Box display="grid" gridTemplateColumns="1fr 1fr" gap={1.5}>
            <InfoCard label="Montant réclamé" value={formatFCFA(Number(sinistre.montantReclame))} color="primary.main" />
            <InfoCard label="Montant remboursé"
              value={Number(sinistre.montantRembourse) > 0 ? formatFCFA(Number(sinistre.montantRembourse)) : '—'}
              color={Number(sinistre.montantRembourse) > 0 ? 'success.main' : undefined} />
            {Number(sinistre.montantFranchise) > 0 && (
              <InfoCard label="Franchise" value={formatFCFA(Number(sinistre.montantFranchise))} />
            )}
            {Number(sinistre.tauxRemboursement) > 0 && (
              <InfoCard label="Taux remboursement" value={`${sinistre.tauxRemboursement}%`} />
            )}
          </Box>
        </Paper>

        {/* Section Références */}
        <Paper variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
          <Typography variant="overline" color="primary" fontWeight={700} display="block" mb={2}>
            Références
          </Typography>
          <Box display="grid" gridTemplateColumns="1fr 1fr" gap={1.5}>
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
              <Typography variant="caption" color="text.secondary" display="block">Contrat</Typography>
              <Box display="flex" alignItems="center" justifyContent="space-between" mt={0.5}>
                <Typography variant="body2" fontWeight={600}>
                  {sinistre.contratId ? sinistre.contratId.slice(0, 8) + '…' : '—'}
                </Typography>
                {sinistre.contratId && (
                  <IconButton size="small" onClick={() => navigate(`/contrats/${sinistre.contratId}`)}>
                    <OpenInNew fontSize="small" color="primary" />
                  </IconButton>
                )}
              </Box>
            </Paper>
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
              <Typography variant="caption" color="text.secondary" display="block">Membre</Typography>
              <Box display="flex" alignItems="center" justifyContent="space-between" mt={0.5}>
                <Typography variant="body2" fontWeight={600}>
                  {sinistre.membreId ? sinistre.membreId.slice(0, 8) + '…' : '—'}
                </Typography>
                {sinistre.membreId && (
                  <IconButton size="small" onClick={() => navigate(`/membres/${sinistre.membreId}`)}>
                    <OpenInNew fontSize="small" color="primary" />
                  </IconButton>
                )}
              </Box>
            </Paper>
            <InfoCard label="Prestataire ID" value={sinistre.prestataireId ? sinistre.prestataireId.slice(0, 8) + '…' : '—'} />
            {sinistre.validePar && (
              <InfoCard label="Validé par" value={sinistre.validePar} />
            )}
          </Box>
        </Paper>

        {/* Motif de rejet */}
        {sinistre.motifRejet && (
          <Paper variant="outlined" sx={{ p: 3, borderRadius: 2, borderColor: 'error.light', gridColumn: { md: '1 / -1' } }}>
            <Typography variant="overline" color="error" fontWeight={700} display="block" mb={1}>
              Motif de rejet
            </Typography>
            <Typography variant="body2" color="error.dark">{sinistre.motifRejet}</Typography>
          </Paper>
        )}

        {/* Commentaires médecin */}
        {sinistre.commentairesMedecin && (
          <Paper variant="outlined" sx={{ p: 3, borderRadius: 2, gridColumn: { md: '1 / -1' } }}>
            <Typography variant="overline" color="primary" fontWeight={700} display="block" mb={1}>
              Commentaires médecin
            </Typography>
            <Typography variant="body2">{sinistre.commentairesMedecin}</Typography>
          </Paper>
        )}

        {/* Score fraude */}
        {sinistre.scoreFraude != null && (
          <Paper variant="outlined" sx={{ p: 3, borderRadius: 2, borderColor: 'error.light', gridColumn: { md: '1 / -1' } }}>
            <Typography variant="overline" color="error" fontWeight={700} display="block" mb={2}>Analyse fraude</Typography>
            <Box display="flex" alignItems="center" gap={2}>
              <Box sx={{ flex: 1 }}>
                <LinearProgress variant="determinate" value={sinistre.scoreFraude} color="error" sx={{ height: 10, borderRadius: 5 }} />
              </Box>
              <Typography fontWeight={700} color="error.main">{sinistre.scoreFraude}/100</Typography>
              {sinistre.niveauSuspicion && <Chip label={sinistre.niveauSuspicion} color="error" size="small" />}
            </Box>
          </Paper>
        )}

        {/* Journal d'audit */}
        {auditVisible && (
          <Paper variant="outlined" sx={{ p: 3, borderRadius: 2, gridColumn: { md: '1 / -1' } }}>
            <Typography variant="overline" color="primary" fontWeight={700} display="block" mb={2}>Journal d'audit</Typography>
            {auditLoading ? <CircularProgress size={24} /> : (
              <TableContainer>
                <Table size="small">
                  <TableHead sx={{ bgcolor: 'grey.50' }}>
                    <TableRow>
                      {['Date', 'Action', 'Statut', 'IP'].map(h => <TableCell key={h} sx={{ fontWeight: 700 }}>{h}</TableCell>)}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {auditList.length === 0 ? (
                      <TableRow><TableCell colSpan={4} align="center" sx={{ py: 3, color: 'text.secondary' }}>Aucune entrée d'audit</TableCell></TableRow>
                    ) : auditList.map((a: any) => (
                      <TableRow key={a.id}>
                        <TableCell><Typography variant="caption">{new Date(a.createdAt).toLocaleString('fr-CI')}</Typography></TableCell>
                        <TableCell><Typography variant="body2" fontWeight={600}>{a.action}</Typography></TableCell>
                        <TableCell><Chip label={a.statut} size="small" color={a.statut === 'SUCCESS' ? 'success' : 'error'} /></TableCell>
                        <TableCell><Typography variant="caption" color="text.secondary">{a.ipAddress ?? '—'}</Typography></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>
        )}
      </Box>

      {/* ===== Dialog fraude ===== */}
      <Dialog open={fraudeDialog} onClose={() => setFraudeDialog(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <Box sx={{ px: 3, py: 2.5, bgcolor: 'error.main', color: 'white' }}
          display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6" fontWeight={700}>Signaler fraude suspectée</Typography>
          <IconButton onClick={() => setFraudeDialog(false)} sx={{ color: 'white' }}><Close /></IconButton>
        </Box>
        <DialogContent>
          <Stack spacing={2.5} mt={1}>
            <TextField label="Score de fraude (0–100)" type="number" size="small" fullWidth
              value={fraudeForm.scoreFraude}
              onChange={e => setFraudeForm(f => ({ ...f, scoreFraude: Math.min(100, Math.max(0, Number(e.target.value))) }))}
              inputProps={{ min: 0, max: 100 }} />
            <TextField select label="Niveau de suspicion" size="small" fullWidth
              value={fraudeForm.niveauSuspicion}
              onChange={e => setFraudeForm(f => ({ ...f, niveauSuspicion: e.target.value }))}>
              {['FAIBLE', 'MODERE', 'ELEVE', 'CRITIQUE'].map(n => <MenuItem key={n} value={n}>{n}</MenuItem>)}
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setFraudeDialog(false)}>Annuler</Button>
          <Button variant="contained" color="error" disabled={fraudeMut.isPending} onClick={() => fraudeMut.mutate()}>
            {fraudeMut.isPending ? <CircularProgress size={20} sx={{ color: 'white' }} /> : 'Signaler'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ===== Dialog rejet ===== */}
      <Dialog open={rejetDialog} onClose={() => setRejetDialog(false)}
        maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <Box sx={{ px: 3, py: 2.5, bgcolor: 'error.main', color: 'white' }}
          display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6" fontWeight={700}>Rejeter le sinistre</Typography>
          <IconButton onClick={() => setRejetDialog(false)} sx={{ color: 'white' }}><Close /></IconButton>
        </Box>
        <DialogContent sx={{ pt: 3 }}>
          <TextField label="Motif de rejet *" fullWidth multiline rows={4} value={motifRejet}
            onChange={e => setMotifRejet(e.target.value)}
            placeholder="Expliquez la raison du rejet..." />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setRejetDialog(false)}>Annuler</Button>
          <Button variant="contained" color="error"
            disabled={!motifRejet || rejeterMut.isPending}
            onClick={() => rejeterMut.mutate(motifRejet)}>
            {rejeterMut.isPending ? <CircularProgress size={20} sx={{ color: 'white' }} /> : 'Rejeter'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ===== Dialog liquidation ===== */}
      <Dialog open={liquidDialog} onClose={() => setLiquidDialog(false)}
        maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <Box sx={{ px: 3, py: 2.5, bgcolor: 'primary.main', color: 'white' }}
          display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6" fontWeight={700}>Liquider le sinistre</Typography>
          <IconButton onClick={() => setLiquidDialog(false)} sx={{ color: 'white' }}><Close /></IconButton>
        </Box>
        <DialogContent sx={{ pt: 3 }}>
          <Stack spacing={2.5}>
            <TextField label="Franchise (FCFA)" type="number" fullWidth size="small"
              value={liquidForm.franchise}
              onChange={e => setLiquidForm(f => ({ ...f, franchise: Number(e.target.value) }))} />
            <TextField label="Taux de remboursement (%)" type="number" fullWidth size="small"
              value={liquidForm.tauxRemboursement}
              onChange={e => setLiquidForm(f => ({ ...f, tauxRemboursement: Number(e.target.value) }))} />
            <TextField label="Plafond annuel restant (FCFA)" type="number" fullWidth size="small"
              value={liquidForm.plafondAnnuelRestant}
              onChange={e => setLiquidForm(f => ({ ...f, plafondAnnuelRestant: Number(e.target.value) }))} />
            <TextField label="Commentaires médecin" multiline rows={3} fullWidth size="small"
              value={liquidForm.commentairesMedecin}
              onChange={e => setLiquidForm(f => ({ ...f, commentairesMedecin: e.target.value }))} />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setLiquidDialog(false)}>Annuler</Button>
          <Button variant="contained" disabled={liquiderMut.isPending}
            onClick={() => liquiderMut.mutate(liquidForm)}>
            {liquiderMut.isPending ? <CircularProgress size={20} sx={{ color: 'white' }} /> : 'Liquider'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
