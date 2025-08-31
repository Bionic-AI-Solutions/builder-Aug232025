-- Real Dashboard Database Migration Script (Corrected)
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
LEFT JOIN widget_implementations wi ON wi.project_id IN (SELECT id FROM projects WHERE user_id = u.id)
LEFT JOIN usage_events ue ON ue.widget_implementation_id IN (SELECT id FROM widget_implementations WHERE project_id IN (SELECT id FROM projects WHERE user_id = u.id))
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

-- First, let's create some projects that marketplace_projects can reference
INSERT INTO projects (id, name, description, user_id, status, created_at, updated_at) VALUES
(gen_random_uuid(), 'AI Chat Widget Project', 'Advanced AI-powered chat widget with natural language processing', '550e8400-e29b-41d4-a716-446655440003', 'active', NOW() - INTERVAL '15 days', NOW()),
(gen_random_uuid(), 'E-commerce Analytics Project', 'Comprehensive analytics dashboard for e-commerce businesses', '550e8400-e29b-41d4-a716-446655440004', 'active', NOW() - INTERVAL '12 days', NOW()),
(gen_random_uuid(), 'Social Media Integration Project', 'Multi-platform social media integration and management tool', '550e8400-e29b-41d4-a716-446655440006', 'active', NOW() - INTERVAL '10 days', NOW()),
(gen_random_uuid(), 'Customer Support Project', 'Complete customer support ticket management system', '550e8400-e29b-41d4-a716-446655440003', 'active', NOW() - INTERVAL '8 days', NOW()),
(gen_random_uuid(), 'Inventory Management Project', 'Real-time inventory tracking and management solution', '550e8400-e29b-41d4-a716-446655440004', 'active', NOW() - INTERVAL '5 days', NOW());

-- Insert sample marketplace projects (using the projects we just created)
INSERT INTO marketplace_projects (id, project_id, builder_id, title, description, price, category, tags, status, rating, download_count, revenue, published_at, updated_at) VALUES
(gen_random_uuid(), (SELECT id FROM projects WHERE name = 'AI Chat Widget Project' LIMIT 1), '550e8400-e29b-41d4-a716-446655440003', 'AI Chat Widget', 'Advanced AI-powered chat widget with natural language processing', 9999, 'widgets', ARRAY['ai', 'chat', 'nlp'], 'active', 4.8, 45, 449955, NOW() - INTERVAL '15 days', NOW()),
(gen_random_uuid(), (SELECT id FROM projects WHERE name = 'E-commerce Analytics Project' LIMIT 1), '550e8400-e29b-41d4-a716-446655440004', 'E-commerce Analytics Dashboard', 'Comprehensive analytics dashboard for e-commerce businesses', 14999, 'dashboards', ARRAY['analytics', 'ecommerce', 'dashboard'], 'active', 4.6, 32, 479968, NOW() - INTERVAL '12 days', NOW()),
(gen_random_uuid(), (SELECT id FROM projects WHERE name = 'Social Media Integration Project' LIMIT 1), '550e8400-e29b-41d4-a716-446655440006', 'Social Media Integration Tool', 'Multi-platform social media integration and management tool', 7999, 'integrations', ARRAY['social', 'media', 'integration'], 'active', 4.4, 28, 223972, NOW() - INTERVAL '10 days', NOW()),
(gen_random_uuid(), (SELECT id FROM projects WHERE name = 'Customer Support Project' LIMIT 1), '550e8400-e29b-41d4-a716-446655440003', 'Customer Support Ticket System', 'Complete customer support ticket management system', 19999, 'support', ARRAY['support', 'tickets', 'customer'], 'active', 4.9, 18, 359982, NOW() - INTERVAL '8 days', NOW()),
(gen_random_uuid(), (SELECT id FROM projects WHERE name = 'Inventory Management Project' LIMIT 1), '550e8400-e29b-41d4-a716-446655440004', 'Inventory Management System', 'Real-time inventory tracking and management solution', 29999, 'inventory', ARRAY['inventory', 'management', 'tracking'], 'active', 4.7, 12, 359988, NOW() - INTERVAL '5 days', NOW());

