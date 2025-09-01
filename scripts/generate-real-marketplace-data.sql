-- Generate Real Marketplace Sample Data
-- This script creates comprehensive sample data for testing the real-marketplace feature

-- ============================================================================
-- CLEANUP EXISTING SAMPLE DATA (OPTIONAL)
-- ============================================================================

-- Uncomment the following lines if you want to clean up existing data
-- DELETE FROM marketplace_reviews;
-- DELETE FROM marketplace_downloads;
-- DELETE FROM marketplace_purchases;
-- DELETE FROM marketplace_projects;
-- DELETE FROM projects WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%@example.com');
-- DELETE FROM users WHERE email LIKE '%@example.com';

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
('550e8400-e29b-41d4-a716-446655440103', '550e8400-e29b-41d4-a716-446655440003', 'E-commerce Bot', 'Automated shopping assistant with product recommendations', 'Create an intelligent e-commerce bot that can help users find products, provide recommendations, and assist with the shopping process.', 'completed', 'gemini', '["context7", "product-catalog", "payment-processor"]', 'service', '["ecommerce", "bot", "shopping", "recommendations"]', NOW() - INTERVAL '20 days'),
('550e8400-e29b-41d4-a716-446655440104', '550e8400-e29b-41d4-a716-446655440003', 'Content Generator', 'AI-powered content creation tool', 'Develop an AI content generator that can create blog posts, social media content, and marketing copy based on user inputs and brand guidelines.', 'development', 'claude', '["context7", "content-library", "seo-tools"]', 'content', '["content", "ai", "writing", "marketing"]', NOW() - INTERVAL '15 days');

-- Projects for Builder 2 (Sarah Developer)
INSERT INTO projects (id, user_id, name, description, prompt, status, llm, mcp_servers, category, tags, created_at) VALUES
('550e8400-e29b-41d4-a716-446655440105', '550e8400-e29b-41d4-a716-446655440004', 'Health Monitoring System', 'Comprehensive health tracking and monitoring platform', 'Build a health monitoring system that tracks vital signs, provides health insights, and integrates with wearable devices for comprehensive health management.', 'completed', 'gpt4', '["context7", "health-api", "device-integration"]', 'health', '["health", "monitoring", "fitness", "wellness"]', NOW() - INTERVAL '28 days'),
('550e8400-e29b-41d4-a716-446655440106', '550e8400-e29b-41d4-a716-446655440004', 'Task Management App', 'Intelligent task management with AI prioritization', 'Create a smart task management application that uses AI to prioritize tasks, suggest optimal scheduling, and provide productivity insights.', 'completed', 'claude', '["context7", "calendar", "productivity-tools"]', 'business', '["productivity", "task-management", "ai", "scheduling"]', NOW() - INTERVAL '22 days'),
('550e8400-e29b-41d4-a716-446655440107', '550e8400-e29b-41d4-a716-446655440004', 'Language Learning Bot', 'Interactive language learning assistant', 'Develop an interactive language learning bot that provides personalized lessons, pronunciation feedback, and cultural context for effective language acquisition.', 'completed', 'gemini', '["context7", "translation", "speech-recognition"]', 'education', '["education", "language", "learning", "ai"]', NOW() - INTERVAL '18 days'),
('550e8400-e29b-41d4-a716-446655440108', '550e8400-e29b-41d4-a716-446655440004', 'Financial Advisor Bot', 'AI-powered financial planning and advice', 'Create an AI financial advisor that provides personalized financial advice, investment recommendations, and budget planning assistance.', 'development', 'gpt4', '["context7", "financial-data", "investment-api"]', 'finance', '["finance", "investment", "planning", "ai"]', NOW() - INTERVAL '12 days');

