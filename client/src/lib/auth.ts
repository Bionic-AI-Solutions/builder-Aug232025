import { create } from 'zustand';
import { type User } from '@shared/schema';

interface AuthState {
  user: User | null;
  persona: 'super_admin' | 'builder' | 'end_user' | null;
  roles: string[];
  permissions: string[];
  isAuthenticated: boolean;
  login: (user: User) => void;
  logout: () => void;
  switchPersona: (persona: string) => void;
  hasPermission: (permission: string) => boolean;
  hasRole: (role: string) => boolean;
}

// Permission constants
export const PERMISSIONS = {
  // Builder permissions
  CREATE_PROJECTS: 'create_projects',
  PUBLISH_TO_MARKETPLACE: 'publish_to_marketplace',
  VIEW_REVENUE: 'view_revenue',
  MANAGE_IMPLEMENTATIONS: 'manage_implementations',
  PURCHASE_TEMPLATES: 'purchase_templates',

  // End-user permissions
  PURCHASE_WIDGETS: 'purchase_widgets',
  MANAGE_WIDGETS: 'manage_widgets',
  VIEW_USAGE: 'view_usage',
  MANAGE_BILLING: 'manage_billing',

  // Admin permissions
  MANAGE_USERS: 'manage_users',
  VIEW_PLATFORM_ANALYTICS: 'view_platform_analytics',
  MANAGE_BUILDERS: 'manage_builders',
  VIEW_IMPLEMENTATIONS: 'view_implementations',
  MANAGE_SYSTEM: 'manage_system',
} as const;

// Role definitions
export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  BUILDER: 'builder',
  END_USER: 'end_user',
} as const;

// Role-permission mapping
export const ROLE_PERMISSIONS: Record<string, string[]> = {
  [ROLES.SUPER_ADMIN]: Object.values(PERMISSIONS),
  [ROLES.BUILDER]: [
    PERMISSIONS.CREATE_PROJECTS,
    PERMISSIONS.PUBLISH_TO_MARKETPLACE,
    PERMISSIONS.VIEW_REVENUE,
    PERMISSIONS.MANAGE_IMPLEMENTATIONS,
    PERMISSIONS.PURCHASE_TEMPLATES,
  ],
  [ROLES.END_USER]: [
    PERMISSIONS.PURCHASE_WIDGETS,
    PERMISSIONS.MANAGE_WIDGETS,
    PERMISSIONS.VIEW_USAGE,
    PERMISSIONS.MANAGE_BILLING,
  ],
};

export const useAuth = create<AuthState>()((set, get) => ({
  user: null,
  persona: null,
  roles: [],
  permissions: [],
  isAuthenticated: false,
  login: (user: User) => {
    const persona = user.persona as 'super_admin' | 'builder' | 'end_user';
    const roles = user.roles || [persona];
    const permissions = user.permissions || ROLE_PERMISSIONS[persona] || [];
    
    set({ 
      user, 
      persona,
      roles,
      permissions,
      isAuthenticated: true 
    });
  },
  logout: () => set({ 
    user: null, 
    persona: null,
    roles: [],
    permissions: [],
    isAuthenticated: false 
  }),
  switchPersona: (persona: string) => {
    const { user } = get();
    if (user) {
      const newPersona = persona as 'super_admin' | 'builder' | 'end_user';
      const roles = [newPersona];
      const permissions = ROLE_PERMISSIONS[newPersona] || [];
      
      set({ 
        persona: newPersona,
        roles,
        permissions
      });
    }
  },
  hasPermission: (permission: string) => {
    const { permissions } = get();
    return permissions.includes(permission);
  },
  hasRole: (role: string) => {
    const { roles } = get();
    return roles.includes(role);
  },
}));
