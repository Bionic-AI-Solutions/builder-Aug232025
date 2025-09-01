-- Generate Real Marketplace Sample Data (Simplified Version)
-- This script creates comprehensive sample data for testing the real-marketplace feature

-- ============================================================================
-- CREATE SAMPLE USERS
-- ============================================================================

-- Create sample users with different personas
INSERT INTO users (id, email, password_hash, persona, name, username, is_active, approval_status, plan_type, created_at) VALUES
-- Admin users
('550e8400-e29b-41d4-a716-446655440001', 'admin@builderai.com', '$2b$10$hashed_password_here', 'super_admin', 'Admin User', 'admin', 'true', 'approved', 'enterprise', NOW()),
('550e8400-e29b-41d4-a716-446655440002', 'admin2@builderai.com', '$2b$10$hashed_password_here', 'super_admin', 'Admin Manager', 'admin2', 'true', 'approved', 'enterprise', NOW()),

-- Builder users
('550e8400-e29b-41d4-a716-446655440003', 'builder1@example.com', '$2b$10$hashed_password_here', 'builder', 'John Builder', 'johnbuilder', 'true', 'approved', 'pro', NOW()),
('550e8400-e29b-41d4-a716-446655440004', 'builder2@example.com', '$2b$10$hashed_password_here', 'builder', 'Sarah Developer', 'sarahdev', 'true', 'approved', 'pro', NOW()),
('550e8400-e29b-41d4-a716-446655440005', 'builder3@example.com', '$2b$10$hashed_password_here', 'builder', 'Mike Creator', 'mikecreator', 'true', 'approved', 'basic', NOW()),
('550e8400-e29b-41d4-a716-446655440006', 'builder4@example.com', '$2b$10$hashed_password_here', 'builder', 'Lisa Innovator', 'lisainnovator', 'true', 'pending', 'free', NOW()),

-- End user users
('550e8400-e29b-41d4-a716-446655440007', 'user1@example.com', '$2b$10$hashed_password_here', 'end_user', 'Alice Consumer', 'alice', 'true', 'approved', 'free', NOW()),
('550e8400-e29b-41d4-a716-446655440008', 'user2@example.com', '$2b$10$hashed_password_here', 'end_user', 'Bob Customer', 'bob', 'true', 'approved', 'premium', NOW()),
('550e8400-e29b-41d4-a716-446655440009', 'user3@example.com', '$2b$10$hashed_password_here', 'end_user', 'Carol User', 'carol', 'true', 'approved', 'free', NOW()),
('550e8400-e29b-41d4-a716-446655440010', 'user4@example.com', '$2b$10$hashed_password_here', 'end_user', 'David Buyer', 'david', 'true', 'approved', 'premium', NOW()),
('550e8400-e29b-41d4-a716-446655440011', 'user5@example.com', '$2b$10$hashed_password_here', 'end_user', 'Eva Shopper', 'eva', 'true', 'approved', 'free', NOW())

ON CONFLICT (email) DO NOTHING;

-- ============================================================================
-- CREATE SAMPLE PROJECTS
-- ============================================================================

-- Projects for Builder 1 (John Builder)
INSERT INTO projects (id, user_id, name, description, prompt, status, llm, mcp_servers, category, tags, created_at) VALUES
('550e8400-e29b-41d4-a716-446655440101', '550e8400-e29b-41d4-a716-446655440003', 'AI Chat Assistant Pro', 'Advanced chatbot with multiple integrations and natural language processing', 'Create a sophisticated AI chatbot that can handle customer service, integrate with multiple platforms, and provide intelligent responses using natural language processing.', 'completed', 'claude', '["context7", "file-system", "github"]', 'business', '["ai", "chatbot", "automation", "customer-service"]', NOW() - INTERVAL '30 days'),
('550e8400-e29b-41d4-a716-446655440102', '550e8400-e29b-41d4-a716-446655440003', 'Data Analytics Dashboard', 'Real-time analytics visualization with interactive charts', 'Build a comprehensive data analytics dashboard that displays real-time metrics, interactive charts, and customizable reports for business intelligence.', 'completed', 'gpt4', '["context7", "database", "chart-generator"]', 'business', '["analytics", "dashboard", "data", "visualization"]', NOW() - INTERVAL '25 days'),
('550e8400-e29b-41d4-a716-446655440103', '550e8400-e29b-41d4-a716-446655440003', 'E-commerce Bot', 'Automated shopping assistant with product recommendations', 'Create an intelligent e-commerce bot that can help users find products, provide recommendations, and assist with the shopping process.', 'completed', 'gemini', '["context7", "product-catalog", "payment-processor"]', 'service', '["ecommerce", "bot", "shopping", "recommendations"]', NOW() - INTERVAL '20 days');