-- Projects for Builder 3 (Mike Creator)
INSERT INTO projects (id, user_id, name, description, prompt, status, llm, mcp_servers, category, tags, created_at) VALUES
('550e8400-e29b-41d4-a716-446655440109', '550e8400-e29b-41d4-a716-446655440005', 'Recipe Generator', 'AI-powered recipe creation and meal planning', 'Build an AI recipe generator that creates personalized recipes based on available ingredients, dietary restrictions, and cooking preferences.', 'completed', 'claude', '["context7", "recipe-database", "nutrition-api"]', 'lifestyle', '["cooking", "recipes", "meal-planning", "ai"]', NOW() - INTERVAL '26 days'),
('550e8400-e29b-41d4-a716-446655440110', '550e8400-e29b-41d4-a716-446655440005', 'Travel Planner', 'Intelligent travel planning and itinerary creation', 'Create a smart travel planner that suggests destinations, creates itineraries, and provides travel recommendations based on user preferences and budget.', 'completed', 'gpt4', '["context7", "travel-api", "booking-system"]', 'lifestyle', '["travel", "planning", "itinerary", "recommendations"]', NOW() - INTERVAL '21 days'),
('550e8400-e29b-41d4-a716-446655440111', '550e8400-e29b-41d4-a716-446655440005', 'Fitness Coach Bot', 'Personalized fitness training and coaching', 'Develop an AI fitness coach that creates personalized workout plans, tracks progress, and provides motivation and guidance for fitness goals.', 'development', 'gemini', '["context7", "fitness-api", "wearable-integration"]', 'health', '["fitness", "coaching", "workout", "health"]', NOW() - INTERVAL '16 days');

-- Projects for Builder 4 (Lisa Innovator) - Pending approval
INSERT INTO projects (id, user_id, name, description, prompt, status, llm, mcp_servers, category, tags, created_at) VALUES
('550e8400-e29b-41d4-a716-446655440112', '550e8400-e29b-41d4-a716-446655440006', 'Creative Writing Assistant', 'AI-powered creative writing and storytelling tool', 'Build a creative writing assistant that helps users develop stories, characters, and plotlines with AI-powered suggestions and creative prompts.', 'completed', 'claude', '["context7", "story-generator", "character-builder"]', 'content', '["writing", "creative", "storytelling", "ai"]', NOW() - INTERVAL '10 days');

-- ============================================================================
-- CREATE SAMPLE MARKETPLACE PROJECTS
-- ============================================================================

-- Active and approved marketplace projects
INSERT INTO marketplace_projects (id, project_id, builder_id, title, description, price, category, tags, status, approval_status, featured, rating, review_count, download_count, revenue, mcp_servers, published_at) VALUES
-- Builder 1's projects
('mp-001', 'project-001', 'builder-001', 'AI Chat Assistant Pro', 'Advanced chatbot with multiple integrations and natural language processing. Perfect for customer service automation and business communication.', 2500, 'business', '["ai", "chatbot", "automation", "customer-service"]', 'active', 'approved', true, 4.5, 12, 45, 11250, '["context7", "file-system", "github"]', NOW() - INTERVAL '25 days'),
('mp-002', 'project-002', 'builder-001', 'Data Analytics Dashboard', 'Real-time analytics visualization with interactive charts. Transform your data into actionable insights with beautiful, customizable dashboards.', 1500, 'business', '["analytics", "dashboard", "data", "visualization"]', 'active', 'approved', false, 4.2, 8, 23, 3450, '["context7", "database", "chart-generator"]', NOW() - INTERVAL '20 days'),
('mp-003', 'project-003', 'builder-001', 'E-commerce Bot', 'Automated shopping assistant with product recommendations. Enhance your online store with intelligent product discovery and customer assistance.', 3000, 'service', '["ecommerce", "bot", "shopping", "recommendations"]', 'active', 'approved', true, 4.8, 15, 67, 20100, '["context7", "product-catalog", "payment-processor"]', NOW() - INTERVAL '15 days'),

