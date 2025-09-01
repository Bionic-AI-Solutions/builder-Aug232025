import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Persona = 'super_admin' | 'builder' | 'end_user';
export type UserRole = 'super_admin' | 'builder' | 'end_user';
export type Permission =
  | 'create_project'
  | 'edit_project'
  | 'publish_project'
  | 'view_analytics'
  | 'purchase_project'
  | 'view_marketplace'
  | 'manage_users'
  | 'manage_marketplace'
  | 'view_all_analytics'
  | 'approve_users';

export interface User {
  id: string;
  email: string;
  persona: Persona;
  roles: UserRole[];
  permissions: Permission[];
  metadata: Record<string, any>;
  isActive: boolean;
  approvalStatus: 'pending' | 'approved' | 'rejected';
  approvedBy?: string;
  approvedAt?: Date;
  rejectionReason?: string;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Computed properties
  persona: string | null;

  // Actions
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  setUser: (user: User, token: string) => void;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
}

import { getApiUrl } from '../../config/ports.js';

// API base URL - uses centralized configuration
const API_BASE = getApiUrl();

// Helper function to check if token is expired
const isTokenExpired = (token: string): boolean => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Math.floor(Date.now() / 1000);
    return payload.exp < currentTime;
  } catch (error) {
    console.error('Error parsing token:', error);
    return true; // Assume expired if we can't parse
  }
};

// Helper function to make authenticated API calls
export const apiCall = async (endpoint: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('auth-token');
  console.log('[API_CALL] Endpoint:', endpoint);
  console.log('[API_CALL] Token exists:', !!token);
  console.log('[API_CALL] Token (first 20 chars):', token ? token.substring(0, 20) + '...' : 'none');

  // Check if token is expired
  if (token && isTokenExpired(token)) {
    console.log('[API_CALL] Token is expired, clearing and redirecting to login');
    localStorage.removeItem('auth-token');
    window.location.href = '/login';
    throw new Error('Token expired');
  }

  const config: RequestInit = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  };

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, config);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));

      // Handle authentication failures
      if (response.status === 401 || response.status === 403) {
        console.log('[API_CALL] Authentication failed, clearing token');
        localStorage.removeItem('auth-token');
        // Redirect to login or trigger re-authentication
        window.location.href = '/login';
        throw new Error('Authentication failed');
      }

      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('API call failed:', error);
    throw error;
  }
};

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // Computed properties
      get persona() {
        return get().user?.persona || null;
      },

      login: async (email: string, password: string) => {
        console.log('Login attempt for:', email);
        set({ isLoading: true, error: null });

        try {
          const response = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
          });

          const data = await response.json();
          console.log('Login response:', data);

          if (!response.ok) {
            throw new Error(data.error || 'Login failed');
          }

          const { user, tokens } = data.data;
          const token = tokens.accessToken;
          console.log('Login successful, user:', user);
          console.log('Token received:', token ? 'yes' : 'no');

          // Store token in localStorage
          localStorage.setItem('auth-token', token);

          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });

          console.log('Auth state updated');
          return true;
        } catch (error) {
          console.error('Login error:', error);
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'Login failed',
          });
          return false;
        }
      },

      logout: () => {
        localStorage.removeItem('auth-token');
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          error: null,
        });
      },

      setUser: (user: User, token: string) => {
        localStorage.setItem('auth-token', token);
        set({
          user,
          token,
          isAuthenticated: true,
          error: null,
        });
      },

      updateUser: (user: User) => {
        set((state) => ({
          ...state,
          user,
        }));
      },

      // Initialize auth state from localStorage on app start
      initializeAuth: () => {
        console.log('Initializing auth state...');
        const token = localStorage.getItem('auth-token');
        console.log('Token from localStorage:', token ? 'exists' : 'not found');

        if (token) {
          // Try to restore user from localStorage
          const storedState = localStorage.getItem('auth-storage');
          console.log('Stored state from localStorage:', storedState ? 'exists' : 'not found');

          if (storedState) {
            try {
              const parsed = JSON.parse(storedState);
              console.log('Parsed state:', parsed);

              if (parsed.state && parsed.state.user && parsed.state.token) {
                console.log('Restoring user:', parsed.state.user);
                set({
                  user: parsed.state.user,
                  token: parsed.state.token,
                  isAuthenticated: true,
                  error: null,
                });
              } else {
                console.log('Invalid stored state structure');
                // Clear invalid state
                localStorage.removeItem('auth-token');
                localStorage.removeItem('auth-storage');
              }
            } catch (error) {
              console.error('Failed to restore auth state:', error);
              localStorage.removeItem('auth-token');
              localStorage.removeItem('auth-storage');
            }
          } else {
            console.log('No stored state found, clearing token');
            localStorage.removeItem('auth-token');
          }
        }
      },

      clearError: () => set({ error: null }),
      setLoading: (loading: boolean) => set({ isLoading: loading }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