-- Projects for Builder 2 (Sarah Developer)
INSERT INTO projects (id, user_id, name, description, prompt, status, llm, mcp_servers, category, tags, created_at) VALUES
('550e8400-e29b-41d4-a716-446655440105', '550e8400-e29b-41d4-a716-446655440004', 'Health Monitoring System', 'Comprehensive health tracking and monitoring platform', 'Build a health monitoring system that tracks vital signs, provides health insights, and integrates with wearable devices for comprehensive health management.', 'completed', 'gpt4', '["context7", "health-api", "device-integration"]', 'health', '["health", "monitoring", "fitness", "wellness"]', NOW() - INTERVAL '28 days'),
('550e8400-e29b-41d4-a716-446655440106', '550e8400-e29b-41d4-a716-446655440004', 'Task Management App', 'Intelligent task management with AI prioritization', 'Create a smart task management application that uses AI to prioritize tasks, suggest optimal scheduling, and provide productivity insights.', 'completed', 'claude', '["context7", "calendar", "productivity-tools"]', 'business', '["productivity", "task-management", "ai", "scheduling"]', NOW() - INTERVAL '22 days'),
('550e8400-e29b-41d4-a716-446655440107', '550e8400-e29b-41d4-a716-446655440004', 'Language Learning Bot', 'Interactive language learning assistant', 'Develop an interactive language learning bot that provides personalized lessons, pronunciation feedback, and cultural context for effective language acquisition.', 'completed', 'gemini', '["context7", "translation", "speech-recognition"]', 'education', '["education", "language", "learning", "ai"]', NOW() - INTERVAL '18 days');

-- Projects for Builder 3 (Mike Creator)
INSERT INTO projects (id, user_id, name, description, prompt, status, llm, mcp_servers, category, tags, created_at) VALUES
('550e8400-e29b-41d4-a716-446655440109', '550e8400-e29b-41d4-a716-446655440005', 'Recipe Generator', 'AI-powered recipe creation and meal planning', 'Build an AI recipe generator that creates personalized recipes based on available ingredients, dietary restrictions, and cooking preferences.', 'completed', 'claude', '["context7", "recipe-database", "nutrition-api"]', 'lifestyle', '["cooking", "recipes", "meal-planning", "ai"]', NOW() - INTERVAL '26 days'),
('550e8400-e29b-41d4-a716-446655440110', '550e8400-e29b-41d4-a716-446655440005', 'Travel Planner', 'Intelligent travel planning and itinerary creation', 'Create a smart travel planner that suggests destinations, creates itineraries, and provides travel recommendations based on user preferences and budget.', 'completed', 'gpt4', '["context7", "travel-api", "booking-system"]', 'lifestyle', '["travel", "planning", "itinerary", "recommendations"]', NOW() - INTERVAL '21 days');

-- ============================================================================
-- CREATE SAMPLE MARKETPLACE PROJECTS
-- ============================================================================

-- Active and approved marketplace projects
INSERT INTO marketplace_projects (id, project_id, builder_id, title, description, price, category, tags, status, approval_status, featured, rating, review_count, download_count, revenue, mcp_servers, published_at) VALUES
-- Builder 1's projects
('550e8400-e29b-41d4-a716-446655440201', '550e8400-e29b-41d4-a716-446655440101', '550e8400-e29b-41d4-a716-446655440003', 'AI Chat Assistant Pro', 'Advanced chatbot with multiple integrations and natural language processing. Perfect for customer service automation and business communication.', 2500, 'business', '["ai", "chatbot", "automation", "customer-service"]', 'active', 'approved', true, 4.5, 12, 45, 11250, '["context7", "file-system", "github"]', NOW() - INTERVAL '25 days'),
('550e8400-e29b-41d4-a716-446655440202', '550e8400-e29b-41d4-a716-446655440102', '550e8400-e29b-41d4-a716-446655440003', 'Data Analytics Dashboard', 'Real-time analytics visualization with interactive charts. Transform your data into actionable insights with beautiful, customizable dashboards.', 1500, 'business', '["analytics", "dashboard", "data", "visualization"]', 'active', 'approved', false, 4.2, 8, 23, 3450, '["context7", "database", "chart-generator"]', NOW() - INTERVAL '20 days'),
('550e8400-e29b-41d4-a716-446655440203', '550e8400-e29b-41d4-a716-446655440103', '550e8400-e29b-41d4-a716-446655440003', 'E-commerce Bot', 'Automated shopping assistant with product recommendations. Enhance your online store with intelligent product discovery and customer assistance.', 3000, 'service', '["ecommerce", "bot", "shopping", "recommendations"]', 'active', 'approved', true, 4.8, 15, 67, 20100, '["context7", "product-catalog", "payment-processor"]', NOW() - INTERVAL '15 days'),

