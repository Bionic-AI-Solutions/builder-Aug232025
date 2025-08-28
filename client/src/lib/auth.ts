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
  name?: string;
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
  plan?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Computed properties
  persona: string | null;

  // Actions
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  setUser: (user: User, token: string) => void;
  refreshAuthToken: () => Promise<boolean>;
  switchPersona: (newPersona: string) => void;
  initializeAuth: () => void;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
}

// API base URL
const API_BASE = 'http://localhost:8080/api';

// Helper function to make authenticated API calls
export const apiCall = async (endpoint: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('auth-token');
  console.log('[API_CALL] Endpoint:', endpoint);
  console.log('[API_CALL] Token exists:', !!token);
  console.log('[API_CALL] Token (first 20 chars):', token ? token.substring(0, 20) + '...' : 'none');

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

    // If we get a 401 and have a refresh token, try to refresh
    if (response.status === 401) {
      const refreshToken = localStorage.getItem('auth-refresh-token');
      if (refreshToken) {
        console.log('[API_CALL] Token expired, attempting refresh...');
        try {
          const refreshResponse = await fetch(`${API_BASE}/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken }),
          });

          if (refreshResponse.ok) {
            const refreshData = await refreshResponse.json();
            const newToken = refreshData.data.tokens.accessToken;
            const newRefreshToken = refreshData.data.tokens.refreshToken;

            localStorage.setItem('auth-token', newToken);
            localStorage.setItem('auth-refresh-token', newRefreshToken);

            // Update the auth store
            const authStore = useAuth.getState();
            authStore.token = newToken;
            authStore.refreshToken = newRefreshToken;

            // Retry the original request with new token
            const newConfig = {
              ...options,
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${newToken}`,
                ...options.headers,
              },
            };

            const retryResponse = await fetch(`${API_BASE}${endpoint}`, newConfig);
            if (!retryResponse.ok) {
              const errorData = await retryResponse.json().catch(() => ({}));
              throw new Error(errorData.error || `HTTP ${retryResponse.status}`);
            }
            return await retryResponse.json();
          }
        } catch (refreshError) {
          console.error('[API_CALL] Token refresh failed:', refreshError);
          // If refresh fails, logout
          const authStore = useAuth.getState();
          authStore.logout();
        }
      }
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
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
      refreshToken: null,
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
          const refreshToken = tokens.refreshToken;
          console.log('Login successful, user:', user);
          console.log('Token received:', token ? 'yes' : 'no');
          console.log('Refresh token received:', refreshToken ? 'yes' : 'no');

          // Store tokens in localStorage
          localStorage.setItem('auth-token', token);
          localStorage.setItem('auth-refresh-token', refreshToken);

          set({
            user,
            token,
            refreshToken,
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

      refreshAuthToken: async () => {
        const refreshToken = get().refreshToken;
        if (!refreshToken) {
          console.log('No refresh token available');
          return false;
        }

        try {
          console.log('Attempting to refresh token...');
          const response = await fetch(`${API_BASE}/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken }),
          });

          const data = await response.json();
          console.log('Refresh response:', data);

          if (!response.ok) {
            throw new Error(data.error || 'Token refresh failed');
          }

          const { user, tokens } = data.data;
          const token = tokens.accessToken;
          const newRefreshToken = tokens.refreshToken;

          // Update localStorage
          localStorage.setItem('auth-token', token);
          localStorage.setItem('auth-refresh-token', newRefreshToken);

          set({
            user,
            token,
            refreshToken: newRefreshToken,
            isAuthenticated: true,
            error: null,
          });

          console.log('Token refreshed successfully');
          return true;
        } catch (error) {
          console.error('Token refresh error:', error);
          // If refresh fails, logout
          get().logout();
          return false;
        }
      },

      logout: () => {
        localStorage.removeItem('auth-token');
        localStorage.removeItem('auth-refresh-token');
        set({
          user: null,
          token: null,
          refreshToken: null,
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

      // Initialize auth state from localStorage on app start
      initializeAuth: () => {
        console.log('Initializing auth state...');
        const token = localStorage.getItem('auth-token');
        const refreshToken = localStorage.getItem('auth-refresh-token');
        console.log('Token from localStorage:', token ? 'exists' : 'not found');
        console.log('Refresh token from localStorage:', refreshToken ? 'exists' : 'not found');

        if (token && refreshToken) {
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
                  refreshToken: parsed.state.refreshToken,
                  isAuthenticated: true,
                  error: null,
                });
              } else {
                console.log('Invalid stored state structure');
                // Clear invalid state
                localStorage.removeItem('auth-token');
                localStorage.removeItem('auth-refresh-token');
                localStorage.removeItem('auth-storage');
              }
            } catch (error) {
              console.error('Failed to restore auth state:', error);
              localStorage.removeItem('auth-token');
              localStorage.removeItem('auth-refresh-token');
              localStorage.removeItem('auth-storage');
            }
          } else {
            console.log('No stored state found, clearing tokens');
            localStorage.removeItem('auth-token');
            localStorage.removeItem('auth-refresh-token');
          }
        }
      },

      switchPersona: (newPersona: string) => {
        const currentUser = get().user;
        if (currentUser) {
          const updatedUser = { ...currentUser, persona: newPersona as Persona };
          set({ user: updatedUser });
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
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
