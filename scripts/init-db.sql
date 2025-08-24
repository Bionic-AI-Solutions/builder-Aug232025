-- BuilderAI Database Initialization Script
-- This script sets up the initial database schema for the BuilderAI application

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    persona VARCHAR(50) NOT NULL CHECK (persona IN ('super_admin', 'builder', 'end_user')),
    roles TEXT[] DEFAULT '{}',
    permissions TEXT[] DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create projects table
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    prompt TEXT,
    llm VARCHAR(100),
    mcp_servers TEXT[] DEFAULT '{}',
    files JSONB DEFAULT '[]',
    status VARCHAR(50) DEFAULT 'development' CHECK (status IN ('development', 'completed', 'published', 'archived')),
    published BOOLEAN DEFAULT false,
    marketplace_price INTEGER DEFAULT 0, -- Price in cents
    marketplace_description TEXT,
    revenue INTEGER DEFAULT 0, -- Revenue in cents
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create mcp_clients table
CREATE TABLE IF NOT EXISTS mcp_clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    connection_string TEXT NOT NULL,
    connection_type VARCHAR(50) NOT NULL CHECK (connection_type IN ('sse', 'stdio', 'websocket', 'grpc')),
    command VARCHAR(500),
    args TEXT[] DEFAULT '{}',
    headers JSONB DEFAULT '{}',
    custom_vars JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create widget_implementations table
CREATE TABLE IF NOT EXISTS widget_implementations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    end_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    customer_id VARCHAR(255),
    configuration JSONB DEFAULT '{}',
    usage_count INTEGER DEFAULT 0,
    last_used TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create revenue_events table
CREATE TABLE IF NOT EXISTS revenue_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    builder_id UUID REFERENCES users(id) ON DELETE SET NULL,
    end_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    event_type VARCHAR(50) NOT NULL CHECK (event_type IN ('purchase', 'usage', 'subscription')),
    amount INTEGER NOT NULL, -- Amount in cents
    currency VARCHAR(3) DEFAULT 'USD',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create template_purchases table
CREATE TABLE IF NOT EXISTS template_purchases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    buyer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL, -- Amount in cents
    currency VARCHAR(3) DEFAULT 'USD',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create usage_events table
CREATE TABLE IF NOT EXISTS usage_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    widget_implementation_id UUID REFERENCES widget_implementations(id) ON DELETE SET NULL,
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    end_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    event_type VARCHAR(50) NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- PHASE 2: MARKETPLACE TABLES
-- ============================================================================

-- Marketplace projects table
CREATE TABLE IF NOT EXISTS marketplace_projects (
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
CREATE TABLE IF NOT EXISTS marketplace_purchases (
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
CREATE TABLE IF NOT EXISTS marketplace_reviews (
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
CREATE TABLE IF NOT EXISTS marketplace_downloads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES marketplace_projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    download_type VARCHAR(50) DEFAULT 'purchase' CHECK (download_type IN ('purchase', 'demo', 'update')),
    downloaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'
);

-- ============================================================================
-- PHASE 2: REVENUE TABLES
-- ============================================================================

-- Enhanced revenue events table (extends existing)
ALTER TABLE revenue_events 
ADD COLUMN IF NOT EXISTS commission_rate DECIMAL(5,4) DEFAULT 0.3000,
ADD COLUMN IF NOT EXISTS builder_share INTEGER,
ADD COLUMN IF NOT EXISTS platform_share INTEGER,
ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'processed', 'paid', 'failed', 'refunded')),
ADD COLUMN IF NOT EXISTS payment_method VARCHAR(100),
ADD COLUMN IF NOT EXISTS processed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP WITH TIME ZONE;

