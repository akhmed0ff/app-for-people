import { create } from 'zustand';
import { authApi } from '../api/auth';
import { tokenStorage } from '../services/storage';
import { Driver, User } from '../types/api';

interface AuthState {
  accessToken: string | null;
  user: User | null;
  driver: Driver | null;
  isRestoring: boolean;
  isLoading: boolean;
  error: string | null;
  restore: () => Promise<void>;
  devLogin: (phone: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  user: null,
  driver: null,
  isRestoring: true,
  isLoading: false,
  error: null,

  restore: async () => {
    const token = await tokenStorage.get();

    if (!token) {
      set({ isRestoring: false });
      return;
    }

    set({ accessToken: token });

    try {
      const profile = await authApi.me();
      set({
        accessToken: token,
        user: profile.user,
        driver: profile.driver,
        isRestoring: false,
        error: null,
      });
    } catch {
      await tokenStorage.clear();
      set({ accessToken: null, user: null, driver: null, isRestoring: false });
    }
  },

  devLogin: async (phone) => {
    set({ isLoading: true, error: null });

    try {
      const response = await authApi.devLogin(phone);
      await tokenStorage.set(response.accessToken);
      set({
        accessToken: response.accessToken,
        user: response.user,
        driver: response.driver,
        error: null,
      });
    } catch {
      set({ error: 'Не удалось войти. Проверьте backend и API URL.' });
    } finally {
      set({ isLoading: false, isRestoring: false });
    }
  },

  logout: async () => {
    await tokenStorage.clear();
    set({ accessToken: null, user: null, driver: null, error: null });
  },
}));
