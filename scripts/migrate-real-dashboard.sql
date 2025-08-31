-- Real Dashboard Database Migration Script
-- Phase 1: Database Enhancement & Data Migration

-- 1. Add missing user fields to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS name VARCHAR(255),
ADD COLUMN IF NOT EXISTS username VARCHAR(100) UNIQUE,
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS approval_status VARCHAR(50) DEFAULT 'approved' CHECK (approval_status IN ('pending', 'approved', 'rejected')),
ADD COLUMN IF NOT EXISTS plan_type VARCHAR(50) DEFAULT 'free' CHECK (plan_type IN ('free', 'basic', 'pro', 'enterprise'));

-- Create indexes for new fields
CREATE INDEX IF NOT EXISTS idx_users_name ON users(name);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_approval_status ON users(approval_status);
CREATE INDEX IF NOT EXISTS idx_users_plan_type ON users(plan_type);
CREATE INDEX IF NOT EXISTS idx_users_last_login_at ON users(last_login_at);

-- 2. Create materialized views for dashboard analytics

-- Platform-wide metrics view
CREATE MATERIALIZED VIEW IF NOT EXISTS dashboard_platform_metrics AS
SELECT 
    COUNT(DISTINCT u.id) as total_users,
    COUNT(DISTINCT CASE WHEN u.persona = 'super_admin' THEN u.id END) as super_admin_count,
    COUNT(DISTINCT CASE WHEN u.persona = 'builder' THEN u.id END) as builder_count,
    COUNT(DISTINCT CASE WHEN u.persona = 'end_user' THEN u.id END) as end_user_count,
    COUNT(DISTINCT CASE WHEN u.approval_status = 'pending' THEN u.id END) as pending_approvals,
    COUNT(DISTINCT mp.id) as total_marketplace_projects,
    COUNT(DISTINCT p.id) as total_projects,
    COUNT(DISTINCT wi.id) as total_widget_implementations,
    COALESCE(SUM(re.amount), 0) as total_revenue,
    COUNT(DISTINCT ue.id) as total_usage_events,
    AVG(CASE WHEN u.last_login_at > NOW() - INTERVAL '30 days' THEN 1 ELSE 0 END) as active_user_rate_30d
FROM users u
LEFT JOIN marketplace_projects mp ON mp.builder_id = u.id
LEFT JOIN projects p ON p.user_id = u.id
LEFT JOIN widget_implementations wi ON wi.end_user_id = u.id
LEFT JOIN revenue_events re ON re.builder_id = u.id
LEFT JOIN usage_events ue ON ue.end_user_id = u.id;

-- Builder performance view
CREATE MATERIALIZED VIEW IF NOT EXISTS builder_performance AS
SELECT 
    u.id as builder_id,
    u.name as builder_name,
    u.email as builder_email,
    u.persona,
    u.approval_status,
    u.created_at as joined_date,
    u.last_login_at,
    COUNT(DISTINCT mp.id) as projects_created,
    COUNT(DISTINCT mpd.id) as total_downloads,
    COUNT(DISTINCT mpr.id) as total_reviews,
    COALESCE(AVG(mpr.rating), 0) as avg_rating,
    COALESCE(SUM(re.amount), 0) as total_revenue,
    COUNT(DISTINCT wi.id) as widget_implementations,
    COUNT(DISTINCT ue.id) as usage_events_generated
FROM users u
LEFT JOIN marketplace_projects mp ON mp.builder_id = u.id
LEFT JOIN marketplace_downloads mpd ON mpd.project_id = mp.id
LEFT JOIN marketplace_reviews mpr ON mpr.project_id = mp.id
LEFT JOIN revenue_events re ON re.builder_id = u.id
LEFT JOIN widget_implementations wi ON wi.builder_id = u.id
LEFT JOIN usage_events ue ON ue.builder_id = u.id
WHERE u.persona = 'builder'
GROUP BY u.id, u.name, u.email, u.persona, u.approval_status, u.created_at, u.last_login_at;

