import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  email: string;
  nom: string;
  prenoms: string;
  roles: string[];
}

export interface MenuPermission {
  menuPath: string;
  menuLabel: string;
  allowedRoles: string[];
  sortOrder: number;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  menuPermissions: MenuPermission[];
  setAuth: (user: User, accessToken: string, refreshToken: string) => void;
  setAccessToken: (token: string) => void;
  setMenuPermissions: (perms: MenuPermission[]) => void;
  logout: () => void;
  hasRole: (role: string) => boolean;
  hasAnyRole: (roles: string[]) => boolean;
  canAccessMenu: (path: string) => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      menuPermissions: [],

      setAuth: (user, accessToken, refreshToken) =>
        set({ user, accessToken, refreshToken, isAuthenticated: true }),

      setAccessToken: (token) => set({ accessToken: token }),

      setMenuPermissions: (perms) => set({ menuPermissions: perms }),

      logout: () =>
        set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false }),

      hasRole: (role) => get().user?.roles.includes(role) ?? false,

      hasAnyRole: (roles) =>
        roles.some((r) => get().user?.roles.includes(r)) ?? false,

      canAccessMenu: (path) => {
        const { menuPermissions, user } = get();
        const perm = menuPermissions.find(p => p.menuPath === path);
        if (!perm) return true; // non configuré = accessible
        if (perm.allowedRoles.length === 0) return true; // vide = tous
        return (user?.roles ?? []).some(r => perm.allowedRoles.includes(r));
      },
    }),
    {
      name: 'sante-ci-auth',
      partialize: (state) => ({
        user: state.user,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
        menuPermissions: state.menuPermissions,
      }),
    },
  ),
);
