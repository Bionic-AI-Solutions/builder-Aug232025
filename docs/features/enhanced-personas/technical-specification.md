# Enhanced Personas Technical Specification

## Overview

This document provides the detailed technical specification for implementing the Enhanced Personas feature in the BuilderAI platform, addressing the multi-tenant architecture requirements for Super Admin, Builder, and End User personas.

## Architecture Overview

### System Architecture
```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend Application                     │
│                    (React + TypeScript)                         │
└─────────────────┬───────────────────────────────────────────────┘
                  │
    ┌─────────────┼─────────────┐
    │             │             │
    ▼             ▼             ▼
┌─────────┐ ┌─────────┐ ┌─────────┐
│  Auth   │ │  User   │ │ Persona │
│Service  │ │Service  │ │Service  │
└─────────┘ └─────────┘ └─────────┘
    │             │             │
    ▼             ▼             ▼
┌─────────┐ ┌─────────┐ ┌─────────┐
│ Builder │ │End User │ │  Admin  │
│Service  │ │Service  │ │Service  │
└─────────┘ └─────────┘ └─────────┘
    │             │             │
    ▼             ▼             ▼
┌─────────┐ ┌─────────┐ ┌─────────┐
│ Widget  │ │Analytics│ │Billing  │
│Service  │ │Service  │ │Service  │
└─────────┘ └─────────┘ └─────────┘
```

## Database Schema Updates

### User Table Enhancements
```sql
-- Add persona support to users table
ALTER TABLE users ADD COLUMN persona VARCHAR(20) NOT NULL DEFAULT 'builder';
ALTER TABLE users ADD COLUMN roles JSONB DEFAULT '[]';
ALTER TABLE users ADD COLUMN permissions JSONB DEFAULT '[]';
ALTER TABLE users ADD COLUMN metadata JSONB DEFAULT '{}';

-- Create indexes for persona-based queries
CREATE INDEX idx_users_persona ON users(persona);
CREATE INDEX idx_users_roles ON users USING GIN(roles);
CREATE INDEX idx_users_permissions ON users USING GIN(permissions);
```

### New Tables for Multi-Tenant Support

#### Widget Implementations
```sql
CREATE TABLE widget_implementations (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  end_user_id VARCHAR NOT NULL REFERENCES users(id),
  project_id VARCHAR NOT NULL REFERENCES projects(id),
  builder_id VARCHAR NOT NULL REFERENCES users(id),
  implementation_url VARCHAR NOT NULL,
  embed_code TEXT NOT NULL,
  configuration JSONB DEFAULT '{}',
  status VARCHAR NOT NULL DEFAULT 'active',
  usage_count INTEGER DEFAULT 0,
  revenue_generated INTEGER DEFAULT 0,
  last_activity TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_widget_impl_end_user ON widget_implementations(end_user_id);
CREATE INDEX idx_widget_impl_builder ON widget_implementations(builder_id);
CREATE INDEX idx_widget_impl_project ON widget_implementations(project_id);
CREATE INDEX idx_widget_impl_status ON widget_implementations(status);
```

#### Revenue Events
```sql
CREATE TABLE revenue_events (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  implementation_id VARCHAR REFERENCES widget_implementations(id),
  builder_id VARCHAR NOT NULL REFERENCES users(id),
  end_user_id VARCHAR NOT NULL REFERENCES users(id),
  amount INTEGER NOT NULL, -- in cents
  event_type VARCHAR NOT NULL, -- 'purchase', 'usage', 'subscription'
  description TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_revenue_builder ON revenue_events(builder_id);
CREATE INDEX idx_revenue_end_user ON revenue_events(end_user_id);
CREATE INDEX idx_revenue_implementation ON revenue_events(implementation_id);
CREATE INDEX idx_revenue_type ON revenue_events(event_type);
CREATE INDEX idx_revenue_created ON revenue_events(created_at);
```

#### Template Purchases
```sql
CREATE TABLE template_purchases (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id VARCHAR NOT NULL REFERENCES users(id),
  template_project_id VARCHAR NOT NULL REFERENCES projects(id),
  seller_id VARCHAR NOT NULL REFERENCES users(id),
  purchase_amount INTEGER NOT NULL, -- in cents
  purchase_date TIMESTAMP DEFAULT NOW(),
  status VARCHAR NOT NULL DEFAULT 'completed',
  metadata JSONB DEFAULT '{}'
);

CREATE INDEX idx_template_purchase_buyer ON template_purchases(buyer_id);
CREATE INDEX idx_template_purchase_seller ON template_purchases(seller_id);
CREATE INDEX idx_template_purchase_project ON template_purchases(template_project_id);
```

