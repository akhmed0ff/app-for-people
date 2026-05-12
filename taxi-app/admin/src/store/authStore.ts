'use client';

import { create } from 'zustand';
import { authApi } from '../api/auth';
import { User } from '../types/api';

const TOKEN_KEY = 'admin.accessToken';

interface AuthState {
  accessToken: string | null;
  user: User | null;
  isLoading: boolean;
  isRestoring: boolean;
  error: string | null;
  restore: () => Promise<void>;
  devLogin: (phone: string) => Promise<boolean>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  user: null,
  isLoading: false,
  isRestoring: true,
  error: null,

  restore: async () => {
    const token = typeof window === 'undefined' ? null : window.localStorage.getItem(TOKEN_KEY);

    if (!token) {
      set({ isRestoring: false });
      return;
    }

    set({ accessToken: token });

    try {
      const profile = await authApi.me();
      set({ user: profile.user, accessToken: token, isRestoring: false, error: null });
    } catch {
      window.localStorage.removeItem(TOKEN_KEY);
      set({ accessToken: null, user: null, isRestoring: false });
    }
  },

  devLogin: async (phone) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authApi.devLogin(phone);
      window.localStorage.setItem(TOKEN_KEY, response.accessToken);
      set({ accessToken: response.accessToken, user: response.user });
      return true;
    } catch {
      set({ error: 'Не удалось войти. Проверьте backend и API URL.' });
      return false;
    } finally {
      set({ isLoading: false, isRestoring: false });
    }
  },

  logout: () => {
    window.localStorage.removeItem(TOKEN_KEY);
    set({ accessToken: null, user: null, error: null });
  },
}));
