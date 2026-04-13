import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SnackbarProvider } from 'notistack';
import { theme } from './theme';
import { useAuthStore } from './stores/auth.store';
import { AppLayout } from './components/layout/AppLayout';
import { LoginPage } from './pages/auth/LoginPage';
import { DashboardPage } from './pages/dashboard/DashboardPage';
import { MembresPage } from './pages/members/MembresPage';
import { MembreDetailPage } from './pages/members/MembreDetailPage';
import { ContratsPage } from './pages/contracts/ContratsPage';
import { ContratDetailPage } from './pages/contracts/ContratDetailPage';
import { SinistresPage } from './pages/claims/SinistresPage';
import { SinistreDetailPage } from './pages/claims/SinistreDetailPage';
import { ProduitsPage } from './pages/produits/ProduitsPage';
import { PrestatairesPage } from './pages/prestataires/PrestatairesPage';
import { UtilisateursPage } from './pages/utilisateurs/UtilisateursPage';

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 5 * 60 * 1000, retry: 1 } },
});

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <SnackbarProvider maxSnack={3} anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route
                path="/"
                element={
                  <PrivateRoute>
                    <AppLayout />
                  </PrivateRoute>
                }
              >
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard" element={<DashboardPage />} />
                <Route path="membres" element={<MembresPage />} />
                <Route path="membres/:id" element={<MembreDetailPage />} />
                <Route path="contrats" element={<ContratsPage />} />
                <Route path="contrats/:id" element={<ContratDetailPage />} />
                <Route path="sinistres" element={<SinistresPage />} />
                <Route path="sinistres/:id" element={<SinistreDetailPage />} />
                <Route path="produits" element={<ProduitsPage />} />
                <Route path="prestataires" element={<PrestatairesPage />} />
                <Route path="utilisateurs" element={<UtilisateursPage />} />
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </SnackbarProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
