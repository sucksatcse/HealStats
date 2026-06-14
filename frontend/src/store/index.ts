import { create } from 'zustand';

export type Language = 'en' | 'bn';
export type SyncStatus = 'idle' | 'syncing' | 'offline' | 'error';
export type UserRole = 'doctor' | 'admin' | 'nurse' | 'staff';

export interface AuthUser {
  id: string;
  name: string;
  role: UserRole;
}

export interface AppState {
  user: AuthUser | null;
  role: UserRole | null;
  facilityId: string | null;
  token: string | null;
  language: Language;
  syncStatus: SyncStatus;
  pendingCount: number;
  setAuth: (payload: { user: AuthUser; facilityId: string; token: string }) => void;
  clearAuth: () => void;
  setLanguage: (language: Language) => void;
  setSyncStatus: (syncStatus: SyncStatus) => void;
  setPendingCount: (pendingCount: number) => void;
}

export const useAppStore = create<AppState>((set) => ({
  user: null,
  role: null,
  facilityId: null,
  token: null,
  language: 'en',
  syncStatus: 'idle',
  pendingCount: 0,
  setAuth: ({ user, facilityId, token }) =>
    set({ user, role: user.role, facilityId, token }),
  clearAuth: () => set({ user: null, role: null, facilityId: null, token: null }),
  setLanguage: (language) => set({ language }),
  setSyncStatus: (syncStatus) => set({ syncStatus }),
  setPendingCount: (pendingCount) => set({ pendingCount })
}));