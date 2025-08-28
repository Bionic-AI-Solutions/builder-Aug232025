# Revised Microservices Architecture

## Overview
Based on the current frontend implementation and comprehensive user journeys, this document outlines the revised microservices architecture that supports all three personas (Super Admin, Builder, End User) and their interactions.

## Current Frontend Analysis

### Pages by Persona

#### Super Admin Pages:
- **Dashboard** (`dashboard.tsx`): Platform metrics, leaderboards, system health
- **Admin** (`admin.tsx`): User management, comprehensive user details
- **Marketplace** (`marketplace.tsx`): Project oversight, hold/activate controls
- **MCP Servers** (`mcp-servers.tsx`): MCP client configuration and management
- **Analytics** (`analytics.tsx`): Platform-wide analytics and monitoring

#### Builder Pages:
- **Dashboard** (`builder-dashboard.tsx`): Personal metrics, project overview
- **Chat Development** (`chat-development.tsx`): AI application creation
- **Projects** (`projects.tsx`): Project management, publishing workflow
- **Marketplace** (`marketplace.tsx`): Template browsing and purchasing
- **Analytics** (`analytics.tsx`): Revenue and usage analytics
- **Billing** (`billing.tsx`): Payment and subscription management

#### End User Pages:
- **Dashboard** (`end-user-dashboard.tsx`): Widget implementations overview
- **Marketplace** (`marketplace.tsx`): Widget browsing and purchasing
- **Widget Implementation** (`widget-implementation.tsx`): Widget integration
- **Analytics** (`analytics.tsx`): Usage and performance analytics
- **Billing** (`billing.tsx`): Payment and subscription management

#### Shared Pages:
- **Login** (`login.tsx`): Authentication and persona selection
- **Analytics** (`analytics.tsx`): Persona-specific analytics
- **Billing** (`billing.tsx`): Persona-specific billing

### Key Components:
- **Project Details Modal**: Comprehensive project information
- **Chat App Modal**: Chat interface for projects
- **Server Config Modal**: MCP server configuration

## Revised Microservices Architecture

### 1. Authentication & Authorization Service
**Purpose**: Handle user authentication, persona management, and access control

**Key Responsibilities**:
- User authentication and session management
- Persona-based access control
- JWT token management
- Role and permission management

**API Endpoints**:
```
POST /api/auth/login
POST /api/auth/logout
GET /api/auth/me
PUT /api/auth/update-persona
POST /api/auth/refresh-token
```

**Data Models**:
- User (id, email, password, persona, roles, permissions, metadata)
- Session (id, userId, token, expiresAt)
- Permission (id, name, description)

### 2. User Management Service
**Purpose**: Manage user profiles, subscriptions, and administrative functions

**Key Responsibilities**:
- User CRUD operations
- Subscription management
- User analytics and metrics
- Administrative user management

**API Endpoints**:
```
GET /api/users
GET /api/users/:id
POST /api/users
PUT /api/users/:id
DELETE /api/users/:id
GET /api/users/:id/projects
GET /api/users/:id/analytics
PUT /api/users/:id/status (suspend/activate)
PUT /api/users/:id/subscription
```

**Data Models**:
- UserProfile (id, userId, name, email, persona, plan, status, createdAt)
- Subscription (id, userId, plan, status, startDate, endDate)
- UserAnalytics (id, userId, metrics, lastActive)

### 3. Project Management Service
**Purpose**: Handle project lifecycle from creation to completion

**Key Responsibilities**:
- Project CRUD operations
- Project status management
- Development workflow
- Project analytics

**API Endpoints**:
```
GET /api/projects
GET /api/projects/:id
POST /api/projects
PUT /api/projects/:id
DELETE /api/projects/:id
GET /api/projects/user/:userId
PUT /api/projects/:id/status
POST /api/projects/:id/chat
GET /api/projects/:id/analytics
```

**Data Models**:
- Project (id, userId, name, description, prompt, status, llm, mcpServers, files, createdAt)
- ProjectFile (id, projectId, name, size, type, content)
- ProjectChat (id, projectId, messages, createdAt)

### 4. MCP Server Management Service
**Purpose**: Manage MCP client configurations and connections

**Key Responsibilities**:
- MCP client CRUD operations
- Connection management
- Server health monitoring
- Configuration management

**API Endpoints**:
```
GET /api/mcp-clients
GET /api/mcp-clients/:id
POST /api/mcp-clients
PUT /api/mcp-clients/:id
DELETE /api/mcp-clients/:id
GET /api/mcp-clients/active
POST /api/mcp-clients/:id/test-connection
PUT /api/mcp-clients/:id/status
```

**Data Models**:
- McpClient (id, name, connectionString, connectionType, command, args, headers, customVars, isActive)
- McpConnection (id, clientId, status, lastConnected, metrics)

### 5. Marketplace Service
**Purpose**: Handle project publishing, purchasing, and marketplace operations

**Key Responsibilities**:
- Project publishing workflow
- Purchase and transaction management
- Marketplace analytics
- Project approval and moderation

**API Endpoints**:
```
GET /api/marketplace/projects
GET /api/marketplace/projects/:id
POST /api/marketplace/projects/:id/publish
PUT /api/marketplace/projects/:id/status (hold/activate)
POST /api/marketplace/purchase
GET /api/marketplace/purchases/user/:userId
GET /api/marketplace/analytics
```

