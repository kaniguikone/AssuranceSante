import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Card, CardContent, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Checkbox, Button, CircularProgress,
  Alert, Chip, Paper, Tooltip, Stack,
} from '@mui/material';
import { Save, RestartAlt, AdminPanelSettings, CheckCircle } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { permissionsApi } from '../../services/api';
import { useAuthStore } from '../../stores/auth.store';

const ROLES = ['ADMIN', 'GESTIONNAIRE', 'MEDECIN_CONSEIL', 'AUDITEUR', 'AGENT_SAISIE'];

const ROLE_COLORS: Record<string, string> = {
  ADMIN: '#C62828',
  GESTIONNAIRE: '#1565C0',
  MEDECIN_CONSEIL: '#2E7D32',
  AUDITEUR: '#E65100',
  AGENT_SAISIE: '#6A1B9A',
};

export function PermissionsPage() {
  const qc = useQueryClient();
  const { setMenuPermissions } = useAuthStore();

  // matrice locale : { [menuPath]: Set<role> }
  const [matrix, setMatrix] = useState<Record<string, Set<string>>>({});
  const [dirty, setDirty] = useState(false);
  const [saveOk, setSaveOk] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ['menu-permissions'],
    queryFn: () => permissionsApi.getAll().then(r => r.data),
  });

  const perms: any[] = Array.isArray(data) ? data : [];

  // Initialiser la matrice quand les données arrivent
  useEffect(() => {
    if (perms.length === 0) return;
    const m: Record<string, Set<string>> = {};
    perms.forEach((p: any) => {
      m[p.menuPath] = new Set(p.allowedRoles ?? []);
    });
    setMatrix(m);
    setDirty(false);
  }, [data]);

  const toggle = (menuPath: string, role: string) => {
    setMatrix(prev => {
      const next = { ...prev };
      const set = new Set(next[menuPath] ?? []);
      if (set.has(role)) set.delete(role); else set.add(role);
      next[menuPath] = set;
      return next;
    });
    setDirty(true);
    setSaveOk(false);
  };

  const setAllForMenu = (menuPath: string, all: boolean) => {
    setMatrix(prev => ({
      ...prev,
      [menuPath]: all ? new Set(ROLES) : new Set(),
    }));
    setDirty(true);
    setSaveOk(false);
  };

  const saveMut = useMutation({
    mutationFn: () => {
      const updates = perms.map((p: any) => ({
        menuPath: p.menuPath,
        allowedRoles: [...(matrix[p.menuPath] ?? [])],
      }));
      return permissionsApi.updateAll(updates).then(r => r.data);
    },
    onSuccess: (saved: any[]) => {
      qc.invalidateQueries({ queryKey: ['menu-permissions'] });
      setMenuPermissions(saved);
      setDirty(false);
      setSaveOk(true);
      setTimeout(() => setSaveOk(false), 3000);
    },
  });

  const isAllChecked = (menuPath: string) =>
    ROLES.every(r => matrix[menuPath]?.has(r));
  const isNoneChecked = (menuPath: string) =>
    ROLES.every(r => !matrix[menuPath]?.has(r));

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={3}>
        <Box>
          <Box display="flex" alignItems="center" gap={1} mb={0.5}>
            <AdminPanelSettings color="primary" />
            <Typography variant="h4" fontWeight={700}>Gestion des accès</Typography>
          </Box>
          <Typography variant="body2" color="text.secondary">
            Définissez quels rôles peuvent accéder à chaque section du menu.
            Une case décochée masque l'entrée de menu pour ce profil.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1} alignItems="center">
          {saveOk && (
            <Chip icon={<CheckCircle />} label="Enregistré" color="success" size="small" />
          )}
          {dirty && (
            <Button size="small" startIcon={<RestartAlt />} color="inherit"
              onClick={() => {
                const m: Record<string, Set<string>> = {};
                perms.forEach((p: any) => { m[p.menuPath] = new Set(p.allowedRoles ?? []); });
                setMatrix(m); setDirty(false);
              }}>
              Annuler
            </Button>
          )}
          <Button variant="contained" startIcon={<Save />}
            disabled={!dirty || saveMut.isPending}
            onClick={() => saveMut.mutate()}>
            {saveMut.isPending ? <CircularProgress size={20} sx={{ color: 'white' }} /> : 'Enregistrer'}
          </Button>
        </Stack>
      </Box>

      {/* Légende des rôles */}
      <Box display="flex" gap={1} flexWrap="wrap" mb={3}>
        {ROLES.map(r => (
          <Chip key={r} label={r} size="small"
            sx={{ bgcolor: `${ROLE_COLORS[r]}15`, color: ROLE_COLORS[r], fontWeight: 700, border: `1px solid ${ROLE_COLORS[r]}40` }} />
        ))}
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>Impossible de charger les permissions</Alert>}

      {isLoading ? (
        <Box display="flex" justifyContent="center" pt={6}><CircularProgress /></Box>
      ) : (
        <Card>
          <CardContent sx={{ p: 0 }}>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: 'primary.main' }}>
                    <TableCell sx={{ color: 'white', fontWeight: 700, minWidth: 200 }}>
                      Section du menu
                    </TableCell>
                    {ROLES.map(role => (
                      <TableCell key={role} align="center"
                        sx={{ color: 'white', fontWeight: 700, minWidth: 130 }}>
                        <Box display="flex" flexDirection="column" alignItems="center">
                          <Typography variant="caption" fontWeight={700}>{role}</Typography>
                        </Box>
                      </TableCell>
                    ))}
                    <TableCell align="center" sx={{ color: 'white', fontWeight: 700, minWidth: 100 }}>
                      Tous
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {perms.map((perm: any, idx: number) => {
                    const allChecked = isAllChecked(perm.menuPath);
                    const noneChecked = isNoneChecked(perm.menuPath);
                    return (
                      <TableRow key={perm.menuPath}
                        sx={{ bgcolor: idx % 2 === 0 ? 'grey.50' : 'white', '&:hover': { bgcolor: 'primary.50' } }}>
                        <TableCell>
                          <Box>
                            <Typography variant="body2" fontWeight={600}>{perm.menuLabel}</Typography>
                            <Typography variant="caption" color="text.secondary" fontFamily="monospace">
                              {perm.menuPath}
                            </Typography>
                            {noneChecked && (
                              <Chip label="Accès universel" size="small" color="info"
                                sx={{ ml: 1, fontSize: 10 }} />
                            )}
                          </Box>
                        </TableCell>
                        {ROLES.map(role => (
                          <TableCell key={role} align="center" padding="checkbox">
                            <Tooltip title={`${matrix[perm.menuPath]?.has(role) ? 'Retirer' : 'Accorder'} l'accès à ${role}`}>
                              <Checkbox
                                checked={matrix[perm.menuPath]?.has(role) ?? false}
                                onChange={() => toggle(perm.menuPath, role)}
                                sx={{
                                  color: `${ROLE_COLORS[role]}60`,
                                  '&.Mui-checked': { color: ROLE_COLORS[role] },
                                }}
                              />
                            </Tooltip>
                          </TableCell>
                        ))}
                        <TableCell align="center" padding="checkbox">
                          <Tooltip title={allChecked ? 'Décocher tous' : 'Cocher tous'}>
                            <Checkbox
                              checked={allChecked}
                              indeterminate={!allChecked && !noneChecked}
                              onChange={() => setAllForMenu(perm.menuPath, !allChecked)}
                              color="primary"
                            />
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      <Paper variant="outlined" sx={{ p: 2, mt: 3, borderRadius: 2, bgcolor: 'info.50', borderColor: 'info.200' }}>
        <Typography variant="caption" color="info.dark">
          <strong>Règle :</strong> Si aucune case n'est cochée pour une section, celle-ci est accessible à tous les profils connectés.
          Pour restreindre un menu, cochez uniquement les rôles autorisés.
          Les changements prennent effet immédiatement après enregistrement.
        </Typography>
      </Paper>
    </Box>
  );
}
