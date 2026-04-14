import React, { useState } from 'react';
import {
  Box, Typography, Card, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Chip, IconButton, CircularProgress, Alert,
  Tooltip, TextField, MenuItem, InputAdornment, Stack, Button,
} from '@mui/material';
import { Visibility, Search, FilterAlt, Clear, Download } from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { membresApi } from '../../services/api';
import { exportCsv } from '../../utils/exportCsv';

const STATUT_COLORS: Record<string, 'success' | 'warning' | 'error' | 'default'> = {
  ACTIF: 'success', SUSPENDU: 'warning', RADIE: 'error', EN_ATTENTE: 'default',
};

function formatDate(d: string) {
  return d ? new Date(d).toLocaleDateString('fr-CI') : '—';
}

const FILTER_INIT = { nom: '', statut: '', lienParente: '' };

export function MembresPage() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState(FILTER_INIT);
  const [applied, setApplied] = useState(FILTER_INIT);

  const { data, isLoading, error } = useQuery({
    queryKey: ['membres', applied],
    queryFn: () => {
      const params: Record<string, unknown> = { limit: 100 };
      if (applied.nom) params.nom = applied.nom;
      if (applied.statut) params.statut = applied.statut;
      return membresApi.list(params).then(r => r.data);
    },
  });

  const raw: any[] = Array.isArray(data) ? data : (data?.data ?? []);
  const membres = applied.lienParente
    ? raw.filter(m => m.lienParente === applied.lienParente)
    : raw;
  const hasFilter = applied.nom || applied.statut || applied.lienParente;

  const applyFilters = () => setApplied({ ...filters });
  const clearFilters = () => { setFilters(FILTER_INIT); setApplied(FILTER_INIT); };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" fontWeight={700}>Membres</Typography>
          {!isLoading && (
            <Typography variant="body2" color="text.secondary" mt={0.5}>
              {membres.length} membre{membres.length > 1 ? 's' : ''}{hasFilter ? ' (filtré)' : ''}
            </Typography>
          )}
        </Box>
        <Button size="small" startIcon={<Download />} variant="outlined"
          disabled={membres.length === 0}
          onClick={() => exportCsv('membres', membres, [
            { key: 'numeroCarte', label: 'N° Carte' },
            { key: 'nom', label: 'Nom' },
            { key: 'prenoms', label: 'Prénoms' },
            { key: 'telephone', label: 'Téléphone' },
            { key: 'email', label: 'Email' },
            { key: 'statut', label: 'Statut' },
            { key: 'lienParente', label: 'Lien parenté' },
            { key: 'dateAffiliation', label: 'Date affiliation' },
          ])}>
          Exporter CSV
        </Button>
      </Box>

      {/* Filtres */}
      <Card sx={{ p: 2, mb: 2 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="flex-end">
          <TextField
            size="small" label="Rechercher par nom" value={filters.nom}
            onChange={e => setFilters(f => ({ ...f, nom: e.target.value }))}
            onKeyDown={e => e.key === 'Enter' && applyFilters()}
            InputProps={{ startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment> }}
            sx={{ minWidth: 220 }}
          />
          <TextField select size="small" label="Statut" value={filters.statut}
            onChange={e => setFilters(f => ({ ...f, statut: e.target.value }))}
            sx={{ minWidth: 140 }}>
            <MenuItem value="">Tous</MenuItem>
            {['ACTIF', 'SUSPENDU', 'RADIE'].map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
          </TextField>
          <TextField select size="small" label="Lien parenté" value={filters.lienParente}
            onChange={e => setFilters(f => ({ ...f, lienParente: e.target.value }))}
            sx={{ minWidth: 150 }}>
            <MenuItem value="">Tous</MenuItem>
            {['PRINCIPAL', 'CONJOINT', 'ENFANT', 'AUTRE'].map(l => <MenuItem key={l} value={l}>{l}</MenuItem>)}
          </TextField>
          <Stack direction="row" spacing={1}>
            <Button variant="contained" size="small" startIcon={<FilterAlt />} onClick={applyFilters}>
              Filtrer
            </Button>
            {hasFilter && (
              <Button size="small" startIcon={<Clear />} onClick={clearFilters} color="inherit">
                Effacer
              </Button>
            )}
          </Stack>
        </Stack>
      </Card>

      {error && <Alert severity="error" sx={{ mb: 2 }}>Erreur de chargement des membres</Alert>}

      <Card>
        <TableContainer>
          <Table>
            <TableHead sx={{ bgcolor: 'grey.50' }}>
              <TableRow>
                {['Membre', 'Téléphone', 'Email', 'Document', 'Contrat', 'Statut', 'Créé le', ''].map(h => (
                  <TableCell key={h} sx={{ fontWeight: 700 }}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={8} align="center" sx={{ py: 4 }}><CircularProgress /></TableCell></TableRow>
              ) : membres.length === 0 ? (
                <TableRow><TableCell colSpan={8} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                  {hasFilter ? 'Aucun membre ne correspond aux filtres' : 'Aucun membre — créez d\'abord un contrat'}
                </TableCell></TableRow>
              ) : membres.map((m: any) => (
                <TableRow key={m.id} hover sx={{ cursor: 'pointer' }} onClick={() => navigate(`/membres/${m.id}`)}>
                  <TableCell>
                    <Typography fontWeight={600}>{m.prenoms} {m.nom}</Typography>
                    <Typography variant="caption" color="text.secondary">{m.numeroCarte}</Typography>
                  </TableCell>
                  <TableCell>{m.telephone}</TableCell>
                  <TableCell>{m.email ?? '—'}</TableCell>
                  <TableCell>
                    <Typography variant="caption">{m.typeDocument} — {m.numeroDocument}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption" color={m.contratId ? 'primary.main' : 'text.secondary'}>
                      {m.contratId ? m.contratId.slice(0, 8) + '…' : '—'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip label={m.statut} color={STATUT_COLORS[m.statut] ?? 'default'} size="small" />
                  </TableCell>
                  <TableCell>{formatDate(m.createdAt)}</TableCell>
                  <TableCell align="right" onClick={e => e.stopPropagation()}>
                    <Tooltip title="Voir fiche">
                      <IconButton size="small" onClick={() => navigate(`/membres/${m.id}`)}>
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
    </Box>
  );
}
