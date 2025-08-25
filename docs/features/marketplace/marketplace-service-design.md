# Marketplace Service Design Document

## Overview

The Marketplace Service is responsible for managing the project marketplace functionality, including project publishing, purchasing, transaction management, and marketplace analytics. This service enables builders to sell their projects and end users to purchase them.

## Service Architecture

### **Service Responsibilities**
- Project publishing workflow management
- Purchase and transaction processing
- Marketplace analytics and metrics
- Project discovery and search
- Rating and review management
- Revenue tracking and reporting

### **Database Schema**

```sql
-- Marketplace projects table
CREATE TABLE marketplace_projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    builder_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    price INTEGER NOT NULL, -- Price in cents
    category VARCHAR(100),
    tags TEXT[],
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended', 'deleted')),
    featured BOOLEAN DEFAULT false,
    rating DECIMAL(3,2) DEFAULT 0.00,
    review_count INTEGER DEFAULT 0,
    download_count INTEGER DEFAULT 0,
    revenue INTEGER DEFAULT 0, -- Revenue in cents
    published_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'
);

-- Purchase transactions table
CREATE TABLE marketplace_purchases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES marketplace_projects(id) ON DELETE CASCADE,
    buyer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    seller_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL, -- Amount in cents
    currency VARCHAR(3) DEFAULT 'USD',
    status VARCHAR(50) DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
    transaction_id VARCHAR(255),
    payment_method VARCHAR(100),
    purchased_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'
);

-- Reviews and ratings table
CREATE TABLE marketplace_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES marketplace_projects(id) ON DELETE CASCADE,
    reviewer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review_text TEXT,
    helpful_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Project downloads/usage tracking
CREATE TABLE marketplace_downloads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES marketplace_projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    download_type VARCHAR(50) DEFAULT 'purchase' CHECK (download_type IN ('purchase', 'demo', 'update')),
    downloaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'
);
```

## API Endpoints

### **Project Publishing**

#### `POST /api/marketplace/projects`
**Description**: Publish a project to the marketplace