-- End user activity view
CREATE MATERIALIZED VIEW IF NOT EXISTS end_user_activity AS
SELECT 
    u.id as user_id,
    u.name as user_name,
    u.email as user_email,
    u.persona,
    u.approval_status,
    u.plan_type,
    u.created_at as joined_date,
    u.last_login_at,
    COUNT(DISTINCT p.id) as projects_created,
    COUNT(DISTINCT mp.id) as marketplace_purchases,
    COUNT(DISTINCT wi.id) as widget_implementations,
    COUNT(DISTINCT ue.id) as usage_events,
    COALESCE(SUM(mp.amount), 0) as total_spent,
    COUNT(DISTINCT mpr.id) as reviews_written
FROM users u
LEFT JOIN projects p ON p.user_id = u.id
LEFT JOIN marketplace_purchases mp ON mp.buyer_id = u.id
LEFT JOIN widget_implementations wi ON wi.end_user_id = u.id
LEFT JOIN usage_events ue ON ue.end_user_id = u.id
LEFT JOIN marketplace_reviews mpr ON mpr.reviewer_id = u.id
WHERE u.persona = 'end_user'
GROUP BY u.id, u.name, u.email, u.persona, u.approval_status, u.plan_type, u.created_at, u.last_login_at;

-- Create indexes on materialized views
CREATE INDEX IF NOT EXISTS idx_builder_performance_builder_id ON builder_performance(builder_id);
CREATE INDEX IF NOT EXISTS idx_builder_performance_approval_status ON builder_performance(approval_status);
CREATE INDEX IF NOT EXISTS idx_end_user_activity_user_id ON end_user_activity(user_id);
CREATE INDEX IF NOT EXISTS idx_end_user_activity_plan_type ON end_user_activity(plan_type);

-- 3. Insert comprehensive sample data