-- Builder 2's projects
('mp-004', 'project-005', 'builder-002', 'Health Monitoring System', 'Comprehensive health tracking and monitoring platform. Monitor vital signs, track fitness goals, and get personalized health insights.', 2000, 'health', '["health", "monitoring", "fitness", "wellness"]', 'active', 'approved', false, 4.3, 10, 34, 6800, '["context7", "health-api", "device-integration"]', NOW() - INTERVAL '23 days'),
('mp-005', 'project-006', 'builder-002', 'Task Management App', 'Intelligent task management with AI prioritization. Boost productivity with smart task scheduling and AI-powered insights.', 1200, 'business', '["productivity", "task-management", "ai", "scheduling"]', 'active', 'approved', false, 4.1, 6, 18, 2160, '["context7", "calendar", "productivity-tools"]', NOW() - INTERVAL '17 days'),
('mp-006', 'project-007', 'builder-002', 'Language Learning Bot', 'Interactive language learning assistant. Master new languages with personalized lessons and AI-powered pronunciation feedback.', 1800, 'education', '["education", "language", "learning", "ai"]', 'active', 'approved', true, 4.6, 14, 52, 9360, '["context7", "translation", "speech-recognition"]', NOW() - INTERVAL '13 days'),

-- Builder 3's projects
('mp-007', 'project-009', 'builder-003', 'Recipe Generator', 'AI-powered recipe creation and meal planning. Discover new recipes based on your ingredients and dietary preferences.', 800, 'lifestyle', '["cooking", "recipes", "meal-planning", "ai"]', 'active', 'approved', false, 4.0, 5, 12, 960, '["context7", "recipe-database", "nutrition-api"]', NOW() - INTERVAL '21 days'),
('mp-008', 'project-010', 'builder-003', 'Travel Planner', 'Intelligent travel planning and itinerary creation. Plan perfect trips with AI-powered destination suggestions and itinerary optimization.', 1600, 'lifestyle', '["travel", "planning", "itinerary", "recommendations"]', 'active', 'approved', false, 4.4, 9, 28, 4480, '["context7", "travel-api", "booking-system"]', NOW() - INTERVAL '16 days');

-- Pending approval projects
INSERT INTO marketplace_projects (id, project_id, builder_id, title, description, price, category, tags, status, approval_status, featured, rating, review_count, download_count, revenue, mcp_servers, published_at) VALUES
('mp-009', 'project-008', 'builder-002', 'Financial Advisor Bot', 'AI-powered financial planning and advice. Get personalized financial advice, investment recommendations, and budget planning assistance.', 2200, 'finance', '["finance", "investment", "planning", "ai"]', 'inactive', 'pending', false, 0.0, 0, 0, 0, '["context7", "financial-data", "investment-api"]', NOW() - INTERVAL '8 days'),
('mp-010', 'project-011', 'builder-003', 'Fitness Coach Bot', 'Personalized fitness training and coaching. Get AI-powered workout plans, progress tracking, and motivation for your fitness journey.', 1400, 'health', '["fitness", "coaching", "workout", "health"]', 'inactive', 'pending', false, 0.0, 0, 0, 0, '["context7", "fitness-api", "wearable-integration"]', NOW() - INTERVAL '12 days'),
('mp-011', 'project-012', 'builder-004', 'Creative Writing Assistant', 'AI-powered creative writing and storytelling tool. Develop compelling stories, characters, and plotlines with intelligent writing assistance.', 1100, 'content', '["writing", "creative", "storytelling", "ai"]', 'inactive', 'pending', false, 0.0, 0, 0, 0, '["context7", "story-generator", "character-builder"]', NOW() - INTERVAL '6 days');

-- Inactive projects (rejected or suspended)
INSERT INTO marketplace_projects (id, project_id, builder_id, title, description, price, category, tags, status, approval_status, featured, rating, review_count, download_count, revenue, mcp_servers, published_at) VALUES
('mp-012', 'project-004', 'builder-001', 'Content Generator', 'AI-powered content creation tool. Create engaging blog posts, social media content, and marketing copy with AI assistance.', 900, 'content', '["content", "ai", "writing", "marketing"]', 'inactive', 'rejected', false, 0.0, 0, 0, 0, '["context7", "content-library", "seo-tools"]', NOW() - INTERVAL '10 days');

