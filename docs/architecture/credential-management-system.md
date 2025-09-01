# Credential Management System Architecture

## Overview

The Credential Management System is designed to securely store and manage user credentials for LLM models and MCP servers, enabling builders to create projects that integrate with external services while maintaining strict isolation between users and proper security practices.

## System Architecture

### 1. Data Model

#### Core Entities

```
┌─────────────────┐    ┌─────────────────────┐    ┌─────────────────┐
│      Users      │    │    LLM Models       │    │   MCP Servers   │
│                 │    │   (Admin Managed)   │    │ (Admin Managed) │
│ - id            │    │ - id                │    │ - id            │
│ - email         │    │ - name              │    │ - name          │
│ - persona       │    │ - provider          │    │ - type          │
│ - roles         │    │ - model             │    │ - url           │
│ - permissions   │    │ - status            │    │ - status        │
└─────────────────┘    └─────────────────────┘    └─────────────────┘
         │                       │                        │
         │                       │                        │
         └───────────────────────┼────────────────────────┘
                                 │
                    ┌─────────────────────┐
                    │  User Credentials   │
                    │                     │
                    │ LLM Credentials     │
                    │ - userId            │
                    │ - llmModelId        │
                    │ - encryptedApiKey   │
                    │ - credentialName    │
                    │                     │
                    │ MCP Credentials     │
                    │ - userId            │
                    │ - mcpServerId       │
                    │ - encryptedClientId │
                    │ - encryptedSecret   │
                    │ - credentialName    │
                    └─────────────────────┘
                                 │
                    ┌─────────────────────┐
                    │     Projects        │
                    │                     │
                    │ - id                │
                    │ - userId            │
                    │ - name              │
                    │ - marketplacePrice  │
                    │ - published         │
                    └─────────────────────┘
                                 │
                    ┌─────────────────────┐
                    │ Project Credentials │
                    │                     │
                    │ - projectId         │
                    │ - llmCredentialId   │
                    │ - mcpCredentialIds  │
                    │ - llmConfiguration  │
                    │ - mcpConfiguration  │
                    └─────────────────────┘
```

#### Credential Types

**LLM Credentials:**
- `encryptedApiKey` - Primary API key for LLM provider
- `encryptedSecretKey` - Secondary key (if required)
- `encryptedOrganizationId` - OpenAI organization ID
- `encryptedProjectId` - Google AI Studio project ID

**MCP Credentials:**
- `encryptedClientId` - OAuth2 client ID
- `encryptedClientSecret` - OAuth2 client secret
- `encryptedAccessToken` - OAuth2 access token
- `encryptedRefreshToken` - OAuth2 refresh token
- `encryptedApiKey` - API key (for non-OAuth services)
- `scopes` - OAuth2 scopes array
- `tokenExpiresAt` - Token expiration timestamp

### 2. Security Design

#### Encryption Strategy

```typescript
// Encryption Flow
User Input → Application Layer Encryption → Database Storage
Database → Application Layer Decryption → User Access
```

**Encryption Implementation:**
- **Development**: Base64 encoding (for demo purposes)
- **Production**: AES-256-GCM with proper key management
- **Key Rotation**: Automatic rotation every 90 days
- **Access Control**: User isolation - users can only access their own credentials

#### Access Control Matrix

| User Type | Can Access | Can Modify | Can Share |
|-----------|------------|------------|-----------|
| Super Admin | All credentials | All credentials | No |
| Builder | Own credentials | Own credentials | No |
| End User | None | None | No |

### 3. MCP Server Integration

#### Supported Services

**Communication Platforms:**
- Gmail (OAuth2)
- WhatsApp Business (OAuth2)
- Slack (OAuth2)
- Discord (OAuth2)
- Twitter/X (OAuth2)
- LinkedIn (OAuth2)

**Productivity Tools:**
- Google Calendar (OAuth2)
- Google Drive (OAuth2)
- Notion (OAuth2)
- GitHub (OAuth2)

#### OAuth2 Flow

```
1. User initiates OAuth2 flow
2. System redirects to service provider
3. User authorizes application
4. Service provider returns authorization code
5. System exchanges code for access token
6. System encrypts and stores credentials
7. User can now use MCP server in projects
```

### 4. Project Integration

#### Credential Association

```typescript
interface ProjectCredential {
  projectId: string;
  llmCredentialId?: string;        // One LLM per project
  mcpCredentialIds: string[];      // Multiple MCP servers
  llmConfiguration: {              // Project-specific LLM settings
    temperature: number;
    maxTokens: number;
    model: string;
  };
  mcpConfiguration: {              // Project-specific MCP settings
    [mcpServerId: string]: {
      customSettings: any;
    };
  };
}
```

#### Usage Tracking

```typescript
interface CredentialUsageLog {
  userId: string;
  projectId?: string;
  llmCredentialId?: string;
  mcpCredentialId?: string;
  operation: string;               // "llm_completion", "mcp_gmail_send"
  tokensUsed?: number;             // For LLM operations
  costInCents?: number;            // Cost tracking
  success: boolean;
  errorMessage?: string;
  requestId?: string;              // For tracing
  userAgent?: string;
  ipAddress?: string;
  createdAt: Date;
}
```

