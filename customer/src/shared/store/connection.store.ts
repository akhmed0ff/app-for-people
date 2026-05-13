import { create } from 'zustand';

type ConnectionStatus = 'idle' | 'connecting' | 'connected' | 'reconnecting' | 'disconnected' | 'error';

type ConnectionState = {
  status: ConnectionStatus;
  lastError: string | null;
  reconnectAttempt: number;
  setStatus: (status: ConnectionStatus) => void;
  setError: (message: string | null) => void;
  setReconnectAttempt: (attempt: number) => void;
};

export const useConnectionStore = create<ConnectionState>((set) => ({
  status: 'idle',
  lastError: null,
  reconnectAttempt: 0,
  setStatus: (status) => set({ status }),
  setError: (lastError) => set({ lastError, status: lastError ? 'error' : 'connected' }),
  setReconnectAttempt: (reconnectAttempt) => set({ reconnectAttempt, status: 'reconnecting' }),
}));