-- ============================================================================
-- CREATE SAMPLE PURCHASES
-- ============================================================================

-- Sample purchases for marketplace projects
INSERT INTO marketplace_purchases (id, project_id, buyer_id, seller_id, amount, currency, status, payment_method, purchased_at) VALUES
-- Purchases for AI Chat Assistant Pro
('purchase-001', 'mp-001', 'enduser-001', 'builder-001', 2500, 'USD', 'completed', 'stripe', NOW() - INTERVAL '20 days'),
('purchase-002', 'mp-001', 'enduser-002', 'builder-001', 2500, 'USD', 'completed', 'stripe', NOW() - INTERVAL '18 days'),
('purchase-003', 'mp-001', 'enduser-003', 'builder-001', 2500, 'USD', 'completed', 'stripe', NOW() - INTERVAL '15 days'),
('purchase-004', 'mp-001', 'enduser-004', 'builder-001', 2500, 'USD', 'completed', 'stripe', NOW() - INTERVAL '12 days'),
('purchase-005', 'mp-001', 'enduser-005', 'builder-001', 2500, 'USD', 'completed', 'stripe', NOW() - INTERVAL '10 days'),

-- Purchases for Data Analytics Dashboard
('purchase-006', 'mp-002', 'enduser-001', 'builder-001', 1500, 'USD', 'completed', 'stripe', NOW() - INTERVAL '17 days'),
('purchase-007', 'mp-002', 'enduser-002', 'builder-001', 1500, 'USD', 'completed', 'stripe', NOW() - INTERVAL '14 days'),
('purchase-008', 'mp-002', 'enduser-003', 'builder-001', 1500, 'USD', 'completed', 'stripe', NOW() - INTERVAL '11 days'),

-- Purchases for E-commerce Bot
('purchase-009', 'mp-003', 'enduser-001', 'builder-001', 3000, 'USD', 'completed', 'stripe', NOW() - INTERVAL '12 days'),
('purchase-010', 'mp-003', 'enduser-002', 'builder-001', 3000, 'USD', 'completed', 'stripe', NOW() - INTERVAL '10 days'),
('purchase-011', 'mp-003', 'enduser-004', 'builder-001', 3000, 'USD', 'completed', 'stripe', NOW() - INTERVAL '8 days'),
('purchase-012', 'mp-003', 'enduser-005', 'builder-001', 3000, 'USD', 'completed', 'stripe', NOW() - INTERVAL '6 days'),

-- Purchases for Health Monitoring System
('purchase-013', 'mp-004', 'enduser-001', 'builder-002', 2000, 'USD', 'completed', 'stripe', NOW() - INTERVAL '19 days'),
('purchase-014', 'mp-004', 'enduser-003', 'builder-002', 2000, 'USD', 'completed', 'stripe', NOW() - INTERVAL '16 days'),
('purchase-015', 'mp-004', 'enduser-005', 'builder-002', 2000, 'USD', 'completed', 'stripe', NOW() - INTERVAL '13 days'),

-- Purchases for Language Learning Bot
('purchase-016', 'mp-006', 'enduser-002', 'builder-002', 1800, 'USD', 'completed', 'stripe', NOW() - INTERVAL '11 days'),
('purchase-017', 'mp-006', 'enduser-004', 'builder-002', 1800, 'USD', 'completed', 'stripe', NOW() - INTERVAL '9 days'),
('purchase-018', 'mp-006', 'enduser-005', 'builder-002', 1800, 'USD', 'completed', 'stripe', NOW() - INTERVAL '7 days');

-- ============================================================================
-- CREATE SAMPLE REVIEWS
-- ============================================================================

