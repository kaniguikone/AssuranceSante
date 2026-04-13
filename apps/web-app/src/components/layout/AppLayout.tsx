import React, { useState } from 'react';
import {
  Box, Drawer, AppBar, Toolbar, List, ListItem, ListItemButton,
  ListItemIcon, ListItemText, Typography, IconButton, Avatar,
  Chip, Divider, useTheme,
} from '@mui/material';
import {
  Dashboard, Description, People, LocalHospital,
  MedicalServices, SupervisedUserCircle, Inventory2,
  Notifications, Menu as MenuIcon, AccountCircle, ExitToApp,
} from '@mui/icons-material';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../stores/auth.store';

const DRAWER_WIDTH = 260;

const NAV_ITEMS = [
  { label: 'Tableau de bord', icon: <Dashboard />, path: '/dashboard', roles: [] },
  { label: 'Membres', icon: <People />, path: '/membres', roles: [] },
  { label: 'Contrats', icon: <Description />, path: '/contrats', roles: [] },
  { label: 'Sinistres', icon: <LocalHospital />, path: '/sinistres', roles: [] },
  { label: 'Prestataires', icon: <MedicalServices />, path: '/prestataires', roles: [] },
  { label: 'Produits', icon: <Inventory2 />, path: '/produits', roles: [] },
  { label: 'Utilisateurs', icon: <SupervisedUserCircle />, path: '/utilisateurs', roles: [] },
];

export function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const { user, logout, hasAnyRole } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Logo */}
      <Box sx={{ p: 3, bgcolor: 'primary.main', color: 'white' }}>
        <Typography variant="h5" fontWeight={700}>SANTÉ-CI</Typography>
        <Typography variant="caption" sx={{ opacity: 0.85 }}>
          Système d'Assurance Maladie
        </Typography>
      </Box>

      {/* Navigation */}
      <List sx={{ flex: 1, pt: 1 }}>
        {NAV_ITEMS.filter(item => item.roles.length === 0 || hasAnyRole(item.roles)).map((item) => (
          <ListItem key={item.path} disablePadding>
            <ListItemButton
              selected={location.pathname.startsWith(item.path)}
              onClick={() => navigate(item.path)}
              sx={{
                mx: 1, borderRadius: 2, mb: 0.5,
                '&.Mui-selected': {
                  bgcolor: 'primary.main',
                  color: 'white',
                  '& .MuiListItemIcon-root': { color: 'white' },
                  '&:hover': { bgcolor: 'primary.dark' },
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      <Divider />

      {/* Profil utilisateur */}
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Avatar sx={{ bgcolor: 'primary.main', width: 36, height: 36 }}>
          {user?.prenoms?.[0]}{user?.nom?.[0]}
        </Avatar>
        <Box flex={1} minWidth={0}>
          <Typography variant="body2" fontWeight={600} noWrap>
            {user?.prenoms} {user?.nom}
          </Typography>
          <Typography variant="caption" color="text.secondary" noWrap>
            {user?.roles?.[0]}
          </Typography>
        </Box>
        <IconButton size="small" onClick={handleLogout} title="Déconnexion">
          <ExitToApp fontSize="small" />
        </IconButton>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar desktop */}
      <Drawer
        variant="permanent"
        sx={{
          width: DRAWER_WIDTH,
          display: { xs: 'none', md: 'block' },
          '& .MuiDrawer-paper': { width: DRAWER_WIDTH, border: 'none', boxShadow: 2 },
        }}
      >
        {drawer}
      </Drawer>

      {/* Sidebar mobile */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': { width: DRAWER_WIDTH },
        }}
      >
        {drawer}
      </Drawer>

      {/* Contenu principal */}
      <Box component="main" sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <AppBar position="static" color="inherit" elevation={0} sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Toolbar>
            <IconButton
              sx={{ display: { md: 'none' }, mr: 1 }}
              onClick={() => setMobileOpen(true)}
            >
              <MenuIcon />
            </IconButton>
            <Box flex={1} />
            <IconButton>
              <Notifications />
            </IconButton>
            <IconButton>
              <AccountCircle />
            </IconButton>
          </Toolbar>
        </AppBar>

        <Box sx={{ flex: 1, overflow: 'auto', p: 3, bgcolor: 'background.default' }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}
