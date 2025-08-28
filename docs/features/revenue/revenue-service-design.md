# Revenue Service Design Document

## Overview

The Revenue Service is responsible for managing all revenue-related operations including revenue tracking, commission calculations, payout processing, and financial reporting. This service handles the monetization aspects of the BuilderAI platform.

## Service Architecture

### **Service Responsibilities**
- Revenue tracking and aggregation
- Commission calculation and distribution
- Payout processing and management
- Financial reporting and analytics
- Revenue sharing between platform and builders
- Tax calculation and compliance
- Revenue event processing

### **Database Schema**

```sql
-- Revenue events table
CREATE TABLE revenue_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_type VARCHAR(50) NOT NULL CHECK (event_type IN ('purchase', 'subscription', 'usage', 'refund', 'commission')),
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    builder_id UUID REFERENCES users(id) ON DELETE SET NULL,
    buyer_id UUID REFERENCES users(id) ON DELETE SET NULL,
    amount INTEGER NOT NULL, -- Amount in cents
    currency VARCHAR(3) DEFAULT 'USD',
    commission_rate DECIMAL(5,4) DEFAULT 0.3000, -- 30% platform fee
    builder_share INTEGER NOT NULL, -- Builder's share in cents
    platform_share INTEGER NOT NULL, -- Platform's share in cents
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'processed', 'paid', 'failed', 'refunded')),
    payment_method VARCHAR(100),
    transaction_id VARCHAR(255),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE,
    paid_at TIMESTAMP WITH TIME ZONE
);

-- Payouts table
CREATE TABLE payouts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    builder_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL, -- Amount in cents
    currency VARCHAR(3) DEFAULT 'USD',
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
    payment_method VARCHAR(100),
    payout_method VARCHAR(100), -- bank_transfer, paypal, stripe_connect
    account_details JSONB, -- Encrypted account information
    transaction_id VARCHAR(255),
    scheduled_at TIMESTAMP WITH TIME ZONE,
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'
);

-- Revenue accounts table
CREATE TABLE revenue_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    account_type VARCHAR(50) NOT NULL CHECK (account_type IN ('builder', 'platform')),
    balance INTEGER DEFAULT 0, -- Balance in cents
    currency VARCHAR(3) DEFAULT 'USD',
    total_earned INTEGER DEFAULT 0, -- Total earned in cents
    total_paid_out INTEGER DEFAULT 0, -- Total paid out in cents
    pending_balance INTEGER DEFAULT 0, -- Pending balance in cents
    last_payout_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Commission rates table
CREATE TABLE commission_rates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rate_type VARCHAR(50) NOT NULL CHECK (rate_type IN ('platform_fee', 'builder_commission')),
    rate DECIMAL(5,4) NOT NULL, -- Rate as decimal (0.3000 = 30%)
    effective_from TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    effective_to TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Revenue analytics table
CREATE TABLE revenue_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE NOT NULL,
    metric_type VARCHAR(50) NOT NULL CHECK (metric_type IN ('daily', 'weekly', 'monthly')),
    total_revenue INTEGER DEFAULT 0,
    total_commissions INTEGER DEFAULT 0,
    total_payouts INTEGER DEFAULT 0,
    active_builders INTEGER DEFAULT 0,
    transaction_count INTEGER DEFAULT 0,
    average_transaction_value INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(date, metric_type)
);
```

## API Endpoints

### **Revenue Tracking**

#### `POST /api/revenue/events`
**Description**: Create a new revenue event

