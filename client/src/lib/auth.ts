import { create } from 'zustand';
import { type User } from '@shared/schema';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (user: User) => void;
  logout: () => void;
}

export const useAuth = create<AuthState>()((set) => ({
  user: null,
  isAuthenticated: false,
  login: (user: User) => set({ user, isAuthenticated: true }),
  logout: () => set({ user: null, isAuthenticated: false }),
}));
