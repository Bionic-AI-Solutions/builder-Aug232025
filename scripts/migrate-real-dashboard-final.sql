-- Real Dashboard Database Migration Script (Final Corrected)
-- Phase 1: Database Enhancement & Data Migration

-- 1. Add missing user fields to users table (already done)
-- 2. Create materialized views for dashboard analytics (already done)
-- 3. Insert comprehensive sample data with correct schema

-- Insert sample projects with correct status values
INSERT INTO projects (id, name, description, user_id, status, created_at, updated_at) VALUES
(gen_random_uuid(), 'AI Chat Widget Project', 'Advanced AI-powered chat widget with natural language processing', '550e8400-e29b-41d4-a716-446655440003', 'completed', NOW() - INTERVAL '15 days', NOW()),
(gen_random_uuid(), 'E-commerce Analytics Project', 'Comprehensive analytics dashboard for e-commerce businesses', '550e8400-e29b-41d4-a716-446655440004', 'completed', NOW() - INTERVAL '12 days', NOW()),
(gen_random_uuid(), 'Social Media Integration Project', 'Multi-platform social media integration and management tool', '550e8400-e29b-41d4-a716-446655440006', 'completed', NOW() - INTERVAL '10 days', NOW()),
(gen_random_uuid(), 'Customer Support Project', 'Complete customer support ticket management system', '550e8400-e29b-41d4-a716-446655440003', 'completed', NOW() - INTERVAL '8 days', NOW()),
(gen_random_uuid(), 'Inventory Management Project', 'Real-time inventory tracking and management solution', '550e8400-e29b-41d4-a716-446655440004', 'completed', NOW() - INTERVAL '5 days', NOW());

-- Insert sample marketplace projects (using the projects we just created)
INSERT INTO marketplace_projects (id, project_id, builder_id, title, description, price, category, tags, status, rating, download_count, revenue, published_at, updated_at) VALUES
(gen_random_uuid(), (SELECT id FROM projects WHERE name = 'AI Chat Widget Project' LIMIT 1), '550e8400-e29b-41d4-a716-446655440003', 'AI Chat Widget', 'Advanced AI-powered chat widget with natural language processing', 9999, 'widgets', ARRAY['ai', 'chat', 'nlp'], 'active', 4.8, 45, 449955, NOW() - INTERVAL '15 days', NOW()),
(gen_random_uuid(), (SELECT id FROM projects WHERE name = 'E-commerce Analytics Project' LIMIT 1), '550e8400-e29b-41d4-a716-446655440004', 'E-commerce Analytics Dashboard', 'Comprehensive analytics dashboard for e-commerce businesses', 14999, 'dashboards', ARRAY['analytics', 'ecommerce', 'dashboard'], 'active', 4.6, 32, 479968, NOW() - INTERVAL '12 days', NOW()),
(gen_random_uuid(), (SELECT id FROM projects WHERE name = 'Social Media Integration Project' LIMIT 1), '550e8400-e29b-41d4-a716-446655440006', 'Social Media Integration Tool', 'Multi-platform social media integration and management tool', 7999, 'integrations', ARRAY['social', 'media', 'integration'], 'active', 4.4, 28, 223972, NOW() - INTERVAL '10 days', NOW()),
(gen_random_uuid(), (SELECT id FROM projects WHERE name = 'Customer Support Project' LIMIT 1), '550e8400-e29b-41d4-a716-446655440003', 'Customer Support Ticket System', 'Complete customer support ticket management system', 19999, 'support', ARRAY['support', 'tickets', 'customer'], 'active', 4.9, 18, 359982, NOW() - INTERVAL '8 days', NOW()),
(gen_random_uuid(), (SELECT id FROM projects WHERE name = 'Inventory Management Project' LIMIT 1), '550e8400-e29b-41d4-a716-446655440004', 'Inventory Management System', 'Real-time inventory tracking and management solution', 29999, 'inventory', ARRAY['inventory', 'management', 'tracking'], 'active', 4.7, 12, 359988, NOW() - INTERVAL '5 days', NOW());

-- Insert sample projects for end users
INSERT INTO projects (id, name, description, user_id, status, created_at, updated_at) VALUES
(gen_random_uuid(), 'My First Project', 'A simple test project', '550e8400-e29b-41d4-a716-446655440007', 'development', NOW() - INTERVAL '8 days', NOW()),
(gen_random_uuid(), 'E-commerce Website', 'Online store with payment integration', '550e8400-e29b-41d4-a716-446655440008', 'development', NOW() - INTERVAL '6 days', NOW()),
(gen_random_uuid(), 'Blog Platform', 'Content management system for blogs', '550e8400-e29b-41d4-a716-446655440009', 'development', NOW() - INTERVAL '4 days', NOW()),
(gen_random_uuid(), 'Portfolio Site', 'Personal portfolio website', '550e8400-e29b-41d4-a716-446655440010', 'development', NOW() - INTERVAL '2 days', NOW()),
(gen_random_uuid(), 'Business Dashboard', 'Analytics dashboard for business metrics', '550e8400-e29b-41d4-a716-446655440011', 'development', NOW() - INTERVAL '1 day', NOW());

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

