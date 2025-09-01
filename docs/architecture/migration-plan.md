# Storage Migration Plan

## Overview

This document outlines the comprehensive migration plan to convert all in-memory storage methods to database storage, ensuring data persistence, scalability, and proper credential management.

## Migration Status

### ✅ Completed
- [x] Database schema design and creation
- [x] Credential management tables
- [x] Basic encryption utilities
- [x] Credential management functions

### 🔄 In Progress
- [ ] Storage migration (Phase 2)

### ❌ Pending
- [ ] API layer implementation
- [ ] Frontend integration
- [ ] Security hardening

## Phase 2: Storage Migration

### Step 1: Project Management Migration

#### Files to Update
- `server/storage.ts` - Convert project methods to database
- `server/routes/marketplace.ts` - Update API endpoints

#### Methods to Migrate
```typescript
// Current in-memory methods
async getProjects(userId: string): Promise<Project[]>
async getAllProjects(): Promise<Project[]>
async getProject(id: string): Promise<Project | undefined>
async createProject(insertProject: InsertProject): Promise<Project>
async updateProject(id: string, updates: Partial<Project>): Promise<Project | undefined>
```

#### Implementation Plan
1. **Convert `getProjects()`** - Query projects table with user filter
2. **Convert `getAllProjects()`** - Query all projects (admin only)
3. **Convert `getProject()`** - Query single project by ID
4. **Convert `createProject()`** - Insert new project with proper validation
5. **Convert `updateProject()`** - Update project with proper validation

### Step 2: MCP Server Management Migration

#### Methods to Migrate
```typescript
// Current in-memory methods
async getMcpServers(userId: string): Promise<McpServer[]>
async getMcpServer(id: string): Promise<McpServer | undefined>
async createMcpServer(insertServer: InsertMcpServer): Promise<McpServer>
async updateMcpServer(id: string, updates: Partial<McpServer>): Promise<McpServer | undefined>
async deleteMcpServer(id: string): Promise<boolean>
```

#### Implementation Plan
1. **Convert to admin-managed model** - MCP servers are now admin-managed, not user-specific
2. **Update `getMcpServers()`** - Query all active MCP servers
3. **Convert `getMcpServer()`** - Query single MCP server by ID
4. **Convert `createMcpServer()`** - Admin-only creation with proper validation
5. **Convert `updateMcpServer()`** - Admin-only updates
6. **Convert `deleteMcpServer()`** - Soft delete with status update

### Step 3: Chat Messages Migration

#### Methods to Migrate
```typescript
// Current in-memory methods
async getChatMessages(userId: string): Promise<ChatMessage[]>
async createChatMessage(insertMessage: InsertChatMessage): Promise<ChatMessage>
```

#### Implementation Plan
1. **Convert `getChatMessages()`** - Query chat_messages table with user filter and ordering
2. **Convert `createChatMessage()`** - Insert new chat message with proper validation

### Step 4: Marketplace Operations Migration

#### Methods to Migrate
```typescript
// Current in-memory methods
async getMarketplaceProjectByProjectId(projectId: string): Promise<MarketplaceProject | undefined>
async createMarketplaceProject(project: InsertMarketplaceProject): Promise<MarketplaceProject>
async updateMarketplaceProject(id: string, updates: Partial<MarketplaceProject>): Promise<MarketplaceProject | undefined>
async deleteMarketplaceProject(id: string): Promise<boolean>
```

#### Implementation Plan
1. **Update for single table design** - Use projects table with marketplace fields
2. **Convert `getMarketplaceProjectByProjectId()`** - Query projects table with marketplace filters
3. **Convert `createMarketplaceProject()`** - Update project with marketplace data
4. **Convert `updateMarketplaceProject()`** - Update marketplace fields in projects table
5. **Convert `deleteMarketplaceProject()`** - Soft delete by updating published status

### Step 5: Marketplace Features Migration