-- Builder 2's projects
('550e8400-e29b-41d4-a716-446655440204', '550e8400-e29b-41d4-a716-446655440105', '550e8400-e29b-41d4-a716-446655440004', 'Health Monitoring System', 'Comprehensive health tracking and monitoring platform. Monitor vital signs, track fitness goals, and get personalized health insights.', 2000, 'health', '["health", "monitoring", "fitness", "wellness"]', 'active', 'approved', false, 4.3, 10, 34, 6800, '["context7", "health-api", "device-integration"]', NOW() - INTERVAL '23 days'),
('550e8400-e29b-41d4-a716-446655440205', '550e8400-e29b-41d4-a716-446655440106', '550e8400-e29b-41d4-a716-446655440004', 'Task Management App', 'Intelligent task management with AI prioritization. Boost productivity with smart task scheduling and AI-powered insights.', 1200, 'business', '["productivity", "task-management", "ai", "scheduling"]', 'active', 'approved', false, 4.1, 6, 18, 2160, '["context7", "calendar", "productivity-tools"]', NOW() - INTERVAL '17 days'),
('550e8400-e29b-41d4-a716-446655440206', '550e8400-e29b-41d4-a716-446655440107', '550e8400-e29b-41d4-a716-446655440004', 'Language Learning Bot', 'Interactive language learning assistant. Master new languages with personalized lessons and AI-powered pronunciation feedback.', 1800, 'education', '["education", "language", "learning", "ai"]', 'active', 'approved', true, 4.6, 14, 52, 9360, '["context7", "translation", "speech-recognition"]', NOW() - INTERVAL '13 days'),

-- Builder 3's projects
('550e8400-e29b-41d4-a716-446655440207', '550e8400-e29b-41d4-a716-446655440109', '550e8400-e29b-41d4-a716-446655440005', 'Recipe Generator', 'AI-powered recipe creation and meal planning. Discover new recipes based on your ingredients and dietary preferences.', 800, 'lifestyle', '["cooking", "recipes", "meal-planning", "ai"]', 'active', 'approved', false, 4.0, 5, 12, 960, '["context7", "recipe-database", "nutrition-api"]', NOW() - INTERVAL '21 days'),
('550e8400-e29b-41d4-a716-446655440208', '550e8400-e29b-41d4-a716-446655440110', '550e8400-e29b-41d4-a716-446655440005', 'Travel Planner', 'Intelligent travel planning and itinerary creation. Plan perfect trips with AI-powered destination suggestions and itinerary optimization.', 1600, 'lifestyle', '["travel", "planning", "itinerary", "recommendations"]', 'active', 'approved', false, 4.4, 9, 28, 4480, '["context7", "travel-api", "booking-system"]', NOW() - INTERVAL '16 days');

-- ============================================================================
-- UPDATE POPULARITY SCORES
-- ============================================================================

-- Update popularity scores for all marketplace projects
SELECT update_marketplace_project_popularity(id) FROM marketplace_projects;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Verify data integrity
DO $$
DECLARE
    user_count INTEGER;
    project_count INTEGER;
    marketplace_project_count INTEGER;
BEGIN
    -- Count users
    SELECT COUNT(*) INTO user_count FROM users WHERE email LIKE '%@example.com' OR email LIKE '%@builderai.com';
    RAISE NOTICE 'Created % sample users', user_count;
    
    -- Count projects
    SELECT COUNT(*) INTO project_count FROM projects WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%@example.com' OR email LIKE '%@builderai.com');
    RAISE NOTICE 'Created % sample projects', project_count;
    
    -- Count marketplace projects
    SELECT COUNT(*) INTO marketplace_project_count FROM marketplace_projects;
    RAISE NOTICE 'Created % sample marketplace projects', marketplace_project_count;
    
    -- Verify relationships
    IF NOT EXISTS (
        SELECT 1 FROM marketplace_projects mp
        JOIN projects p ON mp.project_id = p.id
        JOIN users u ON mp.builder_id = u.id
        LIMIT 1
    ) THEN
        RAISE EXCEPTION 'Data integrity check failed: marketplace_projects relationships';
    END IF;
    
    RAISE NOTICE 'All data integrity checks passed!';
END $$;

-- Display sample data summary
SELECT 
    'Sample Data Summary' as info,
    (SELECT COUNT(*) FROM users WHERE email LIKE '%@example.com' OR email LIKE '%@builderai.com') as total_users,
    (SELECT COUNT(*) FROM projects WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%@example.com' OR email LIKE '%@builderai.com')) as total_projects,
    (SELECT COUNT(*) FROM marketplace_projects) as total_marketplace_projects,
    (SELECT COUNT(*) FROM marketplace_projects WHERE status = 'active' AND approval_status = 'approved') as active_approved_projects;

DO $$
BEGIN
    RAISE NOTICE 'Real Marketplace sample data generation completed successfully!';
END $$;