-- Insert sample usage events (using metadata instead of event_data)
INSERT INTO usage_events (id, end_user_id, widget_implementation_id, event_type, metadata, created_at) VALUES
(gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440008', (SELECT id FROM widget_implementations WHERE customer_id = 'cust-001' LIMIT 1), 'widget_used', '{"widget": "ai_chat", "duration": 300, "messages": 15}', NOW() - INTERVAL '4 days'),
(gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440009', (SELECT id FROM widget_implementations WHERE customer_id = 'cust-002' LIMIT 1), 'dashboard_viewed', '{"dashboard": "analytics", "views": 15, "pages": 3}', NOW() - INTERVAL '2 days'),
(gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440011', (SELECT id FROM widget_implementations WHERE customer_id = 'cust-003' LIMIT 1), 'integration_used', '{"integration": "social_media", "posts": 8, "platforms": ["twitter", "facebook"]}', NOW() - INTERVAL '1 day'),
(gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440008', (SELECT id FROM widget_implementations WHERE customer_id = 'cust-001' LIMIT 1), 'widget_used', '{"widget": "ai_chat", "duration": 450, "messages": 22}', NOW() - INTERVAL '12 hours'),
(gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440009', (SELECT id FROM widget_implementations WHERE customer_id = 'cust-002' LIMIT 1), 'dashboard_viewed', '{"dashboard": "analytics", "views": 8, "pages": 2}', NOW() - INTERVAL '6 hours');

-- Insert sample marketplace purchases (without created_at column)
INSERT INTO marketplace_purchases (id, buyer_id, seller_id, project_id, amount, currency, status) VALUES
(gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440008', '550e8400-e29b-41d4-a716-446655440003', (SELECT id FROM marketplace_projects WHERE title = 'AI Chat Widget' LIMIT 1), 9999, 'USD', 'completed'),
(gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440009', '550e8400-e29b-41d4-a716-446655440004', (SELECT id FROM marketplace_projects WHERE title = 'E-commerce Analytics Dashboard' LIMIT 1), 14999, 'USD', 'completed'),
(gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440011', '550e8400-e29b-41d4-a716-446655440006', (SELECT id FROM marketplace_projects WHERE title = 'Social Media Integration Tool' LIMIT 1), 7999, 'USD', 'completed'),
(gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440003', (SELECT id FROM marketplace_projects WHERE title = 'Customer Support Ticket System' LIMIT 1), 19999, 'USD', 'completed');

-- Insert sample marketplace reviews
INSERT INTO marketplace_reviews (id, reviewer_id, project_id, rating, review_text, created_at) VALUES
(gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440008', (SELECT id FROM marketplace_projects WHERE title = 'AI Chat Widget' LIMIT 1), 5, 'Excellent AI chat widget! Very easy to integrate and customize.', NOW() - INTERVAL '4 days'),
(gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440009', (SELECT id FROM marketplace_projects WHERE title = 'E-commerce Analytics Dashboard' LIMIT 1), 4, 'Great analytics dashboard with comprehensive features.', NOW() - INTERVAL '2 days'),
(gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440011', (SELECT id FROM marketplace_projects WHERE title = 'Social Media Integration Tool' LIMIT 1), 4, 'Good social media integration tool. Could use more platforms.', NOW() - INTERVAL '1 day'),
(gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440010', (SELECT id FROM marketplace_projects WHERE title = 'Customer Support Ticket System' LIMIT 1), 5, 'Amazing support ticket system! Highly recommended.', NOW() - INTERVAL '12 hours');

-- Insert sample marketplace downloads (without created_at column)
INSERT INTO marketplace_downloads (id, user_id, project_id) VALUES
(gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440008', (SELECT id FROM marketplace_projects WHERE title = 'AI Chat Widget' LIMIT 1)),
(gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440009', (SELECT id FROM marketplace_projects WHERE title = 'E-commerce Analytics Dashboard' LIMIT 1)),
(gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440011', (SELECT id FROM marketplace_projects WHERE title = 'Social Media Integration Tool' LIMIT 1)),
(gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440010', (SELECT id FROM marketplace_projects WHERE title = 'Customer Support Ticket System' LIMIT 1)),
(gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440007', (SELECT id FROM marketplace_projects WHERE title = 'AI Chat Widget' LIMIT 1)),
(gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440008', (SELECT id FROM marketplace_projects WHERE title = 'E-commerce Analytics Dashboard' LIMIT 1));

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
SELECT COUNT(*) as total_projects FROM projects;