-- Reviews for AI Chat Assistant Pro
INSERT INTO marketplace_reviews (id, project_id, reviewer_id, rating, review_text, helpful_count, created_at) VALUES
('review-001', 'mp-001', 'enduser-001', 5, 'Excellent chatbot! The integration with multiple platforms works seamlessly. Customer service has improved significantly since we implemented this.', 8, NOW() - INTERVAL '18 days'),
('review-002', 'mp-001', 'enduser-002', 4, 'Great AI chatbot with good natural language processing. Easy to set up and customize for our business needs.', 5, NOW() - INTERVAL '16 days'),
('review-003', 'mp-001', 'enduser-003', 5, 'Amazing product! The chatbot handles customer inquiries efficiently and the AI responses are very natural.', 12, NOW() - INTERVAL '13 days'),
('review-004', 'mp-001', 'enduser-004', 4, 'Solid chatbot solution. Good value for money and excellent customer support from the builder.', 3, NOW() - INTERVAL '10 days'),
('review-005', 'mp-001', 'enduser-005', 5, 'Perfect for our e-commerce store. The chatbot helps customers find products and answers questions instantly.', 7, NOW() - INTERVAL '8 days'),

-- Reviews for Data Analytics Dashboard
INSERT INTO marketplace_reviews (id, project_id, reviewer_id, rating, review_text, helpful_count, created_at) VALUES
('review-006', 'mp-002', 'enduser-001', 4, 'Good analytics dashboard with nice visualizations. Easy to understand and provides valuable insights.', 4, NOW() - INTERVAL '15 days'),
('review-007', 'mp-002', 'enduser-002', 4, 'Solid dashboard solution. The interactive charts are great and the real-time updates work well.', 6, NOW() - INTERVAL '12 days'),
('review-008', 'mp-002', 'enduser-003', 5, 'Excellent analytics tool! The customizable reports feature is very useful for our business intelligence needs.', 9, NOW() - INTERVAL '9 days'),

-- Reviews for E-commerce Bot
INSERT INTO marketplace_reviews (id, project_id, reviewer_id, rating, review_text, helpful_count, created_at) VALUES
('review-009', 'mp-003', 'enduser-001', 5, 'Fantastic e-commerce bot! Product recommendations are spot-on and it has increased our sales significantly.', 15, NOW() - INTERVAL '10 days'),
('review-010', 'mp-003', 'enduser-002', 5, 'Amazing shopping assistant. The AI understands customer preferences perfectly and provides excellent recommendations.', 11, NOW() - INTERVAL '8 days'),
('review-011', 'mp-003', 'enduser-004', 4, 'Great e-commerce bot with good product discovery features. Easy to integrate with our existing systems.', 7, NOW() - INTERVAL '6 days'),
('review-012', 'mp-003', 'enduser-005', 5, 'Outstanding product! The bot has transformed our online store and improved customer experience dramatically.', 13, NOW() - INTERVAL '4 days'),

-- Reviews for Health Monitoring System
INSERT INTO marketplace_reviews (id, project_id, reviewer_id, rating, review_text, helpful_count, created_at) VALUES
('review-013', 'mp-004', 'enduser-001', 4, 'Good health monitoring system. Tracks vital signs accurately and provides useful health insights.', 5, NOW() - INTERVAL '17 days'),
('review-014', 'mp-004', 'enduser-003', 4, 'Solid health tracking platform. The integration with wearable devices works well.', 8, NOW() - INTERVAL '14 days'),
('review-015', 'mp-004', 'enduser-005', 5, 'Excellent health monitoring tool! The AI insights are very helpful for maintaining wellness goals.', 10, NOW() - INTERVAL '11 days'),

