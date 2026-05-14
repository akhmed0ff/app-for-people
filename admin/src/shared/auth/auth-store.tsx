'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { TokenPair } from '../api/types';

type AuthContextValue = {
  accessToken: string | null;
  refreshToken: string | null;
  hydrated: boolean;
  isAuthenticated: boolean;
  setTokens: (tokens: TokenPair) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);
const ACCESS_KEY = 'admin.accessToken';
const REFRESH_KEY = 'admin.refreshToken';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setAccessToken(localStorage.getItem(ACCESS_KEY));
    setRefreshToken(localStorage.getItem(REFRESH_KEY));
    setHydrated(true);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      accessToken,
      refreshToken,
      hydrated,
      isAuthenticated: Boolean(accessToken),
      setTokens: (tokens) => {
        localStorage.setItem(ACCESS_KEY, tokens.accessToken);
        localStorage.setItem(REFRESH_KEY, tokens.refreshToken);
        setAccessToken(tokens.accessToken);
        setRefreshToken(tokens.refreshToken);
      },
      logout: () => {
        localStorage.removeItem(ACCESS_KEY);
        localStorage.removeItem(REFRESH_KEY);
        setAccessToken(null);
        setRefreshToken(null);
      },
    }),
    [accessToken, hydrated, refreshToken],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return context;
}