**Data Models**:
- MarketplaceProject (id, projectId, price, description, status, publishedAt)
- Purchase (id, userId, projectId, amount, status, purchasedAt)
- MarketplaceAnalytics (id, metrics, revenue, transactions)

### 6. Widget Service
**Purpose**: Handle widget generation, integration, and management

**Key Responsibilities**:
- Widget code generation
- Integration management
- Widget configuration
- Usage tracking

**API Endpoints**:
```
POST /api/widgets/generate
GET /api/widgets/:id
PUT /api/widgets/:id/config
POST /api/widgets/:id/track-usage
GET /api/widgets/user/:userId
GET /api/widgets/:id/analytics
```

**Data Models**:
- Widget (id, projectId, userId, config, code, status)
- WidgetUsage (id, widgetId, customerId, usage, timestamp)
- WidgetConfig (id, widgetId, settings, appearance)

### 7. Analytics Service
**Purpose**: Provide analytics and insights across all personas

**Key Responsibilities**:
- Data collection and aggregation
- Persona-specific analytics
- Performance metrics
- Business intelligence

**API Endpoints**:
```
GET /api/analytics/platform (Super Admin)
GET /api/analytics/user/:userId (Builder/End User)
GET /api/analytics/projects/:projectId
GET /api/analytics/widgets/:widgetId
GET /api/analytics/revenue
GET /api/analytics/usage
```

**Data Models**:
- Analytics (id, type, data, timestamp)
- RevenueMetrics (id, userId, amount, period, type)
- UsageMetrics (id, entityId, entityType, usage, period)

### 8. Revenue Service
**Purpose**: Handle payment processing and revenue distribution

**Key Responsibilities**:
- Payment processing
- Revenue calculation and distribution
- Billing management
- Financial reporting

**API Endpoints**:
```
POST /api/revenue/calculate
POST /api/revenue/distribute
GET /api/revenue/user/:userId
GET /api/revenue/project/:projectId
POST /api/billing/charge
GET /api/billing/invoices
```

**Data Models**:
- Revenue (id, userId, projectId, amount, type, status, createdAt)
- Payment (id, userId, amount, method, status, processedAt)
- Invoice (id, userId, amount, items, status, dueDate)

### 9. Notification Service
**Purpose**: Handle system notifications and communications

**Key Responsibilities**:
- Email notifications
- In-app notifications
- System alerts
- Communication management

**API Endpoints**:
```
POST /api/notifications/send
GET /api/notifications/user/:userId
PUT /api/notifications/:id/read
POST /api/notifications/broadcast
```

**Data Models**:
- Notification (id, userId, type, title, message, read, createdAt)
- NotificationTemplate (id, type, title, message, variables)

### 10. File Storage Service
**Purpose**: Handle file uploads and storage for knowledge bases

**Key Responsibilities**:
- File upload and storage
- File processing and validation
- Content management
- Storage optimization

**API Endpoints**:
```
POST /api/files/upload
GET /api/files/:id
DELETE /api/files/:id
POST /api/files/process
GET /api/files/project/:projectId
```

**Data Models**:
- File (id, name, size, type, url, projectId, uploadedAt)
- FileProcessing (id, fileId, status, result, processedAt)

## Data Flow Architecture

### 1. User Authentication Flow
```
Login → Auth Service → User Management Service → Dashboard
```

### 2. Project Development Flow
```
Chat Development → Project Service → MCP Service → File Storage Service
```

### 3. Publishing Flow
```
Projects → Project Service → Marketplace Service → Notification Service
```

### 4. Purchase Flow
```
Marketplace → Marketplace Service → Revenue Service → Widget Service
```

### 5. Analytics Flow
```
All Services → Analytics Service → Dashboard/Reports
```

## Integration Patterns

### 1. Service-to-Service Communication
- **Synchronous**: REST APIs for direct requests
- **Asynchronous**: Message queues for events
- **Event-Driven**: Pub/Sub for notifications

### 2. Data Consistency
- **Event Sourcing**: For audit trails
- **Saga Pattern**: For distributed transactions
- **CQRS**: For read/write separation

### 3. Security
- **API Gateway**: Centralized authentication
- **Service Mesh**: Inter-service security
- **Rate Limiting**: Protection against abuse

## Deployment Architecture

### 1. Container Orchestration
- **Kubernetes**: Container management
- **Istio**: Service mesh
- **Helm**: Deployment management

### 2. Database Strategy
- **Database per Service**: Microservices pattern
- **Event Store**: For analytics and audit
- **Caching**: Redis for performance

### 3. Monitoring
- **Prometheus**: Metrics collection
- **Grafana**: Visualization
- **Jaeger**: Distributed tracing

## Implementation Phases

### Phase 1: Core Services
1. Authentication & Authorization Service
2. User Management Service
3. Project Management Service
4. Basic Analytics Service

### Phase 2: Marketplace & Revenue
1. Marketplace Service
2. Revenue Service
3. Enhanced Analytics Service
4. Notification Service

### Phase 3: Advanced Features
1. Widget Service
2. MCP Server Management Service
3. File Storage Service
4. Advanced Analytics

### Phase 4: Optimization
1. Performance optimization
2. Security hardening
3. Monitoring and alerting
4. Scalability improvements
