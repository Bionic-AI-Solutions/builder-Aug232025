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
    ARRAY['create_project', 'edit_project', 'publish_project']
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