-- Reviews for Language Learning Bot
INSERT INTO marketplace_reviews (id, project_id, reviewer_id, rating, review_text, helpful_count, created_at) VALUES
('review-016', 'mp-006', 'enduser-002', 5, 'Amazing language learning bot! The personalized lessons are perfect and pronunciation feedback is very accurate.', 14, NOW() - INTERVAL '9 days'),
('review-017', 'mp-006', 'enduser-004', 4, 'Great language learning assistant. The cultural context feature adds valuable depth to the learning experience.', 6, NOW() - INTERVAL '7 days'),
('review-018', 'mp-006', 'enduser-005', 5, 'Outstanding language learning tool! The AI adapts perfectly to my learning pace and style.', 12, NOW() - INTERVAL '5 days');

-- ============================================================================
-- CREATE SAMPLE DOWNLOADS
-- ============================================================================

-- Downloads for AI Chat Assistant Pro
INSERT INTO marketplace_downloads (id, project_id, user_id, download_type, downloaded_at) VALUES
('download-001', 'mp-001', 'enduser-001', 'purchase', NOW() - INTERVAL '20 days'),
('download-002', 'mp-001', 'enduser-002', 'purchase', NOW() - INTERVAL '18 days'),
('download-003', 'mp-001', 'enduser-003', 'purchase', NOW() - INTERVAL '15 days'),
('download-004', 'mp-001', 'enduser-004', 'purchase', NOW() - INTERVAL '12 days'),
('download-005', 'mp-001', 'enduser-005', 'purchase', NOW() - INTERVAL '10 days'),
('download-006', 'mp-001', 'enduser-001', 'update', NOW() - INTERVAL '5 days'),
('download-007', 'mp-001', 'enduser-002', 'update', NOW() - INTERVAL '3 days'),

-- Downloads for Data Analytics Dashboard
INSERT INTO marketplace_downloads (id, project_id, user_id, download_type, downloaded_at) VALUES
('download-008', 'mp-002', 'enduser-001', 'purchase', NOW() - INTERVAL '17 days'),
('download-009', 'mp-002', 'enduser-002', 'purchase', NOW() - INTERVAL '14 days'),
('download-010', 'mp-002', 'enduser-003', 'purchase', NOW() - INTERVAL '11 days'),
('download-011', 'mp-002', 'enduser-001', 'update', NOW() - INTERVAL '4 days'),

-- Downloads for E-commerce Bot
INSERT INTO marketplace_downloads (id, project_id, user_id, download_type, downloaded_at) VALUES
('download-012', 'mp-003', 'enduser-001', 'purchase', NOW() - INTERVAL '12 days'),
('download-013', 'mp-003', 'enduser-002', 'purchase', NOW() - INTERVAL '10 days'),
('download-014', 'mp-003', 'enduser-004', 'purchase', NOW() - INTERVAL '8 days'),
('download-015', 'mp-003', 'enduser-005', 'purchase', NOW() - INTERVAL '6 days'),
('download-016', 'mp-003', 'enduser-001', 'update', NOW() - INTERVAL '2 days');

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
    purchase_count INTEGER;
    review_count INTEGER;
    download_count INTEGER;
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
    
    -- Count purchases
    SELECT COUNT(*) INTO purchase_count FROM marketplace_purchases;
    RAISE NOTICE 'Created % sample purchases', purchase_count;
    
    -- Count reviews
    SELECT COUNT(*) INTO review_count FROM marketplace_reviews;
    RAISE NOTICE 'Created % sample reviews', review_count;
    
    -- Count downloads
    SELECT COUNT(*) INTO download_count FROM marketplace_downloads;
    RAISE NOTICE 'Created % sample downloads', download_count;
    
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
    (SELECT COUNT(*) FROM marketplace_projects WHERE status = 'active' AND approval_status = 'approved') as active_approved_projects,
    (SELECT COUNT(*) FROM marketplace_projects WHERE approval_status = 'pending') as pending_projects,
    (SELECT COUNT(*) FROM marketplace_purchases) as total_purchases,
    (SELECT COUNT(*) FROM marketplace_reviews) as total_reviews,
    (SELECT COUNT(*) FROM marketplace_downloads) as total_downloads;

RAISE NOTICE 'Real Marketplace sample data generation completed successfully!';