-- Insert sample projects for end users
INSERT INTO projects (id, name, description, user_id, status, created_at, updated_at) VALUES
(gen_random_uuid(), 'My First Project', 'A simple test project', '550e8400-e29b-41d4-a716-446655440007', 'active', NOW() - INTERVAL '8 days', NOW()),
(gen_random_uuid(), 'E-commerce Website', 'Online store with payment integration', '550e8400-e29b-41d4-a716-446655440008', 'active', NOW() - INTERVAL '6 days', NOW()),
(gen_random_uuid(), 'Blog Platform', 'Content management system for blogs', '550e8400-e29b-41d4-a716-446655440009', 'active', NOW() - INTERVAL '4 days', NOW()),
(gen_random_uuid(), 'Portfolio Site', 'Personal portfolio website', '550e8400-e29b-41d4-a716-446655440010', 'active', NOW() - INTERVAL '2 days', NOW()),
(gen_random_uuid(), 'Business Dashboard', 'Analytics dashboard for business metrics', '550e8400-e29b-41d4-a716-446655440011', 'active', NOW() - INTERVAL '1 day', NOW());

-- Insert sample widget implementations
INSERT INTO widget_implementations (id, project_id, end_user_id, customer_id, configuration, usage_count, last_used, created_at, updated_at) VALUES
(gen_random_uuid(), (SELECT id FROM projects WHERE name = 'E-commerce Website' LIMIT 1), '550e8400-e29b-41d4-a716-446655440008', 'cust-001', '{"widget": "ai_chat", "theme": "dark", "position": "bottom-right"}', 150, NOW() - INTERVAL '2 hours', NOW() - INTERVAL '5 days', NOW()),
(gen_random_uuid(), (SELECT id FROM projects WHERE name = 'Blog Platform' LIMIT 1), '550e8400-e29b-41d4-a716-446655440009', 'cust-002', '{"widget": "analytics", "theme": "light", "position": "sidebar"}', 89, NOW() - INTERVAL '4 hours', NOW() - INTERVAL '3 days', NOW()),
(gen_random_uuid(), (SELECT id FROM projects WHERE name = 'Business Dashboard' LIMIT 1), '550e8400-e29b-41d4-a716-446655440011', 'cust-003', '{"widget": "social_media", "theme": "auto", "position": "header"}', 234, NOW() - INTERVAL '1 hour', NOW() - INTERVAL '1 day', NOW());

-- Insert sample revenue events
INSERT INTO revenue_events (id, project_id, builder_id, end_user_id, event_type, amount, currency, metadata, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM projects WHERE name = 'AI Chat Widget Project' LIMIT 1), '550e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440008', 'purchase', 9999, 'USD', '{"payment_method": "credit_card", "transaction_id": "txn_001"}', NOW() - INTERVAL '5 days'),
(gen_random_uuid(), (SELECT id FROM projects WHERE name = 'E-commerce Analytics Project' LIMIT 1), '550e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440009', 'purchase', 14999, 'USD', '{"payment_method": "paypal", "transaction_id": "txn_002"}', NOW() - INTERVAL '3 days'),
(gen_random_uuid(), (SELECT id FROM projects WHERE name = 'Social Media Integration Project' LIMIT 1), '550e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440011', 'purchase', 7999, 'USD', '{"payment_method": "credit_card", "transaction_id": "txn_003"}', NOW() - INTERVAL '1 day'),
(gen_random_uuid(), (SELECT id FROM projects WHERE name = 'Customer Support Project' LIMIT 1), '550e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440010', 'purchase', 19999, 'USD', '{"payment_method": "bank_transfer", "transaction_id": "txn_004"}', NOW() - INTERVAL '12 hours');