-- Insert sample users
INSERT INTO users (id, email, password_hash, name, username, persona, roles, permissions, approval_status, plan_type, avatar_url, last_login_at, created_at, updated_at) VALUES
-- Super Admin Users
('550e8400-e29b-41d4-a716-446655440001', 'admin@builderai.com', '$2b$10$rQZ8N3YqG8K9L2M1N0O9P8Q7R6S5T4U3V2W1X0Y9Z8A7B6C5D4E3F2G1H0I', 'Admin User', 'admin', 'super_admin', ARRAY['admin'], ARRAY['read', 'write', 'delete', 'admin'], 'approved', 'enterprise', 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin', NOW() - INTERVAL '2 hours', NOW() - INTERVAL '30 days', NOW()),
('550e8400-e29b-41d4-a716-446655440002', 'superadmin@builderai.com', '$2b$10$rQZ8N3YqG8K9L2M1N0O9P8Q7R6S5T4U3V2W1X0Y9Z8A7B6C5D4E3F2G1H0I', 'Super Admin', 'superadmin', 'super_admin', ARRAY['admin'], ARRAY['read', 'write', 'delete', 'admin'], 'approved', 'enterprise', 'https://api.dicebear.com/7.x/avataaars/svg?seed=superadmin', NOW() - INTERVAL '1 hour', NOW() - INTERVAL '25 days', NOW()),

-- Builder Users
('550e8400-e29b-41d4-a716-446655440003', 'builder@builderai.com', '$2b$10$rQZ8N3YqG8K9L2M1N0O9P8Q7R6S5T4U3V2W1X0Y9Z8A7B6C5D4E3F2G1H0I', 'John Builder', 'johnbuilder', 'builder', ARRAY['builder'], ARRAY['read', 'write'], 'approved', 'pro', 'https://api.dicebear.com/7.x/avataaars/svg?seed=johnbuilder', NOW() - INTERVAL '30 minutes', NOW() - INTERVAL '20 days', NOW()),
('550e8400-e29b-41d4-a716-446655440004', 'sarah@builderai.com', '$2b$10$rQZ8N3YqG8K9L2M1N0O9P8Q7R6S5T4U3V2W1X0Y9Z8A7B6C5D4E3F2G1H0I', 'Sarah Developer', 'sarahdev', 'builder', ARRAY['builder'], ARRAY['read', 'write'], 'approved', 'pro', 'https://api.dicebear.com/7.x/avataaars/svg?seed=sarahdev', NOW() - INTERVAL '2 hours', NOW() - INTERVAL '15 days', NOW()),
('550e8400-e29b-41d4-a716-446655440005', 'mike@builderai.com', '$2b$10$rQZ8N3YqG8K9L2M1N0O9P8Q7R6S5T4U3V2W1X0Y9Z8A7B6C5D4E3F2G1H0I', 'Mike Creator', 'mikecreator', 'builder', ARRAY['builder'], ARRAY['read', 'write'], 'pending', 'basic', 'https://api.dicebear.com/7.x/avataaars/svg?seed=mikecreator', NOW() - INTERVAL '1 day', NOW() - INTERVAL '5 days', NOW()),
('550e8400-e29b-41d4-a716-446655440006', 'lisa@builderai.com', '$2b$10$rQZ8N3YqG8K9L2M1N0O9P8Q7R6S5T4U3V2W1X0Y9Z8A7B6C5D4E3F2G1H0I', 'Lisa Designer', 'lisadesigner', 'builder', ARRAY['builder'], ARRAY['read', 'write'], 'approved', 'enterprise', 'https://api.dicebear.com/7.x/avataaars/svg?seed=lisadesigner', NOW() - INTERVAL '4 hours', NOW() - INTERVAL '12 days', NOW()),

-- End User Users
('550e8400-e29b-41d4-a716-446655440007', 'user@builderai.com', '$2b$10$rQZ8N3YqG8K9L2M1N0O9P8Q7R6S5T4U3V2W1X0Y9Z8A7B6C5D4E3F2G1H0I', 'End User', 'enduser', 'end_user', ARRAY['user'], ARRAY['read'], 'approved', 'free', 'https://api.dicebear.com/7.x/avataaars/svg?seed=enduser', NOW() - INTERVAL '1 hour', NOW() - INTERVAL '10 days', NOW()),
('550e8400-e29b-41d4-a716-446655440008', 'alice@example.com', '$2b$10$rQZ8N3YqG8K9L2M1N0O9P8Q7R6S5T4U3V2W1X0Y9Z8A7B6C5D4E3F2G1H0I', 'Alice Johnson', 'alicej', 'end_user', ARRAY['user'], ARRAY['read'], 'approved', 'basic', 'https://api.dicebear.com/7.x/avataaars/svg?seed=alicej', NOW() - INTERVAL '3 hours', NOW() - INTERVAL '8 days', NOW()),
('550e8400-e29b-41d4-a716-446655440009', 'bob@example.com', '$2b$10$rQZ8N3YqG8K9L2M1N0O9P8Q7R6S5T4U3V2W1X0Y9Z8A7B6C5D4E3F2G1H0I', 'Bob Smith', 'bobsmith', 'end_user', ARRAY['user'], ARRAY['read'], 'approved', 'pro', 'https://api.dicebear.com/7.x/avataaars/svg?seed=bobsmith', NOW() - INTERVAL '6 hours', NOW() - INTERVAL '6 days', NOW()),
('550e8400-e29b-41d4-a716-446655440010', 'carol@example.com', '$2b$10$rQZ8N3YqG8K9L2M1N0O9P8Q7R6S5T4U3V2W1X0Y9Z8A7B6C5D4E3F2G1H0I', 'Carol Wilson', 'carolw', 'end_user', ARRAY['user'], ARRAY['read'], 'pending', 'free', 'https://api.dicebear.com/7.x/avataaars/svg?seed=carolw', NOW() - INTERVAL '2 days', NOW() - INTERVAL '3 days', NOW()),
('550e8400-e29b-41d4-a716-446655440011', 'david@example.com', '$2b$10$rQZ8N3YqG8K9L2M1N0O9P8Q7R6S5T4U3V2W1X0Y9Z8A7B6C5D4E3F2G1H0I', 'David Brown', 'davidb', 'end_user', ARRAY['user'], ARRAY['read'], 'approved', 'enterprise', 'https://api.dicebear.com/7.x/avataaars/svg?seed=davidb', NOW() - INTERVAL '12 hours', NOW() - INTERVAL '1 day', NOW());

-- Insert sample marketplace projects
INSERT INTO marketplace_projects (id, title, description, builder_id, price, category, tags, download_count, rating, status, created_at, updated_at) VALUES
('mp-001', 'AI Chat Widget', 'Advanced AI-powered chat widget with natural language processing', '550e8400-e29b-41d4-a716-446655440003', 99.99, 'widgets', ARRAY['ai', 'chat', 'nlp'], 45, 4.8, 'published', NOW() - INTERVAL '15 days', NOW()),
('mp-002', 'E-commerce Analytics Dashboard', 'Comprehensive analytics dashboard for e-commerce businesses', '550e8400-e29b-41d4-a716-446655440004', 149.99, 'dashboards', ARRAY['analytics', 'ecommerce', 'dashboard'], 32, 4.6, 'published', NOW() - INTERVAL '12 days', NOW()),
('mp-003', 'Social Media Integration Tool', 'Multi-platform social media integration and management tool', '550e8400-e29b-41d4-a716-446655440006', 79.99, 'integrations', ARRAY['social', 'media', 'integration'], 28, 4.4, 'published', NOW() - INTERVAL '10 days', NOW()),
('mp-004', 'Customer Support Ticket System', 'Complete customer support ticket management system', '550e8400-e29b-41d4-a716-446655440003', 199.99, 'support', ARRAY['support', 'tickets', 'customer'], 18, 4.9, 'published', NOW() - INTERVAL '8 days', NOW()),
('mp-005', 'Inventory Management System', 'Real-time inventory tracking and management solution', '550e8400-e29b-41d4-a716-446655440004', 299.99, 'inventory', ARRAY['inventory', 'management', 'tracking'], 12, 4.7, 'published', NOW() - INTERVAL '5 days', NOW());

-- Insert sample projects
INSERT INTO projects (id, name, description, user_id, status, created_at, updated_at) VALUES
('p-001', 'My First Project', 'A simple test project', '550e8400-e29b-41d4-a716-446655440007', 'active', NOW() - INTERVAL '8 days', NOW()),
('p-002', 'E-commerce Website', 'Online store with payment integration', '550e8400-e29b-41d4-a716-446655440008', 'active', NOW() - INTERVAL '6 days', NOW()),
('p-003', 'Blog Platform', 'Content management system for blogs', '550e8400-e29b-41d4-a716-446655440009', 'active', NOW() - INTERVAL '4 days', NOW()),
('p-004', 'Portfolio Site', 'Personal portfolio website', '550e8400-e29b-41d4-a716-446655440010', 'draft', NOW() - INTERVAL '2 days', NOW()),
('p-005', 'Business Dashboard', 'Analytics dashboard for business metrics', '550e8400-e29b-41d4-a716-446655440011', 'active', NOW() - INTERVAL '1 day', NOW());

-- Insert sample widget implementations
INSERT INTO widget_implementations (id, widget_name, end_user_id, builder_id, project_id, status, implementation_date, created_at, updated_at) VALUES
('wi-001', 'AI Chat Widget', '550e8400-e29b-41d4-a716-446655440008', '550e8400-e29b-41d4-a716-446655440003', 'p-002', 'active', NOW() - INTERVAL '5 days', NOW(), NOW()),
('wi-002', 'Analytics Dashboard', '550e8400-e29b-41d4-a716-446655440009', '550e8400-e29b-41d4-a716-446655440004', 'p-003', 'active', NOW() - INTERVAL '3 days', NOW(), NOW()),
('wi-003', 'Social Media Tool', '550e8400-e29b-41d4-a716-446655440011', '550e8400-e29b-41d4-a716-446655440006', 'p-005', 'active', NOW() - INTERVAL '1 day', NOW(), NOW());

-- Insert sample revenue events
INSERT INTO revenue_events (id, builder_id, end_user_id, amount, currency, event_type, description, created_at) VALUES
('re-001', '550e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440008', 99.99, 'USD', 'purchase', 'AI Chat Widget purchase', NOW() - INTERVAL '5 days'),
('re-002', '550e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440009', 149.99, 'USD', 'purchase', 'E-commerce Analytics Dashboard purchase', NOW() - INTERVAL '3 days'),
('re-003', '550e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440011', 79.99, 'USD', 'purchase', 'Social Media Integration Tool purchase', NOW() - INTERVAL '1 day'),
('re-004', '550e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440010', 199.99, 'USD', 'purchase', 'Customer Support Ticket System purchase', NOW() - INTERVAL '12 hours');

-- Insert sample usage events
INSERT INTO usage_events (id, end_user_id, builder_id, event_type, event_data, created_at) VALUES
('ue-001', '550e8400-e29b-41d4-a716-446655440008', '550e8400-e29b-41d4-a716-446655440003', 'widget_used', '{"widget": "ai_chat", "duration": 300}', NOW() - INTERVAL '4 days'),
('ue-002', '550e8400-e29b-41d4-a716-446655440009', '550e8400-e29b-41d4-a716-446655440004', 'dashboard_viewed', '{"dashboard": "analytics", "views": 15}', NOW() - INTERVAL '2 days'),
('ue-003', '550e8400-e29b-41d4-a716-446655440011', '550e8400-e29b-41d4-a716-446655440006', 'integration_used', '{"integration": "social_media", "posts": 8}', NOW() - INTERVAL '1 day'),
('ue-004', '550e8400-e29b-41d4-a716-446655440008', '550e8400-e29b-41d4-a716-446655440003', 'widget_used', '{"widget": "ai_chat", "duration": 450}', NOW() - INTERVAL '12 hours'),
('ue-005', '550e8400-e29b-41d4-a716-446655440009', '550e8400-e29b-41d4-a716-446655440004', 'dashboard_viewed', '{"dashboard": "analytics", "views": 8}', NOW() - INTERVAL '6 hours');

-- Insert sample marketplace purchases
INSERT INTO marketplace_purchases (id, buyer_id, seller_id, project_id, amount, currency, status, created_at) VALUES
('mp-001', '550e8400-e29b-41d4-a716-446655440008', '550e8400-e29b-41d4-a716-446655440003', 'mp-001', 99.99, 'USD', 'completed', NOW() - INTERVAL '5 days'),
('mp-002', '550e8400-e29b-41d4-a716-446655440009', '550e8400-e29b-41d4-a716-446655440004', 'mp-002', 149.99, 'USD', 'completed', NOW() - INTERVAL '3 days'),
('mp-003', '550e8400-e29b-41d4-a716-446655440011', '550e8400-e29b-41d4-a716-446655440006', 'mp-003', 79.99, 'USD', 'completed', NOW() - INTERVAL '1 day'),
('mp-004', '550e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440003', 'mp-004', 199.99, 'USD', 'completed', NOW() - INTERVAL '12 hours');

-- Insert sample marketplace reviews
INSERT INTO marketplace_reviews (id, reviewer_id, project_id, rating, review_text, created_at) VALUES
('mr-001', '550e8400-e29b-41d4-a716-446655440008', 'mp-001', 5, 'Excellent AI chat widget! Very easy to integrate and customize.', NOW() - INTERVAL '4 days'),
('mr-002', '550e8400-e29b-41d4-a716-446655440009', 'mp-002', 4, 'Great analytics dashboard with comprehensive features.', NOW() - INTERVAL '2 days'),
('mr-003', '550e8400-e29b-41d4-a716-446655440011', 'mp-003', 4, 'Good social media integration tool. Could use more platforms.', NOW() - INTERVAL '1 day'),
('mr-004', '550e8400-e29b-41d4-a716-446655440010', 'mp-004', 5, 'Amazing support ticket system! Highly recommended.', NOW() - INTERVAL '12 hours');

-- Insert sample marketplace downloads
INSERT INTO marketplace_downloads (id, user_id, project_id, download_date, created_at) VALUES
('md-001', '550e8400-e29b-41d4-a716-446655440008', 'mp-001', NOW() - INTERVAL '5 days', NOW()),
('md-002', '550e8400-e29b-41d4-a716-446655440009', 'mp-002', NOW() - INTERVAL '3 days', NOW()),
('md-003', '550e8400-e29b-41d4-a716-446655440011', 'mp-003', NOW() - INTERVAL '1 day', NOW()),
('md-004', '550e8400-e29b-41d4-a716-446655440010', 'mp-004', NOW() - INTERVAL '12 hours', NOW()),
('md-005', '550e8400-e29b-41d4-a716-446655440007', 'mp-001', NOW() - INTERVAL '6 days', NOW()),
('md-006', '550e8400-e29b-41d4-a716-446655440008', 'mp-002', NOW() - INTERVAL '4 days', NOW());

-- Refresh materialized views
REFRESH MATERIALIZED VIEW dashboard_platform_metrics;
REFRESH MATERIALIZED VIEW builder_performance;
REFRESH MATERIALIZED VIEW end_user_activity;

-- Display summary
SELECT 'Migration completed successfully!' as status;
SELECT COUNT(*) as total_users FROM users;
SELECT COUNT(*) as total_projects FROM marketplace_projects;
SELECT COUNT(*) as total_revenue_events FROM revenue_events;