### 5. API Design

#### Credential Management Endpoints

```typescript
// LLM Credentials
POST   /api/credentials/llm                    // Create LLM credential
GET    /api/credentials/llm                    // List user's LLM credentials
GET    /api/credentials/llm/:id                // Get specific LLM credential
PUT    /api/credentials/llm/:id                // Update LLM credential
DELETE /api/credentials/llm/:id                // Delete LLM credential

// MCP Credentials
POST   /api/credentials/mcp                    // Create MCP credential
GET    /api/credentials/mcp                    // List user's MCP credentials
GET    /api/credentials/mcp/:id                // Get specific MCP credential
PUT    /api/credentials/mcp/:id                // Update MCP credential
DELETE /api/credentials/mcp/:id                // Delete MCP credential

// OAuth2 Flow
GET    /api/oauth/:provider/authorize          // Start OAuth2 flow
GET    /api/oauth/:provider/callback           // OAuth2 callback
POST   /api/oauth/:provider/refresh            // Refresh access token

// Project Credentials
POST   /api/projects/:id/credentials           // Associate credentials with project
GET    /api/projects/:id/credentials           // Get project credentials
PUT    /api/projects/:id/credentials           // Update project credentials
DELETE /api/projects/:id/credentials           // Remove credential association

// Usage Analytics
GET    /api/credentials/usage                  // Get usage statistics
GET    /api/credentials/usage/:credentialId    // Get specific credential usage
```

### 6. Database Schema

#### Tables Overview

| Table | Purpose | Key Features |
|-------|---------|--------------|
| `user_llm_credentials` | Store user LLM API keys | Encrypted storage, usage tracking |
| `user_mcp_credentials` | Store user MCP credentials | OAuth2 tokens, encrypted storage |
| `project_credentials` | Link credentials to projects | Many-to-many relationships |
| `credential_usage_log` | Audit trail | Usage tracking, cost monitoring |
| `mcp_server_auth_methods` | OAuth2 configuration | Service-specific settings |

#### Indexes for Performance

```sql
-- User credential lookups
CREATE INDEX idx_user_llm_credentials_user_id ON user_llm_credentials(user_id);
CREATE INDEX idx_user_mcp_credentials_user_id ON user_mcp_credentials(user_id);

-- Active credential filtering
CREATE INDEX idx_user_llm_credentials_active ON user_llm_credentials(is_active);
CREATE INDEX idx_user_mcp_credentials_active ON user_mcp_credentials(is_active);

-- Usage analytics
CREATE INDEX idx_credential_usage_log_user_id ON credential_usage_log(user_id);
CREATE INDEX idx_credential_usage_log_created_at ON credential_usage_log(created_at);
```

### 7. Implementation Phases

#### Phase 1: Core Infrastructure ✅
- [x] Database schema design
- [x] Credential tables creation
- [x] Basic encryption utilities
- [x] Storage layer foundation

#### Phase 2: Storage Migration 🔄
- [ ] Convert all in-memory methods to database
- [ ] Implement credential management functions
- [ ] Add usage logging
- [ ] Update existing APIs

#### Phase 3: API Layer ❌
- [ ] Credential management endpoints
- [ ] OAuth2 flow implementation
- [ ] Project credential association
- [ ] Usage analytics endpoints

#### Phase 4: Frontend Integration ❌
- [ ] Credential management UI
- [ ] OAuth2 integration
- [ ] Project configuration interface
- [ ] Usage monitoring dashboard

#### Phase 5: Security Hardening ❌
- [ ] Production encryption implementation
- [ ] Key rotation automation
- [ ] Access control enforcement
- [ ] Security audit and testing

### 8. Security Considerations

#### Data Protection
- All sensitive data encrypted at rest
- Credentials isolated per user
- No cross-user credential access
- Audit trail for all operations

#### OAuth2 Security
- Secure token storage
- Automatic token refresh
- Scope validation
- CSRF protection

#### Access Control
- User-based credential isolation
- Project-level credential association
- Admin oversight capabilities
- Usage monitoring and alerts

### 9. Monitoring and Analytics

#### Usage Metrics
- Credential usage frequency
- Cost tracking per credential
- Error rates and patterns
- Performance metrics

#### Security Monitoring
- Failed authentication attempts
- Unusual usage patterns
- Token expiration alerts
- Access violation detection

### 10. Future Enhancements

#### Planned Features
- Multi-factor authentication for credential access
- Credential sharing between trusted users
- Advanced usage analytics and reporting
- Integration with more MCP servers
- Automated credential rotation
- Compliance reporting (GDPR, SOC2)

#### Scalability Considerations
- Horizontal scaling for high-traffic scenarios
- Database sharding for large user bases
- Caching layer for frequently accessed credentials
- Microservice architecture for credential management