#### Usage Tracking
```sql
CREATE TABLE usage_events (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  implementation_id VARCHAR NOT NULL REFERENCES widget_implementations(id),
  event_type VARCHAR NOT NULL, -- 'load', 'interaction', 'error'
  event_data JSONB DEFAULT '{}',
  user_agent TEXT,
  ip_address INET,
  session_id VARCHAR,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_usage_implementation ON usage_events(implementation_id);
CREATE INDEX idx_usage_type ON usage_events(event_type);
CREATE INDEX idx_usage_created ON usage_events(created_at);
```

## Frontend Component Architecture

### Core Components

#### PersonaSelector Component
```typescript
interface PersonaSelectorProps {
  currentPersona: 'super_admin' | 'builder' | 'end_user';
  onPersonaChange: (persona: string) => void;
  availablePersonas: string[];
  disabled?: boolean;
}

const PersonaSelector: React.FC<PersonaSelectorProps> = ({
  currentPersona,
  onPersonaChange,
  availablePersonas,
  disabled = false
}) => {
  // Component implementation
};
```

#### PersonaGuard Component
```typescript
interface PersonaGuardProps {
  requiredPersonas: string[];
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

const PersonaGuard: React.FC<PersonaGuardProps> = ({
  requiredPersonas,
  fallback,
  children
}) => {
  const { persona } = useAuth();
  
  if (!requiredPersonas.includes(persona)) {
    return fallback || <AccessDenied />;
  }
  
  return <>{children}</>;
};
```

#### BuilderDashboard Component
```typescript
interface BuilderDashboardProps {
  builderId: string;
}

const BuilderDashboard: React.FC<BuilderDashboardProps> = ({ builderId }) => {
  const { data: dashboardData } = useQuery({
    queryKey: ['builder-dashboard', builderId],
    queryFn: () => fetchBuilderDashboard(builderId)
  });

  return (
    <div className="builder-dashboard">
      <RevenueOverview data={dashboardData?.revenue} />
      <ProjectPortfolio projects={dashboardData?.projects} />
      <ImplementationTracker implementations={dashboardData?.implementations} />
      <CustomerManager customers={dashboardData?.customers} />
    </div>
  );
};
```

#### EndUserDashboard Component
```typescript
interface EndUserDashboardProps {
  endUserId: string;
}

const EndUserDashboard: React.FC<EndUserDashboardProps> = ({ endUserId }) => {
  const { data: dashboardData } = useQuery({
    queryKey: ['end-user-dashboard', endUserId],
    queryFn: () => fetchEndUserDashboard(endUserId)
  });

  return (
    <div className="end-user-dashboard">
      <WidgetPortfolio widgets={dashboardData?.widgets} />
      <UsageAnalytics usage={dashboardData?.usage} />
      <BillingOverview billing={dashboardData?.billing} />
      <SupportAccess support={dashboardData?.support} />
    </div>
  );
};
```

#### WidgetEmbedder Component
```typescript
interface WidgetEmbedderProps {
  widgetId: string;
  configuration?: WidgetConfiguration;
  onConfigurationChange?: (config: WidgetConfiguration) => void;
}

const WidgetEmbedder: React.FC<WidgetEmbedderProps> = ({
  widgetId,
  configuration,
  onConfigurationChange
}) => {
  const { data: widgetData } = useQuery({
    queryKey: ['widget', widgetId],
    queryFn: () => fetchWidget(widgetId)
  });

  return (
    <div className="widget-embedder">
      <EmbedCodeGenerator widget={widgetData} configuration={configuration} />
      <ConfigurationPanel 
        configuration={configuration}
        onChange={onConfigurationChange}
      />
      <WidgetPreview widget={widgetData} configuration={configuration} />
    </div>
  );
};
```

### State Management