-- Payouts table
CREATE TABLE IF NOT EXISTS payouts (
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
CREATE TABLE IF NOT EXISTS revenue_accounts (
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
CREATE TABLE IF NOT EXISTS commission_rates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rate_type VARCHAR(50) NOT NULL CHECK (rate_type IN ('platform_fee', 'builder_commission')),
    rate DECIMAL(5,4) NOT NULL, -- Rate as decimal (0.3000 = 30%)
    effective_from TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    effective_to TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Revenue analytics table
CREATE TABLE IF NOT EXISTS revenue_analytics (
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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_persona ON users(persona);
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_published ON projects(published);
CREATE INDEX IF NOT EXISTS idx_mcp_clients_active ON mcp_clients(is_active);
CREATE INDEX IF NOT EXISTS idx_widget_implementations_project_id ON widget_implementations(project_id);
CREATE INDEX IF NOT EXISTS idx_widget_implementations_end_user_id ON widget_implementations(end_user_id);
CREATE INDEX IF NOT EXISTS idx_revenue_events_project_id ON revenue_events(project_id);
CREATE INDEX IF NOT EXISTS idx_revenue_events_builder_id ON revenue_events(builder_id);
CREATE INDEX IF NOT EXISTS idx_usage_events_widget_implementation_id ON usage_events(widget_implementation_id);
CREATE INDEX IF NOT EXISTS idx_usage_events_created_at ON usage_events(created_at);

-- Phase 2 indexes
CREATE INDEX IF NOT EXISTS idx_marketplace_projects_builder_id ON marketplace_projects(builder_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_projects_status ON marketplace_projects(status);
CREATE INDEX IF NOT EXISTS idx_marketplace_projects_category ON marketplace_projects(category);
CREATE INDEX IF NOT EXISTS idx_marketplace_projects_featured ON marketplace_projects(featured);
CREATE INDEX IF NOT EXISTS idx_marketplace_projects_rating ON marketplace_projects(rating);
CREATE INDEX IF NOT EXISTS idx_marketplace_projects_published_at ON marketplace_projects(published_at);

CREATE INDEX IF NOT EXISTS idx_marketplace_purchases_buyer_id ON marketplace_purchases(buyer_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_purchases_seller_id ON marketplace_purchases(seller_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_purchases_status ON marketplace_purchases(status);
CREATE INDEX IF NOT EXISTS idx_marketplace_purchases_purchased_at ON marketplace_purchases(purchased_at);

CREATE INDEX IF NOT EXISTS idx_marketplace_reviews_project_id ON marketplace_reviews(project_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_reviews_reviewer_id ON marketplace_reviews(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_reviews_rating ON marketplace_reviews(rating);
CREATE INDEX IF NOT EXISTS idx_marketplace_reviews_created_at ON marketplace_reviews(created_at);

CREATE INDEX IF NOT EXISTS idx_marketplace_downloads_project_id ON marketplace_downloads(project_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_downloads_user_id ON marketplace_downloads(user_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_downloads_downloaded_at ON marketplace_downloads(downloaded_at);

CREATE INDEX IF NOT EXISTS idx_revenue_events_status ON revenue_events(status);
CREATE INDEX IF NOT EXISTS idx_revenue_events_created_at ON revenue_events(created_at);
CREATE INDEX IF NOT EXISTS idx_revenue_events_event_type ON revenue_events(event_type);

CREATE INDEX IF NOT EXISTS idx_payouts_builder_id ON payouts(builder_id);
CREATE INDEX IF NOT EXISTS idx_payouts_status ON payouts(status);
CREATE INDEX IF NOT EXISTS idx_payouts_created_at ON payouts(created_at);
CREATE INDEX IF NOT EXISTS idx_payouts_scheduled_at ON payouts(scheduled_at);

CREATE INDEX IF NOT EXISTS idx_revenue_accounts_user_id ON revenue_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_revenue_accounts_account_type ON revenue_accounts(account_type);

CREATE INDEX IF NOT EXISTS idx_commission_rates_rate_type ON commission_rates(rate_type);
CREATE INDEX IF NOT EXISTS idx_commission_rates_is_active ON commission_rates(is_active);
CREATE INDEX IF NOT EXISTS idx_commission_rates_effective_from ON commission_rates(effective_from);

CREATE INDEX IF NOT EXISTS idx_revenue_analytics_date ON revenue_analytics(date);
CREATE INDEX IF NOT EXISTS idx_revenue_analytics_metric_type ON revenue_analytics(metric_type);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_mcp_clients_updated_at BEFORE UPDATE ON mcp_clients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_widget_implementations_updated_at BEFORE UPDATE ON widget_implementations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Phase 2 triggers
CREATE TRIGGER update_marketplace_projects_updated_at 
    BEFORE UPDATE ON marketplace_projects 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_marketplace_reviews_updated_at 
    BEFORE UPDATE ON marketplace_reviews 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_revenue_accounts_updated_at 
    BEFORE UPDATE ON revenue_accounts 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- PHASE 2: BUSINESS LOGIC FUNCTIONS
-- ============================================================================

-- Function to calculate project rating
CREATE OR REPLACE FUNCTION calculate_project_rating(project_uuid UUID)
RETURNS DECIMAL(3,2) AS $$
DECLARE
    avg_rating DECIMAL(3,2);
BEGIN
    SELECT COALESCE(AVG(rating), 0.00)
    INTO avg_rating
    FROM marketplace_reviews
    WHERE project_id = project_uuid;
    
    RETURN avg_rating;
END;
$$ LANGUAGE plpgsql;

-- Function to update project rating
CREATE OR REPLACE FUNCTION update_project_rating()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE marketplace_projects 
    SET 
        rating = calculate_project_rating(NEW.project_id),
        review_count = (
            SELECT COUNT(*) 
            FROM marketplace_reviews 
            WHERE project_id = NEW.project_id
        ),
        updated_at = NOW()
    WHERE id = NEW.project_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update project rating when review is added/updated/deleted
CREATE TRIGGER update_project_rating_trigger
    AFTER INSERT OR UPDATE OR DELETE ON marketplace_reviews
    FOR EACH ROW EXECUTE FUNCTION update_project_rating();

-- Function to calculate commission
CREATE OR REPLACE FUNCTION calculate_commission(
    amount_cents INTEGER,
    commission_rate DECIMAL(5,4)
)
RETURNS TABLE (
    builder_share INTEGER,
    platform_share INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (amount_cents * (1 - commission_rate))::INTEGER as builder_share,
        (amount_cents * commission_rate)::INTEGER as platform_share;
END;
$$ LANGUAGE plpgsql;

-- Function to get marketplace statistics
CREATE OR REPLACE FUNCTION get_marketplace_stats()
RETURNS TABLE (
    total_projects BIGINT,
    active_projects BIGINT,
    total_sales BIGINT,
    total_revenue BIGINT,
    average_rating DECIMAL(3,2),
    total_reviews BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_projects,
        COUNT(*) FILTER (WHERE status = 'active') as active_projects,
        COUNT(*) FILTER (WHERE status = 'completed') as total_sales,
        COALESCE(SUM(amount), 0) as total_revenue,
        COALESCE(AVG(rating), 0.00) as average_rating,
        COUNT(*) as total_reviews
    FROM marketplace_projects mp
    LEFT JOIN marketplace_purchases mpu ON mp.id = mpu.project_id
    LEFT JOIN marketplace_reviews mr ON mp.id = mr.project_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get revenue statistics
CREATE OR REPLACE FUNCTION get_revenue_stats()
RETURNS TABLE (
    total_revenue BIGINT,
    total_commissions BIGINT,
    total_payouts BIGINT,
    pending_payouts BIGINT,
    active_builders BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(SUM(amount), 0) as total_revenue,
        COALESCE(SUM(platform_share), 0) as total_commissions,
        COALESCE(SUM(amount), 0) FILTER (WHERE status = 'completed') as total_payouts,
        COALESCE(SUM(amount), 0) FILTER (WHERE status = 'pending') as pending_payouts,
        COUNT(DISTINCT builder_id) as active_builders
    FROM revenue_events re
    LEFT JOIN payouts p ON re.builder_id = p.builder_id;
END;
$$ LANGUAGE plpgsql;

-- Insert default super admin user (password: admin123)
INSERT INTO users (email, password_hash, persona, roles, permissions) 
VALUES (
    'admin@builderai.com', 
    crypt('admin123', gen_salt('bf')), 
    'super_admin', 
    ARRAY['admin', 'super_admin'], 
    ARRAY['*']
) ON CONFLICT (email) DO NOTHING;

-- Insert default builder user (password: builder123)
INSERT INTO users (email, password_hash, persona, roles, permissions) 
VALUES (
    'builder@builderai.com', 
    crypt('builder123', gen_salt('bf')), 
    'builder', 
    ARRAY['builder'], 
    ARRAY['create_project', 'edit_project', 'publish_project', 'purchase_project', 'request_payout']
) ON CONFLICT (email) DO NOTHING;

-- Insert default end user (password: user123)
INSERT INTO users (email, password_hash, persona, roles, permissions) 
VALUES (
    'user@builderai.com', 
    crypt('user123', gen_salt('bf')), 
    'end_user', 
    ARRAY['end_user'], 
    ARRAY['purchase_project', 'use_widget']
) ON CONFLICT (email) DO NOTHING;

-- Insert sample MCP clients
INSERT INTO mcp_clients (name, connection_string, connection_type, headers, custom_vars) 
VALUES 
    ('Database Connector', 'sse://api.database-service.com/events', 'sse', '{"Authorization": "Bearer ${API_KEY}", "Content-Type": "application/json"}', '{"API_KEY": "your-database-api-key", "ENVIRONMENT": "production"}'),
    ('File System Manager', 'stdio:///usr/local/bin/file-manager', 'stdio', '{}', '{}'),
    ('Payment Gateway', 'websocket://wss://payment-gateway.com/ws', 'websocket', '{"X-API-Key": "${PAYMENT_API_KEY}", "X-Client-ID": "${CLIENT_ID}"}', '{"PAYMENT_API_KEY": "pk_live_...", "CLIENT_ID": "client_12345"}'),
    ('Analytics Engine', 'grpc://analytics-service:9090', 'grpc', '{"Authorization": "Bearer ${ANALYTICS_TOKEN}"}', '{"ANALYTICS_TOKEN": "analytics_token_123"}')
ON CONFLICT DO NOTHING;

-- Insert default commission rates
INSERT INTO commission_rates (rate_type, rate, effective_from, is_active) 
VALUES 
    ('platform_fee', 0.3000, NOW(), true),
    ('builder_commission', 0.7000, NOW(), true)
ON CONFLICT DO NOTHING;

-- Create revenue accounts for existing users
INSERT INTO revenue_accounts (user_id, account_type, balance, total_earned, total_paid_out, pending_balance)
SELECT 
    id,
    CASE 
        WHEN persona = 'builder' THEN 'builder'
        ELSE 'platform'
    END as account_type,
    0 as balance,
    0 as total_earned,
    0 as total_paid_out,
    0 as pending_balance
FROM users
WHERE id NOT IN (SELECT user_id FROM revenue_accounts);

-- Grant permissions
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO builderai;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO builderai;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO builderai;

-- Create a function to get user statistics
CREATE OR REPLACE FUNCTION get_user_stats()
RETURNS TABLE (
    total_users BIGINT,
    super_admins BIGINT,
    builders BIGINT,
    end_users BIGINT,
    active_users BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_users,
        COUNT(*) FILTER (WHERE persona = 'super_admin') as super_admins,
        COUNT(*) FILTER (WHERE persona = 'builder') as builders,
        COUNT(*) FILTER (WHERE persona = 'end_user') as end_users,
        COUNT(*) FILTER (WHERE is_active = true) as active_users
    FROM users;
END;
$$ LANGUAGE plpgsql;

-- Create a function to get project statistics
CREATE OR REPLACE FUNCTION get_project_stats()
RETURNS TABLE (
    total_projects BIGINT,
    development_projects BIGINT,
    completed_projects BIGINT,
    published_projects BIGINT,
    total_revenue BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_projects,
        COUNT(*) FILTER (WHERE status = 'development') as development_projects,
        COUNT(*) FILTER (WHERE status = 'completed') as completed_projects,
        COUNT(*) FILTER (WHERE published = true) as published_projects,
        COALESCE(SUM(revenue), 0) as total_revenue
    FROM projects;
END;
$$ LANGUAGE plpgsql;

COMMIT;