**Request Body**:
```json
{
  "eventType": "purchase",
  "projectId": "uuid",
  "builderId": "uuid",
  "buyerId": "uuid",
  "amount": 2500, // $25.00 in cents
  "currency": "USD",
  "paymentMethod": "stripe",
  "transactionId": "txn_1234567890",
  "metadata": {
    "stripePaymentIntentId": "pi_1234567890",
    "projectTitle": "My Awesome Project"
  }
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "revenueEvent": {
      "id": "uuid",
      "eventType": "purchase",
      "projectId": "uuid",
      "builderId": "uuid",
      "buyerId": "uuid",
      "amount": 2500,
      "currency": "USD",
      "commissionRate": 0.3000,
      "builderShare": 1750, // $17.50
      "platformShare": 750, // $7.50
      "status": "pending",
      "paymentMethod": "stripe",
      "transactionId": "txn_1234567890",
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

#### `GET /api/revenue/events`
**Description**: Get revenue events with filtering

**Query Parameters**:
- `eventType` - Filter by event type
- `builderId` - Filter by builder
- `projectId` - Filter by project
- `status` - Filter by status
- `startDate` - Start date filter
- `endDate` - End date filter
- `page` - Page number
- `limit` - Items per page

#### `GET /api/revenue/events/:id`
**Description**: Get specific revenue event details

### **Revenue Accounts**

#### `GET /api/revenue/accounts/:userId`
**Description**: Get user's revenue account information

**Response**:
```json
{
  "success": true,
  "data": {
    "revenueAccount": {
      "id": "uuid",
      "userId": "uuid",
      "accountType": "builder",
      "balance": 17500, // $175.00
      "currency": "USD",
      "totalEarned": 50000, // $500.00
      "totalPaidOut": 32500, // $325.00
      "pendingBalance": 17500, // $175.00
      "lastPayoutAt": "2024-01-01T10:00:00.000Z",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

#### `POST /api/revenue/accounts/:userId/withdraw`
**Description**: Request a withdrawal from revenue account

**Request Body**:
```json
{
  "amount": 10000, // $100.00 in cents
  "payoutMethod": "paypal",
  "accountDetails": {
    "paypalEmail": "builder@example.com"
  }
}
```

### **Payout Management**

#### `POST /api/revenue/payouts`
**Description**: Create a new payout request

**Request Body**:
```json
{
  "builderId": "uuid",
  "amount": 10000, // $100.00 in cents
  "payoutMethod": "paypal",
  "accountDetails": {
    "paypalEmail": "builder@example.com"
  },
  "scheduledAt": "2024-01-20T10:00:00.000Z"
}
```

#### `GET /api/revenue/payouts`
**Description**: Get payout history

#### `GET /api/revenue/payouts/:id`
**Description**: Get specific payout details

#### `PUT /api/revenue/payouts/:id/status`
**Description**: Update payout status

**Request Body**:
```json
{
  "status": "completed",
  "transactionId": "payout_1234567890"
}
```

### **Analytics and Reporting**

#### `GET /api/revenue/analytics/overview`
**Description**: Get revenue overview analytics (Super Admin only)

**Response**:
```json
{
  "success": true,
  "data": {
    "overview": {
      "totalRevenue": 1250000, // $12,500.00
      "totalCommissions": 375000, // $3,750.00
      "totalPayouts": 300000, // $3,000.00
      "pendingPayouts": 75000, // $750.00
      "activeBuilders": 45,
      "averageCommissionRate": 0.3000,
      "monthlyGrowth": 0.15 // 15% growth
    },
    "recentActivity": [
      {
        "type": "purchase",
        "amount": 2500,
        "builderShare": 1750,
        "platformShare": 750,
        "timestamp": "2024-01-15T10:30:00.000Z"
      }
    ]
  }
}
```

#### `GET /api/revenue/analytics/builder/:builderId`
**Description**: Get builder-specific revenue analytics

**Response**:
```json
{
  "success": true,
  "data": {
    "builderAnalytics": {
      "totalEarned": 50000, // $500.00
      "totalPaidOut": 32500, // $325.00
      "pendingBalance": 17500, // $175.00
      "totalProjects": 5,
      "totalSales": 25,
      "averageSaleValue": 2000, // $20.00
      "commissionRate": 0.7000, // 70% builder share
      "monthlyEarnings": [
        {"month": "2024-01", "earnings": 15000},
        {"month": "2024-02", "earnings": 20000}
      ]
    }
  }
}
```

#### `GET /api/revenue/analytics/platform`
**Description**: Get platform revenue analytics (Super Admin only)

#### `GET /api/revenue/reports/monthly`
**Description**: Generate monthly revenue report

### **Commission Management**

#### `GET /api/revenue/commission-rates`
**Description**: Get current commission rates

#### `PUT /api/revenue/commission-rates`
**Description**: Update commission rates (Super Admin only)

**Request Body**:
```json
{
  "platformFee": 0.3000, // 30% platform fee
  "effectiveFrom": "2024-02-01T00:00:00.000Z"
}
```

## Service Implementation

### **Core Components**

#### **1. Revenue Event Processing**
```typescript
interface RevenueEventService {
  createEvent(eventData: RevenueEventRequest): Promise<RevenueEvent>;
  processEvent(eventId: string): Promise<void>;
  calculateCommissions(amount: number, commissionRate: number): CommissionCalculation;
  validateEvent(eventData: RevenueEventRequest): Promise<ValidationResult>;
}
```

#### **2. Account Management**
```typescript
interface RevenueAccountService {
  getAccount(userId: string): Promise<RevenueAccount>;
  updateBalance(userId: string, amount: number, operation: 'add' | 'subtract'): Promise<void>;
  calculatePendingBalance(userId: string): Promise<number>;
  validateWithdrawal(userId: string, amount: number): Promise<ValidationResult>;
}
```

#### **3. Payout Processing**
```typescript
interface PayoutService {
  createPayout(payoutData: PayoutRequest): Promise<Payout>;
  processPayout(payoutId: string): Promise<void>;
  validatePayout(payoutData: PayoutRequest): Promise<ValidationResult>;
  getPayoutHistory(userId: string): Promise<Payout[]>;
}
```

#### **4. Analytics Engine**
```typescript
interface RevenueAnalyticsService {
  getOverview(): Promise<RevenueOverview>;
  getBuilderAnalytics(builderId: string): Promise<BuilderRevenueAnalytics>;
  getPlatformAnalytics(): Promise<PlatformRevenueAnalytics>;
  generateReport(reportType: string, dateRange: DateRange): Promise<RevenueReport>;
}
```

### **Integration Points**

#### **1. Marketplace Service**
- Process purchase revenue events
- Calculate commissions on sales
- Track project-specific revenue

#### **2. User Management Service**
- Validate user permissions for revenue access
- Get user account information
- Track user revenue metrics

#### **3. Payment Processing Service**
- Integrate with payment gateways
- Process payout transactions
- Handle payment failures and refunds

#### **4. Notification Service**
- Notify builders of revenue events
- Send payout confirmations
- Alert on payment failures

## Security and Access Control

### **Persona-Based Permissions**

#### **Super Admin**
- View all revenue analytics
- Manage commission rates
- Process all payouts
- Access financial reports
- Configure revenue settings

#### **Builder**
- View own revenue account
- Request payouts
- View own revenue analytics
- Access transaction history

#### **End User**
- No direct revenue access
- Purchase transactions only

### **Data Security**
- Encrypt sensitive financial data
- Implement audit logging
- Secure payout account details
- PCI compliance for payment data

## Performance Considerations

### **Caching Strategy**
- Cache revenue account balances
- Cache analytics data
- Cache commission rates
- Cache user revenue metrics

### **Database Optimization**
- Index on frequently queried fields
- Partition large tables by date
- Optimize analytics queries
- Use read replicas for reporting

### **API Optimization**
- Implement pagination for large datasets
- Use GraphQL for complex queries
- Implement request rate limiting
- Optimize real-time calculations

## Testing Strategy

### **Unit Tests**
- Revenue event processing
- Commission calculations
- Payout processing
- Analytics calculations

### **Integration Tests**
- End-to-end revenue flow
- Payment processing integration
- Analytics data accuracy
- Payout processing

### **Performance Tests**
- High-volume revenue processing
- Concurrent payout processing
- Analytics query performance
- Cache effectiveness

## Monitoring and Observability

### **Key Metrics**
- Total revenue
- Commission rates
- Payout success rate
- Revenue growth rate
- Builder earnings distribution

### **Alerts**
- High payout failure rate
- Revenue anomalies
- Commission calculation errors
- Performance degradation

## Deployment Considerations

### **Environment Configuration**
```env
# Revenue Service Configuration
REVENUE_DB_URL=postgresql://revenue:password@localhost:5432/revenue
REVENUE_REDIS_URL=redis://localhost:6379
REVENUE_CACHE_TTL=3600

# Payment Processing
STRIPE_SECRET_KEY=sk_test_...
STRIPE_CONNECT_CLIENT_ID=ca_...
PAYPAL_CLIENT_ID=your-paypal-client-id
PAYPAL_CLIENT_SECRET=your-paypal-client-secret

# Commission Rates
DEFAULT_PLATFORM_FEE=0.3000
DEFAULT_BUILDER_COMMISSION=0.7000

# Payout Settings
MIN_PAYOUT_AMOUNT=1000
PAYOUT_SCHEDULE=daily
PAYOUT_METHODS=paypal,stripe_connect,bank_transfer

# Analytics
ANALYTICS_ENABLED=true
ANALYTICS_BATCH_SIZE=100
ANALYTICS_FLUSH_INTERVAL=5000
```

### **Dependencies**
- PostgreSQL for data storage
- Redis for caching
- Stripe Connect for payouts
- PayPal for payouts
- Message queue for async processing

## Compliance and Legal

### **Financial Compliance**
- PCI DSS compliance for payment data
- Tax calculation and reporting
- Financial audit trails
- Data retention policies

### **Regulatory Requirements**
- Revenue recognition standards
- Commission disclosure requirements
- Payout processing regulations
- Financial reporting standards

This design document provides a comprehensive foundation for implementing the Revenue Service as part of the BuilderAI microservices architecture.