#### User Context Enhancement
```typescript
interface UserContextType {
  user: User | null;
  persona: 'super_admin' | 'builder' | 'end_user' | null;
  permissions: string[];
  roles: string[];
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  switchPersona: (persona: string) => Promise<void>;
  hasPermission: (permission: string) => boolean;
  hasRole: (role: string) => boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [persona, setPersona] = useState<string | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [roles, setRoles] = useState<string[]>([]);

  const hasPermission = useCallback((permission: string) => {
    return permissions.includes(permission);
  }, [permissions]);

  const hasRole = useCallback((role: string) => {
    return roles.includes(role);
  }, [roles]);

  const switchPersona = useCallback(async (newPersona: string) => {
    // Implementation for persona switching
  }, []);

  const value = {
    user,
    persona,
    permissions,
    roles,
    isAuthenticated: !!user,
    isLoading: false,
    login: async () => {},
    logout: () => {},
    switchPersona,
    hasPermission,
    hasRole
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};
```

#### Persona-Specific Hooks

```typescript
// Builder-specific hook
export const useBuilder = () => {
  const { user, persona } = useAuth();
  
  if (persona !== 'builder') {
    throw new Error('useBuilder hook can only be used by builders');
  }
  
  return {
    builderId: user?.id,
    // Builder-specific methods
  };
};

// End-user-specific hook
export const useEndUser = () => {
  const { user, persona } = useAuth();
  
  if (persona !== 'end_user') {
    throw new Error('useEndUser hook can only be used by end users');
  }
  
  return {
    endUserId: user?.id,
    // End-user-specific methods
  };
};

// Admin-specific hook
export const useAdmin = () => {
  const { user, persona } = useAuth();
  
  if (persona !== 'super_admin') {
    throw new Error('useAdmin hook can only be used by super admins');
  }
  
  return {
    adminId: user?.id,
    // Admin-specific methods
  };
};
```

## API Integration

### Enhanced API Client

```typescript
class ApiClient {
  private baseURL: string;
  private token: string | null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    this.token = localStorage.getItem('auth_token');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...(this.token && { Authorization: `Bearer ${this.token}` }),
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    return response.json();
  }

  // Builder-specific APIs
  async getBuilderDashboard(builderId: string): Promise<BuilderDashboardData> {
    return this.request(`/api/builders/${builderId}/dashboard`);
  }

  async getBuilderProjects(builderId: string, params?: QueryParams): Promise<ProjectListResponse> {
    return this.request(`/api/builders/${builderId}/projects?${new URLSearchParams(params)}`);
  }

  async getBuilderImplementations(builderId: string, params?: QueryParams): Promise<ImplementationListResponse> {
    return this.request(`/api/builders/${builderId}/implementations?${new URLSearchParams(params)}`);
  }

  async getBuilderRevenue(builderId: string, params?: QueryParams): Promise<RevenueData> {
    return this.request(`/api/builders/${builderId}/revenue?${new URLSearchParams(params)}`);
  }

  // End-user-specific APIs
  async getEndUserDashboard(endUserId: string): Promise<EndUserDashboardData> {
    return this.request(`/api/end-users/${endUserId}/dashboard`);
  }

  async getEndUserWidgets(endUserId: string, params?: QueryParams): Promise<WidgetListResponse> {
    return this.request(`/api/end-users/${endUserId}/widgets?${new URLSearchParams(params)}`);
  }

  async getEndUserUsage(endUserId: string, params?: QueryParams): Promise<UsageData> {
    return this.request(`/api/end-users/${endUserId}/usage?${new URLSearchParams(params)}`);
  }

  // Widget-specific APIs
  async implementWidget(data: ImplementWidgetRequest): Promise<WidgetImplementation> {
    return this.request('/api/widgets/implement', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getWidget(widgetId: string): Promise<WidgetData> {
    return this.request(`/api/widgets/${widgetId}`);
  }

  async updateWidgetConfiguration(widgetId: string, configuration: WidgetConfiguration): Promise<WidgetData> {
    return this.request(`/api/widgets/${widgetId}/configuration`, {
      method: 'PATCH',
      body: JSON.stringify({ configuration }),
    });
  }

  async trackWidgetUsage(widgetId: string, event: UsageEvent): Promise<void> {
    return this.request(`/api/widgets/${widgetId}/track`, {
      method: 'POST',
      body: JSON.stringify(event),
    });
  }

  // Admin-specific APIs
  async getAdminBuilders(params?: QueryParams): Promise<BuilderListResponse> {
    return this.request(`/api/admin/builders?${new URLSearchParams(params)}`);
  }

  async getAdminImplementations(params?: QueryParams): Promise<ImplementationListResponse> {
    return this.request(`/api/admin/implementations?${new URLSearchParams(params)}`);
  }

  async getPlatformAnalytics(): Promise<PlatformAnalytics> {
    return this.request('/api/analytics/platform');
  }
}
```

