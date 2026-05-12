import * as SecureStore from 'expo-secure-store';
import { create } from 'zustand';
import { TokenPair } from '../api/types';

type AuthState = {
  phone: string | null;
  accessToken: string | null;
  refreshToken: string | null;
  hydrated: boolean;
  setPhone: (phone: string) => void;
  setTokens: (tokens: TokenPair) => Promise<void>;
  hydrate: () => Promise<void>;
  logout: () => Promise<void>;
};

const ACCESS_TOKEN_KEY = 'customer.accessToken';
const REFRESH_TOKEN_KEY = 'customer.refreshToken';

export const useAuthStore = create<AuthState>((set) => ({
  phone: null,
  accessToken: null,
  refreshToken: null,
  hydrated: false,
  setPhone: (phone) => set({ phone }),
  setTokens: async (tokens) => {
    await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, tokens.accessToken);
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, tokens.refreshToken);
    set({ accessToken: tokens.accessToken, refreshToken: tokens.refreshToken });
  },
  hydrate: async () => {
    const [accessToken, refreshToken] = await Promise.all([
      SecureStore.getItemAsync(ACCESS_TOKEN_KEY),
      SecureStore.getItemAsync(REFRESH_TOKEN_KEY),
    ]);
    set({ accessToken, refreshToken, hydrated: true });
  },
  logout: async () => {
    await Promise.all([
      SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY),
      SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY),
    ]);
    set({ accessToken: null, refreshToken: null, phone: null });
  },
}));