**Request Body**:
```json
{
  "projectId": "uuid",
  "title": "My Awesome Project",
  "description": "A comprehensive project description",
  "price": 2500, // $25.00 in cents
  "category": "business",
  "tags": ["ai", "automation", "productivity"],
  "featured": false
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "marketplaceProject": {
      "id": "uuid",
      "projectId": "uuid",
      "builderId": "uuid",
      "title": "My Awesome Project",
      "description": "A comprehensive project description",
      "price": 2500,
      "category": "business",
      "tags": ["ai", "automation", "productivity"],
      "status": "active",
      "featured": false,
      "rating": 0.00,
      "reviewCount": 0,
      "downloadCount": 0,
      "revenue": 0,
      "publishedAt": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

#### `PUT /api/marketplace/projects/:id`
**Description**: Update a marketplace project

#### `DELETE /api/marketplace/projects/:id`
**Description**: Remove a project from marketplace

### **Project Discovery**

#### `GET /api/marketplace/projects`
**Description**: Get marketplace projects with filtering and pagination

**Query Parameters**:
- `category` - Filter by category
- `tags` - Filter by tags (comma-separated)
- `minPrice` - Minimum price filter
- `maxPrice` - Maximum price filter
- `rating` - Minimum rating filter
- `featured` - Filter featured projects
- `sortBy` - Sort by (price, rating, downloads, date)
- `sortOrder` - Sort order (asc, desc)
- `page` - Page number
- `limit` - Items per page

**Response**:
```json
{
  "success": true,
  "data": {
    "projects": [
      {
        "id": "uuid",
        "title": "My Awesome Project",
        "description": "A comprehensive project description",
        "price": 2500,
        "category": "business",
        "tags": ["ai", "automation"],
        "rating": 4.5,
        "reviewCount": 12,
        "downloadCount": 45,
        "builder": {
          "id": "uuid",
          "name": "John Doe",
          "rating": 4.8
        },
        "publishedAt": "2024-01-15T10:30:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "totalPages": 8
    }
  }
}
```

#### `GET /api/marketplace/projects/:id`
**Description**: Get detailed marketplace project information

#### `GET /api/marketplace/projects/featured`
**Description**: Get featured marketplace projects

### **Purchase Management**

#### `POST /api/marketplace/purchases`
**Description**: Purchase a marketplace project

**Request Body**:
```json
{
  "projectId": "uuid",
  "paymentMethod": "stripe",
  "metadata": {
    "stripePaymentIntentId": "pi_1234567890"
  }
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "purchase": {
      "id": "uuid",
      "projectId": "uuid",
      "buyerId": "uuid",
      "sellerId": "uuid",
      "amount": 2500,
      "currency": "USD",
      "status": "completed",
      "transactionId": "txn_1234567890",
      "paymentMethod": "stripe",
      "purchasedAt": "2024-01-15T10:30:00.000Z"
    },
    "downloadUrl": "/api/marketplace/downloads/project-uuid",
    "accessToken": "download-token-here"
  }
}
```

#### `GET /api/marketplace/purchases`
**Description**: Get user's purchase history

#### `GET /api/marketplace/purchases/:id`
**Description**: Get specific purchase details

### **Reviews and Ratings**

#### `POST /api/marketplace/projects/:id/reviews`
**Description**: Add a review to a marketplace project

**Request Body**:
```json
{
  "rating": 5,
  "reviewText": "Excellent project! Very well documented and easy to use."
}
```

#### `GET /api/marketplace/projects/:id/reviews`
**Description**: Get reviews for a marketplace project

#### `PUT /api/marketplace/reviews/:id`
**Description**: Update a review

#### `DELETE /api/marketplace/reviews/:id`
**Description**: Delete a review

### **Analytics and Metrics**

#### `GET /api/marketplace/analytics/overview`
**Description**: Get marketplace overview analytics (Super Admin only)

**Response**:
```json
{
  "success": true,
  "data": {
    "totalProjects": 150,
    "totalSales": 25000,
    "totalRevenue": 1250000, // $12,500.00 in cents
    "averageRating": 4.2,
    "topCategories": [
      {"category": "business", "count": 45, "revenue": 450000},
      {"category": "productivity", "count": 32, "revenue": 320000}
    ],
    "recentActivity": [
      {
        "type": "purchase",
        "projectTitle": "My Awesome Project",
        "amount": 2500,
        "timestamp": "2024-01-15T10:30:00.000Z"
      }
    ]
  }
}
```

#### `GET /api/marketplace/analytics/builder/:builderId`
**Description**: Get builder-specific analytics

#### `GET /api/marketplace/analytics/project/:projectId`
**Description**: Get project-specific analytics

## Service Implementation

### **Core Components**

#### **1. Project Publishing Workflow**
```typescript
interface ProjectPublishingService {
  publishProject(projectData: PublishProjectRequest): Promise<MarketplaceProject>;
  updateProject(projectId: string, updates: Partial<MarketplaceProject>): Promise<MarketplaceProject>;
  unpublishProject(projectId: string): Promise<void>;
  validateProjectForPublishing(projectId: string): Promise<ValidationResult>;
}
```

#### **2. Purchase Processing**
```typescript
interface PurchaseService {
  processPurchase(purchaseData: PurchaseRequest): Promise<PurchaseResult>;
  validatePurchase(purchaseData: PurchaseRequest): Promise<ValidationResult>;
  generateDownloadToken(projectId: string, userId: string): Promise<string>;
  trackDownload(projectId: string, userId: string, downloadType: string): Promise<void>;
}
```

#### **3. Review Management**
```typescript
interface ReviewService {
  addReview(reviewData: ReviewRequest): Promise<Review>;
  updateReview(reviewId: string, updates: Partial<Review>): Promise<Review>;
  deleteReview(reviewId: string): Promise<void>;
  calculateProjectRating(projectId: string): Promise<number>;
}
```

#### **4. Analytics Engine**
```typescript
interface AnalyticsService {
  getMarketplaceOverview(): Promise<MarketplaceOverview>;
  getBuilderAnalytics(builderId: string): Promise<BuilderAnalytics>;
  getProjectAnalytics(projectId: string): Promise<ProjectAnalytics>;
  trackEvent(eventType: string, eventData: any): Promise<void>;
}
```

### **Integration Points**

#### **1. Project Management Service**
- Fetch project details for publishing
- Validate project completeness
- Update project status when published

#### **2. User Management Service**
- Validate user permissions for publishing
- Get user information for transactions
- Track user activity and analytics

#### **3. Revenue Service**
- Process revenue sharing
- Track commission calculations
- Generate revenue reports

#### **4. Notification Service**
- Notify builders of purchases
- Send purchase confirmations
- Alert on new reviews

## Security and Access Control

### **Persona-Based Permissions**

#### **Super Admin**
- View all marketplace analytics
- Manage featured projects
- Suspend/activate marketplace projects
- Access revenue reports

#### **Builder**
- Publish own projects
- View own project analytics
- Manage own project listings
- Respond to reviews

#### **End User**
- Browse marketplace projects
- Purchase projects
- Leave reviews
- View purchase history

### **Data Validation**
- Project completeness validation
- Price range validation
- Review content moderation
- Purchase validation

## Performance Considerations

### **Caching Strategy**
- Cache popular projects
- Cache category listings
- Cache analytics data
- Cache user purchase history

### **Database Optimization**
- Index on frequently queried fields
- Partition large tables by date
- Optimize complex analytics queries
- Use read replicas for analytics

### **API Optimization**
- Implement pagination for large datasets
- Use GraphQL for complex queries
- Implement request rate limiting
- Optimize image and file delivery

## Testing Strategy

### **Unit Tests**
- Project publishing workflow
- Purchase processing logic
- Review management
- Analytics calculations

### **Integration Tests**
- End-to-end purchase flow
- Project publishing integration
- Analytics data accuracy
- Payment processing

### **Performance Tests**
- Load testing for marketplace browsing
- Concurrent purchase processing
- Analytics query performance
- Cache effectiveness

## Monitoring and Observability

### **Key Metrics**
- Project publishing rate
- Purchase conversion rate
- Average project rating
- Revenue per project
- User engagement metrics

### **Alerts**
- High purchase failure rate
- Low project publishing activity
- Revenue anomalies
- Performance degradation

## Deployment Considerations

### **Environment Configuration**
```env
# Marketplace Service Configuration
MARKETPLACE_DB_URL=postgresql://marketplace:password@localhost:5432/marketplace
MARKETPLACE_REDIS_URL=redis://localhost:6379
MARKETPLACE_CACHE_TTL=3600
MARKETPLACE_MAX_FILE_SIZE=10485760
MARKETPLACE_ALLOWED_FILE_TYPES=zip,tar.gz,rar

# Payment Processing
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
PAYPAL_CLIENT_ID=your-paypal-client-id
PAYPAL_CLIENT_SECRET=your-paypal-client-secret

# Analytics
ANALYTICS_ENABLED=true
ANALYTICS_BATCH_SIZE=100
ANALYTICS_FLUSH_INTERVAL=5000
```

### **Dependencies**
- PostgreSQL for data storage
- Redis for caching
- Stripe/PayPal for payment processing
- MinIO for file storage
- Message queue for async processing

This design document provides a comprehensive foundation for implementing the Marketplace Service as part of the BuilderAI microservices architecture.