-- Insert sample usage events
INSERT INTO usage_events (id, end_user_id, widget_implementation_id, event_type, event_data, created_at) VALUES
(gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440008', (SELECT id FROM widget_implementations WHERE customer_id = 'cust-001' LIMIT 1), 'widget_used', '{"widget": "ai_chat", "duration": 300, "messages": 15}', NOW() - INTERVAL '4 days'),
(gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440009', (SELECT id FROM widget_implementations WHERE customer_id = 'cust-002' LIMIT 1), 'dashboard_viewed', '{"dashboard": "analytics", "views": 15, "pages": 3}', NOW() - INTERVAL '2 days'),
(gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440011', (SELECT id FROM widget_implementations WHERE customer_id = 'cust-003' LIMIT 1), 'integration_used', '{"integration": "social_media", "posts": 8, "platforms": ["twitter", "facebook"]}', NOW() - INTERVAL '1 day'),
(gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440008', (SELECT id FROM widget_implementations WHERE customer_id = 'cust-001' LIMIT 1), 'widget_used', '{"widget": "ai_chat", "duration": 450, "messages": 22}', NOW() - INTERVAL '12 hours'),
(gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440009', (SELECT id FROM widget_implementations WHERE customer_id = 'cust-002' LIMIT 1), 'dashboard_viewed', '{"dashboard": "analytics", "views": 8, "pages": 2}', NOW() - INTERVAL '6 hours');

-- Insert sample marketplace purchases
INSERT INTO marketplace_purchases (id, buyer_id, seller_id, project_id, amount, currency, status, created_at) VALUES
(gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440008', '550e8400-e29b-41d4-a716-446655440003', (SELECT id FROM marketplace_projects WHERE title = 'AI Chat Widget' LIMIT 1), 9999, 'USD', 'completed', NOW() - INTERVAL '5 days'),
(gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440009', '550e8400-e29b-41d4-a716-446655440004', (SELECT id FROM marketplace_projects WHERE title = 'E-commerce Analytics Dashboard' LIMIT 1), 14999, 'USD', 'completed', NOW() - INTERVAL '3 days'),
(gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440011', '550e8400-e29b-41d4-a716-446655440006', (SELECT id FROM marketplace_projects WHERE title = 'Social Media Integration Tool' LIMIT 1), 7999, 'USD', 'completed', NOW() - INTERVAL '1 day'),
(gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440003', (SELECT id FROM marketplace_projects WHERE title = 'Customer Support Ticket System' LIMIT 1), 19999, 'USD', 'completed', NOW() - INTERVAL '12 hours');

-- Insert sample marketplace reviews
INSERT INTO marketplace_reviews (id, reviewer_id, project_id, rating, review_text, created_at) VALUES
(gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440008', (SELECT id FROM marketplace_projects WHERE title = 'AI Chat Widget' LIMIT 1), 5, 'Excellent AI chat widget! Very easy to integrate and customize.', NOW() - INTERVAL '4 days'),
(gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440009', (SELECT id FROM marketplace_projects WHERE title = 'E-commerce Analytics Dashboard' LIMIT 1), 4, 'Great analytics dashboard with comprehensive features.', NOW() - INTERVAL '2 days'),
(gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440011', (SELECT id FROM marketplace_projects WHERE title = 'Social Media Integration Tool' LIMIT 1), 4, 'Good social media integration tool. Could use more platforms.', NOW() - INTERVAL '1 day'),
(gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440010', (SELECT id FROM marketplace_projects WHERE title = 'Customer Support Ticket System' LIMIT 1), 5, 'Amazing support ticket system! Highly recommended.', NOW() - INTERVAL '12 hours');

-- Insert sample marketplace downloads
INSERT INTO marketplace_downloads (id, user_id, project_id, created_at) VALUES
(gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440008', (SELECT id FROM marketplace_projects WHERE title = 'AI Chat Widget' LIMIT 1), NOW() - INTERVAL '5 days'),
(gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440009', (SELECT id FROM marketplace_projects WHERE title = 'E-commerce Analytics Dashboard' LIMIT 1), NOW() - INTERVAL '3 days'),
(gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440011', (SELECT id FROM marketplace_projects WHERE title = 'Social Media Integration Tool' LIMIT 1), NOW() - INTERVAL '1 day'),
(gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440010', (SELECT id FROM marketplace_projects WHERE title = 'Customer Support Ticket System' LIMIT 1), NOW() - INTERVAL '12 hours'),
(gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440007', (SELECT id FROM marketplace_projects WHERE title = 'AI Chat Widget' LIMIT 1), NOW() - INTERVAL '6 days'),
(gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440008', (SELECT id FROM marketplace_projects WHERE title = 'E-commerce Analytics Dashboard' LIMIT 1), NOW() - INTERVAL '4 days');

-- Refresh materialized views
REFRESH MATERIALIZED VIEW dashboard_platform_metrics;
REFRESH MATERIALIZED VIEW builder_performance;
REFRESH MATERIALIZED VIEW end_user_activity;

-- Display summary
SELECT 'Migration completed successfully!' as status;
SELECT COUNT(*) as total_users FROM users;
SELECT COUNT(*) as total_marketplace_projects FROM marketplace_projects;
SELECT COUNT(*) as total_revenue_events FROM revenue_events;
SELECT COUNT(*) as total_widget_implementations FROM widget_implementations;


