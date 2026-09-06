import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { clearFarmOffline } from '../services/farmOffline';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'farmer' | 'owner' | 'admin';
  referral_code?: string;
  paid_referrals_count?: number;
  profile_picture_url?: string | null;
  nin_verified?: boolean;
  is_platform_subscriber?: boolean;
}

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  login: (user: User, token: string, refreshToken: string) => void;
  logout: (options?: { preserveFarmQueue?: boolean }) => void;
  updateUser: (data: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      login: (user, token, refreshToken) => {
        if (get().user && get().user?.id !== user.id) {
          void clearFarmOffline().catch(()=>localStorage.setItem('farm-offline-clear-required','true'));
        }
        localStorage.setItem('token', token);
        localStorage.setItem('refreshToken', refreshToken);
        localStorage.setItem('user', JSON.stringify(user));
        set({ user, token, refreshToken, isAuthenticated: true });
      },
      logout: (options) => {
        if (!options?.preserveFarmQueue) void clearFarmOffline().catch(()=>{
          // Fail closed: do not reuse a cache whose secure deletion failed.
          localStorage.setItem('farm-offline-clear-required','true');
        });
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        localStorage.removeItem('organization-storage');
        set({ user: null, token: null, refreshToken: null, isAuthenticated: false });
      },
      updateUser: (data) => {
        set((state) => {
          if (!state.user) return state;
          const updatedUser = { ...state.user, ...data };
          localStorage.setItem('user', JSON.stringify(updatedUser));
          return { user: updatedUser };
        });
      },
    }),
    {
      name: 'auth-storage',
    }
  )
);
// Keep field caches and authorization partitioned when another tab signs out
// or changes principal. Rehydration reads the existing shared auth store only.
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key === 'auth-storage') void useAuthStore.persist.rehydrate();
  });
}
