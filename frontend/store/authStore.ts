import { create } from 'zustand';
import { persist, type PersistStorage, type StorageValue } from 'zustand/middleware';

interface AuthState {
  token: string | null;
  isAuthenticated: boolean;
  deviceId?: string;        // For employees
  sessionId?: string;       // For employees
  setToken: (token: string, deviceId?: string, sessionId?: string) => void;
  clearToken: () => void;
}

type PersistedAuthState = Pick<AuthState, 'token' | 'isAuthenticated' | 'deviceId' | 'sessionId'>;

const authStorage: PersistStorage<PersistedAuthState> = {
  getItem: (name: string) => {
    if (typeof window === 'undefined') {
      return null;
    }

    const rawValue = window.localStorage.getItem(name);

    if (!rawValue) {
      return null;
    }

    try {
      return JSON.parse(rawValue) as StorageValue<PersistedAuthState>;
    } catch {
      window.localStorage.removeItem(name);
      return null;
    }
  },
  setItem: (name: string, value: StorageValue<PersistedAuthState>) => {
    if (typeof window === 'undefined') {
      return;
    }

    window.localStorage.setItem(name, JSON.stringify(value));
  },
  removeItem: (name: string) => {
    if (typeof window === 'undefined') {
      return;
    }

    window.localStorage.removeItem(name);
  },
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      isAuthenticated: false,
      deviceId: undefined,
      sessionId: undefined,
      setToken: (token, deviceId, sessionId) => {
        if (typeof window !== 'undefined') {
          localStorage.setItem('auth_token', token);
          if (deviceId) localStorage.setItem('device_id', deviceId);
          if (sessionId) localStorage.setItem('session_id', sessionId);
        }
        set({ token, isAuthenticated: true, deviceId, sessionId });
      },
      clearToken: () => {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('auth_token');
          localStorage.removeItem('device_id');
          localStorage.removeItem('session_id');
        }
        set({ token: null, isAuthenticated: false, deviceId: undefined, sessionId: undefined });
      },
    }),
    {
      name: 'auth-storage',
      storage: authStorage,
      partialize: (state) => ({ 
        token: state.token, 
        isAuthenticated: state.isAuthenticated,
        deviceId: state.deviceId,
        sessionId: state.sessionId,
      }),
    }
  )
);