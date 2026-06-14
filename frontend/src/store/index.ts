import { create } from 'zustand';

export type Language = 'en' | 'bn';
export type SyncStatus = 'idle' | 'syncing' | 'offline' | 'error';
export type UserRole = 'doctor' | 'admin' | 'nurse' | 'staff';

export interface AuthUser {
  id: string;
  name: string;
  role: UserRole;
}

export interface UiState {
  syncStatus: SyncStatus;
  pendingCount: number;
  surgeMode: boolean;
}

export interface AppState {
  userId: string | null;
  user: AuthUser | null;
  role: UserRole | null;
  facilityId: string | null;
  token: string | null;
  language: Language;
  ui: UiState;
  syncStatus: SyncStatus;
  pendingCount: number;
  surgeMode: boolean;
  toasts: { id: string; message: string; tone?: 'success' | 'error' | 'info' }[];
  setAuth: (payload: { userId: string; user: AuthUser; facilityId: string; token: string }) => void;
  clearAuth: () => void;
  setLanguage: (language: Language) => void;
  setSyncStatus: (syncStatus: SyncStatus) => void;
  setPendingCount: (pendingCount: number) => void;
  setSurgeMode: (surgeMode: boolean) => void;
  pushToast: (toast: { message: string; tone?: 'success' | 'error' | 'info' }) => void;
  removeToast: (id: string) => void;
}

export const useAppStore = create<AppState>((set) => ({
  userId: null,
  user: null,
  role: null,
  facilityId: null,
  token: null,
  language: 'en',
  ui: {
    syncStatus: 'idle',
    pendingCount: 0,
    surgeMode: false
  },
  syncStatus: 'idle',
  pendingCount: 0,
  surgeMode: false,
  toasts: [],
  setAuth: ({ userId, user, facilityId, token }) =>
    set({ userId, user, role: user.role, facilityId, token }),
  clearAuth: () =>
    set({ userId: null, user: null, role: null, facilityId: null, token: null }),
  setLanguage: (language) => set({ language }),
  setSyncStatus: (syncStatus) =>
    set((state) => ({
      syncStatus,
      ui: { ...state.ui, syncStatus }
    })),
  setPendingCount: (pendingCount) =>
    set((state) => ({
      pendingCount,
      ui: { ...state.ui, pendingCount }
    })),
  setSurgeMode: (surgeMode) =>
    set((state) => ({
      surgeMode,
      ui: { ...state.ui, surgeMode }
    })),
  pushToast: (toast) =>
    set((state) => ({
      toasts: [...state.toasts, { id: crypto.randomUUID(), ...toast }]
    })),
  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((toast) => toast.id !== id)
    }))
}));