#### Methods to Migrate
```typescript
// Current in-memory methods
async createMarketplacePurchase(purchase: InsertMarketplacePurchase): Promise<MarketplacePurchase>
async getUserPurchase(userId: string, projectId: string): Promise<MarketplacePurchase | undefined>
async getUserPurchases(userId: string): Promise<MarketplacePurchase[]>
async createMarketplaceReview(review: InsertMarketplaceReview): Promise<MarketplaceReview>
async getMarketplaceProjectReviews(projectId: string, options?: { page?: number; limit?: number }): Promise<MarketplaceReview[]>
async getUserProjectReview(userId: string, projectId: string): Promise<MarketplaceReview | undefined>
async createMarketplaceDownload(download: InsertMarketplaceDownload): Promise<MarketplaceDownload>
async generateDownloadToken(projectId: string, userId: string): Promise<string>
async getMarketplaceStats(): Promise<MarketplaceStats>
async createRevenueEvent(event: any): Promise<any>
```

#### Implementation Plan
1. **Create new tables** - Add marketplace_purchases, marketplace_reviews, marketplace_downloads tables
2. **Convert purchase methods** - Implement purchase tracking
3. **Convert review methods** - Implement review system
4. **Convert download methods** - Implement download tracking
5. **Convert analytics methods** - Implement usage statistics

## Migration Strategy

### 1. Incremental Migration
- Migrate one method at a time
- Test each migration thoroughly
- Maintain backward compatibility during transition
- Use feature flags for gradual rollout

### 2. Data Validation
- Validate data integrity after each migration
- Ensure foreign key constraints are maintained
- Verify data consistency between old and new systems

### 3. Error Handling
- Implement proper error handling for database operations
- Add retry logic for transient failures
- Log all migration activities for debugging

### 4. Performance Optimization
- Add appropriate database indexes
- Implement query optimization
- Add caching where appropriate
- Monitor performance metrics

## Testing Strategy

### 1. Unit Tests
- Test each migrated method individually
- Mock database dependencies
- Verify error handling scenarios

### 2. Integration Tests
- Test API endpoints with real database
- Verify data consistency
- Test concurrent access scenarios

### 3. Performance Tests
- Measure response times before and after migration
- Test with realistic data volumes
- Identify performance bottlenecks

### 4. Security Tests
- Verify credential isolation
- Test access control mechanisms
- Validate encryption implementation

## Rollback Plan

### 1. Database Rollback
- Keep backup of original data
- Maintain migration scripts for rollback
- Document rollback procedures

### 2. Code Rollback
- Maintain feature flags for easy rollback
- Keep old implementation as fallback
- Document rollback steps

### 3. Monitoring
- Monitor system health during migration
- Set up alerts for critical issues
- Have rollback triggers ready

## Success Criteria

### 1. Functional Requirements
- All existing functionality works as before
- No data loss during migration
- Performance meets or exceeds previous levels
- Security requirements are maintained

### 2. Technical Requirements
- All database operations use proper transactions
- Error handling is comprehensive
- Logging provides adequate debugging information
- Code follows established patterns

### 3. Business Requirements
- User experience remains unchanged
- Credential management works seamlessly
- Marketplace functionality is preserved
- Admin capabilities are enhanced

## Timeline

### Week 1: Project Management Migration
- Day 1-2: Migrate project CRUD operations
- Day 3-4: Update API endpoints
- Day 5: Testing and validation

### Week 2: MCP Server Migration
- Day 1-2: Migrate MCP server operations
- Day 3-4: Update admin interfaces
- Day 5: Testing and validation

### Week 3: Chat and Marketplace Migration
- Day 1-2: Migrate chat messages
- Day 3-4: Migrate marketplace operations
- Day 5: Testing and validation

### Week 4: Advanced Features Migration
- Day 1-2: Migrate marketplace features
- Day 3-4: Implement analytics
- Day 5: Final testing and deployment

## Risk Mitigation

### 1. Data Loss Risk
- **Risk**: Data corruption during migration
- **Mitigation**: Comprehensive backups, transaction-based migration

### 2. Performance Risk
- **Risk**: Slower performance after migration
- **Mitigation**: Performance testing, query optimization, caching

### 3. Security Risk
- **Risk**: Credential exposure during migration
- **Mitigation**: Encrypted migration, access control validation

### 4. Downtime Risk
- **Risk**: Service interruption during migration
- **Mitigation**: Zero-downtime migration, feature flags, rollback plan

## Monitoring and Validation

### 1. Key Metrics
- Response time for all API endpoints
- Database query performance
- Error rates and types
- User activity patterns

### 2. Validation Checks
- Data integrity verification
- Functionality regression testing
- Performance benchmarking
- Security validation

### 3. Alerting
- Set up alerts for critical failures
- Monitor migration progress
- Track performance degradation
- Alert on security issues