## Routing Configuration

### Persona-Based Routing

```typescript
// Route configuration with persona-based access control
const routes: RouteConfig[] = [
  // Public routes
  {
    path: '/login',
    component: LoginPage,
    public: true,
  },
  {
    path: '/register',
    component: RegisterPage,
    public: true,
  },

  // Persona-specific routes
  {
    path: '/dashboard',
    component: DashboardPage,
    personas: ['super_admin', 'builder', 'end_user'],
  },
  {
    path: '/builder-dashboard',
    component: BuilderDashboardPage,
    personas: ['builder'],
  },
  {
    path: '/end-user-dashboard',
    component: EndUserDashboardPage,
    personas: ['end_user'],
  },
  {
    path: '/admin',
    component: AdminPage,
    personas: ['super_admin'],
  },
  {
    path: '/admin/builders',
    component: AdminBuildersPage,
    personas: ['super_admin'],
  },
  {
    path: '/admin/implementations',
    component: AdminImplementationsPage,
    personas: ['super_admin'],
  },

  // Widget routes
  {
    path: '/widget/:widgetId',
    component: WidgetPage,
    personas: ['end_user'],
  },
  {
    path: '/widget/:widgetId/configure',
    component: WidgetConfigurationPage,
    personas: ['end_user'],
  },

  // Project routes (builder-specific)
  {
    path: '/projects',
    component: ProjectsPage,
    personas: ['builder'],
  },
  {
    path: '/projects/:projectId',
    component: ProjectDetailPage,
    personas: ['builder'],
  },

  // Marketplace routes
  {
    path: '/marketplace',
    component: MarketplacePage,
    personas: ['builder', 'end_user'],
  },
  {
    path: '/marketplace/:appId',
    component: MarketplaceAppPage,
    personas: ['builder', 'end_user'],
  },
];

// Route guard component
const ProtectedRoute: React.FC<{ route: RouteConfig; children: React.ReactNode }> = ({
  route,
  children
}) => {
  const { isAuthenticated, persona } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (route.personas && !route.personas.includes(persona!)) {
    return <AccessDenied />;
  }

  return <>{children}</>;
};
```

## Security Implementation

### Permission System

```typescript
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

// Permission checking utilities
export const hasPermission = (userPermissions: string[], requiredPermission: string): boolean => {
  return userPermissions.includes(requiredPermission);
};

export const hasAnyPermission = (userPermissions: string[], requiredPermissions: string[]): boolean => {
  return requiredPermissions.some(permission => userPermissions.includes(permission));
};

export const hasAllPermissions = (userPermissions: string[], requiredPermissions: string[]): boolean => {
  return requiredPermissions.every(permission => userPermissions.includes(permission));
};
```

### Data Isolation

```typescript
// Multi-tenant data filtering
export const createTenantFilter = (userId: string, persona: string) => {
  switch (persona) {
    case 'super_admin':
      return {}; // No filter for super admin
    case 'builder':
      return { builder_id: userId };
    case 'end_user':
      return { end_user_id: userId };
    default:
      throw new Error(`Unknown persona: ${persona}`);
  }
};

// API middleware for data isolation
export const tenantDataMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const { user } = req;
  
  if (!user) {
    return next();
  }

  // Add tenant filter to request
  req.tenantFilter = createTenantFilter(user.id, user.persona);
  next();
};
```

## Testing Strategy

### Unit Tests

