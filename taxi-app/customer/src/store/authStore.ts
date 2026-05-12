import { create } from 'zustand';
import { authApi } from '../api/auth';
import { tokenStorage } from '../services/storage';
import { AuthProfile, Passenger, User } from '../types/api';

interface AuthState {
  accessToken: string | null;
  user: User | null;
  passenger: Passenger | null;
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
  passenger: null,
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
      set(profileToState(profile, token));
    } catch {
      await tokenStorage.clear();
      set({ accessToken: null, user: null, passenger: null });
    } finally {
      set({ isRestoring: false });
    }
  },

  devLogin: async (phone: string) => {
    set({ isLoading: true, error: null });

    try {
      const response = await authApi.devLogin(phone);
      await tokenStorage.set(response.accessToken);
      set(profileToState(response, response.accessToken));
    } catch {
      set({ error: 'Не удалось войти. Проверьте backend и API URL.' });
    } finally {
      set({ isLoading: false });
    }
  },

  logout: async () => {
    await tokenStorage.clear();
    set({ accessToken: null, user: null, passenger: null, error: null });
  },
}));

function profileToState(profile: AuthProfile, accessToken: string) {
  return {
    accessToken,
    user: profile.user,
    passenger: profile.passenger,
    isRestoring: false,
    error: null,
  };
}
