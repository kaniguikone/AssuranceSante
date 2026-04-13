import axios from 'axios';
import { useAuthStore } from '../stores/auth.store';

// En dev, chaque service a son propre port
const DEV = import.meta.env.DEV;

const URLS = {
  member:   DEV ? 'http://localhost:3003/api/v1' : '/api/v1',
  contract: DEV ? 'http://localhost:3002/api/v1' : '/api/v1',
  billing:  DEV ? 'http://localhost:3006/api/v1' : '/api/v1',
  claim:    DEV ? 'http://localhost:3005/api/v1' : '/api/v1',
  notif:    DEV ? 'http://localhost:3007/api/v1' : '/api/v1',
};

function makeClient(baseURL: string) {
  const client = axios.create({ baseURL, headers: { 'Content-Type': 'application/json' }, timeout: 30000 });
  client.interceptors.request.use((config) => {
    const token = useAuthStore.getState().accessToken;
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  });
  return client;
}

const URLS2 = {
  auth: DEV ? 'http://localhost:3009/api/v1' : '/api/v1',
};

const memberClient   = makeClient(URLS.member);
const contractClient = makeClient(URLS.contract);
const billingClient  = makeClient(URLS.billing);
const claimClient    = makeClient(URLS.claim);
const notifClient    = makeClient(URLS.notif);
const authClient     = makeClient(URLS2.auth);

// ── Membres ───────────────────────────────────────────────────────────────────
export const membresApi = {
  list:   (params?: Record<string, unknown>) => memberClient.get('/membres', { params }),
  get:    (id: string) => memberClient.get(`/membres/${id}`),
  create: (data: unknown) => memberClient.post('/membres', data),
  suspend:    (id: string) => memberClient.patch(`/membres/${id}/suspendre`),
  reactivate: (id: string) => memberClient.patch(`/membres/${id}/reactiver`),
  radiate:    (id: string) => memberClient.patch(`/membres/${id}/radier`),
};

// ── Produits ──────────────────────────────────────────────────────────────────
export const produitsApi = {
  list: () => contractClient.get('/produits'),
  get:  (id: string) => contractClient.get(`/produits/${id}`),
};

// ── Prestataires ──────────────────────────────────────────────────────────────
export const prestatairesApi = {
  list:   () => claimClient.get('/prestataires'),
  get:    (id: string) => claimClient.get(`/prestataires/${id}`),
  create: (data: unknown) => claimClient.post('/prestataires', data),
  update: (id: string, data: unknown) => claimClient.patch(`/prestataires/${id}`, data),
  remove: (id: string) => claimClient.delete(`/prestataires/${id}`),
};

// ── Utilisateurs ──────────────────────────────────────────────────────────────
export const utilisateursApi = {
  list:   () => authClient.get('/utilisateurs'),
  get:    (id: string) => authClient.get(`/utilisateurs/${id}`),
  create: (data: unknown) => authClient.post('/utilisateurs', data),
  update: (id: string, data: unknown) => authClient.patch(`/utilisateurs/${id}`, data),
  remove: (id: string) => authClient.delete(`/utilisateurs/${id}`),
};

// ── Contrats ──────────────────────────────────────────────────────────────────
export const contratsApi = {
  list:       (params?: Record<string, unknown>) => contractClient.get('/contracts', { params }),
  get:        (id: string) => contractClient.get(`/contracts/${id}`),
  create:     (data: unknown) => contractClient.post('/contracts', data),
  activate:   (id: string) => contractClient.patch(`/contracts/${id}/activer`),
  suspend:    (id: string) => contractClient.patch(`/contracts/${id}/suspendre`),
  reactivate: (id: string) => contractClient.patch(`/contracts/${id}/reactiver`),
  terminate:  (id: string, motif: string) => contractClient.patch(`/contracts/${id}/resilier`, { motif }),
};

// ── Écheances ─────────────────────────────────────────────────────────────────
export const echeancesApi = {
  byContrat: (contratId: string) => billingClient.get(`/echeances/contrat/${contratId}`),
  generer:   (data: unknown) => billingClient.post('/echeances/generer', data),
  paiement:  (id: string, data: unknown) => billingClient.post(`/echeances/${id}/paiement`, data),
};

// ── Écheances résumé ─────────────────────────────────────────────────────────
export const echeancesResumeApi = {
  byContrat: (contratId: string) => billingClient.get(`/echeances/contrat/${contratId}/resume`),
};

// ── Sinistres ─────────────────────────────────────────────────────────────────
export const sinistresApi = {
  list:      () => claimClient.get('/sinistres'),
  byMembre:  (membreId: string) => claimClient.get(`/sinistres/membre/${membreId}`),
  alertes:   () => claimClient.get('/sinistres/fraude/alertes'),
  get:       (id: string) => claimClient.get(`/sinistres/${id}`),
  create:    (data: unknown) => claimClient.post('/sinistres', data),
  approuver: (id: string) => claimClient.patch(`/sinistres/${id}/approuver`),
  rejeter:   (id: string, motif: string) => claimClient.patch(`/sinistres/${id}/rejeter`, { motif }),
  liquider:  (id: string, data: unknown) => claimClient.patch(`/sinistres/${id}/liquider`, data),
};

// ── Notifications ─────────────────────────────────────────────────────────────
export const notifsApi = {
  envoyer:         (data: unknown) => notifClient.post('/notifications', data),
  byDestinataire:  (id: string) => notifClient.get(`/notifications/destinataire/${id}`),
};