```typescript
// Component testing
describe('BuilderDashboard', () => {
  it('should render builder-specific metrics', () => {
    const mockData = {
      revenue: { total: 10000, monthly: 2500 },
      projects: [{ id: '1', name: 'Test Project' }],
      implementations: [{ id: '1', status: 'active' }],
    };

    render(
      <QueryClientProvider client={queryClient}>
        <BuilderDashboard builderId="test-builder" />
      </QueryClientProvider>
    );

    expect(screen.getByText('Revenue Overview')).toBeInTheDocument();
    expect(screen.getByText('Project Portfolio')).toBeInTheDocument();
  });
});

// Hook testing
describe('useBuilder', () => {
  it('should throw error for non-builder users', () => {
    const TestComponent = () => {
      useBuilder();
      return null;
    };

    render(
      <UserProvider value={{ persona: 'end_user' }}>
        <TestComponent />
      </UserProvider>
    );

    expect(console.error).toHaveBeenCalledWith(
      'useBuilder hook can only be used by builders'
    );
  });
});

// Permission testing
describe('Permission System', () => {
  it('should correctly check permissions', () => {
    const userPermissions = ['create_projects', 'view_revenue'];
    
    expect(hasPermission(userPermissions, 'create_projects')).toBe(true);
    expect(hasPermission(userPermissions, 'manage_users')).toBe(false);
  });
});
```

### Integration Tests

```typescript
// API integration testing
describe('Builder API Integration', () => {
  it('should fetch builder dashboard data', async () => {
    const apiClient = new ApiClient('http://localhost:3000');
    const data = await apiClient.getBuilderDashboard('test-builder');
    
    expect(data).toHaveProperty('revenue');
    expect(data).toHaveProperty('projects');
    expect(data).toHaveProperty('implementations');
  });
});

// Workflow testing
describe('Builder Workflow', () => {
  it('should complete full builder workflow', async () => {
    // 1. Login as builder
    await loginAsBuilder();
    
    // 2. Create project
    const project = await createProject();
    
    // 3. Publish to marketplace
    await publishProject(project.id);
    
    // 4. Check revenue tracking
    const revenue = await getRevenue();
    expect(revenue.total).toBeGreaterThan(0);
  });
});
```

## Performance Considerations

### Caching Strategy

```typescript
// React Query configuration for caching
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      retry: 3,
      refetchOnWindowFocus: false,
    },
  },
});

// Optimistic updates for real-time data
const useBuilderDashboard = (builderId: string) => {
  return useQuery({
    queryKey: ['builder-dashboard', builderId],
    queryFn: () => apiClient.getBuilderDashboard(builderId),
    staleTime: 30 * 1000, // 30 seconds for dashboard data
  });
};

// Real-time updates with WebSocket
const useRealTimeUpdates = (builderId: string) => {
  const queryClient = useQueryClient();
  
  useEffect(() => {
    const ws = new WebSocket(`ws://localhost:3000/ws/builder/${builderId}`);
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      queryClient.setQueryData(['builder-dashboard', builderId], data);
    };
    
    return () => ws.close();
  }, [builderId, queryClient]);
};
```

### Code Splitting

```typescript
// Lazy loading for persona-specific components
const BuilderDashboard = lazy(() => import('./pages/BuilderDashboard'));
const EndUserDashboard = lazy(() => import('./pages/EndUserDashboard'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));

// Persona-based component loading
const DashboardRouter: React.FC = () => {
  const { persona } = useAuth();
  
  switch (persona) {
    case 'builder':
      return <BuilderDashboard />;
    case 'end_user':
      return <EndUserDashboard />;
    case 'super_admin':
      return <AdminDashboard />;
    default:
      return <LoadingSpinner />;
  }
};
```

## Deployment Configuration

### Environment Variables

```bash
# Authentication
AUTH_SECRET=your-auth-secret
JWT_SECRET=your-jwt-secret
REFRESH_TOKEN_SECRET=your-refresh-token-secret

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/builderai
REDIS_URL=redis://localhost:6379

# API Configuration
API_BASE_URL=http://localhost:3000
CORS_ORIGIN=http://localhost:5173

# Feature Flags
ENABLE_PERSONA_SWITCHING=true
ENABLE_REAL_TIME_UPDATES=true
ENABLE_USAGE_TRACKING=true

# Monitoring
SENTRY_DSN=your-sentry-dsn
ANALYTICS_KEY=your-analytics-key
```

### Docker Configuration

```dockerfile
# Multi-stage build for optimized production image
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

FROM node:18-alpine AS production

WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY package*.json ./

EXPOSE 3000
CMD ["npm", "start"]
```

---

**Status**: Technical Specification  
**Version**: 1.0.0  
**Last Updated**: December 19, 2024
