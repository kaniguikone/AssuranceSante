import React, { useState } from 'react';
import {
  Box, Card, CardContent, TextField, Button, Typography,
  Alert, CircularProgress, InputAdornment, IconButton, Divider, Chip,
} from '@mui/material';
import { Visibility, VisibilityOff, HealthAndSafety } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/auth.store';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();

  // Connexion dev — bypass auth-service (Phase 2)
  const loginDev = () => {
    setAuth(
      { id: 'dev-001', email: 'admin@sante-ci.ci', nom: 'Admin', prenoms: 'Dev', roles: ['ADMIN'] },
      'dev-token',
      'dev-refresh',
    );
    navigate('/dashboard', { replace: true });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      // En Phase 1 : toujours dev bypass
      loginDev();
    } catch {
      setError('Identifiants incorrects.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #1B6B2F 0%, #0D4A1F 50%, #F57C00 100%)',
        p: 2,
      }}
    >
      <Card sx={{ width: '100%', maxWidth: 420, borderRadius: 3 }}>
        <CardContent sx={{ p: 4 }}>
          <Box textAlign="center" mb={4}>
            <Box sx={{ display: 'inline-flex', p: 2, borderRadius: 3, bgcolor: 'primary.main', color: 'white', mb: 2 }}>
              <HealthAndSafety sx={{ fontSize: 40 }} />
            </Box>
            <Typography variant="h4" fontWeight={700} color="primary">SANTÉ-CI</Typography>
            <Typography variant="body2" color="text.secondary">
              Système de Gestion d'Assurance Maladie
            </Typography>
            <Chip label="MODE DEV" color="warning" size="small" sx={{ mt: 1 }} />
          </Box>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <form onSubmit={handleSubmit}>
            <TextField
              label="Adresse email"
              type="email"
              fullWidth
              margin="normal"
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoFocus
            />
            <TextField
              label="Mot de passe"
              type={showPassword ? 'text' : 'password'}
              fullWidth
              margin="normal"
              value={password}
              onChange={e => setPassword(e.target.value)}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <Button
              type="submit"
              variant="contained"
              fullWidth
              size="large"
              sx={{ mt: 3, mb: 2, py: 1.5 }}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Se connecter'}
            </Button>
          </form>

          <Divider sx={{ my: 2 }}>
            <Typography variant="caption" color="text.secondary">ou</Typography>
          </Divider>

          <Button
            variant="outlined"
            fullWidth
            color="warning"
            onClick={loginDev}
            sx={{ py: 1.5 }}
          >
            Accès rapide dev (sans mot de passe)
          </Button>

          <Typography variant="caption" color="text.secondary" display="block" textAlign="center" mt={2}>
            © 2026 SANTÉ-CI — Confidentiel
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}
