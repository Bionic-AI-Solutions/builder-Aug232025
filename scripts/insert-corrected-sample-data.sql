-- Insert Sample Data with Corrected Relationships
-- This script inserts sample data following the corrected data model:
-- - Admin manages LLM Models and MCP Servers
-- - Builders own Projects with 1 LLM, 1 Prompt, 1 Knowledge Base
-- - Projects can have multiple MCP Server connections
-- - Users only consume projects

-- ============================================================================
-- INSERT SAMPLE USERS WITH CORRECT PERSONAS
-- ============================================================================

-- Clear existing data first
DELETE FROM project_mcp_servers;
DELETE FROM marketplace_projects;
DELETE FROM marketplace_reviews;
DELETE FROM marketplace_purchases;
DELETE FROM marketplace_downloads;
DELETE FROM knowledge_bases;
DELETE FROM prompts;
DELETE FROM projects;
DELETE FROM llm_models;
DELETE FROM mcp_servers;
DELETE FROM users;

-- Insert users with correct personas
INSERT INTO users (id, email, password_hash, persona, name, is_active, approval_status, created_at) VALUES
-- Admin users (manage LLM models and MCP servers)
('admin-001', 'admin@builderai.com', '$2b$10$hashed_password_here', 'super_admin', 'Admin User', 'true', 'approved', NOW() - INTERVAL '30 days'),
('admin-002', 'admin2@builderai.com', '$2b$10$hashed_password_here', 'super_admin', 'System Admin', 'true', 'approved', NOW() - INTERVAL '25 days'),

-- Builder users (own projects)
('builder-001', 'builder1@example.com', '$2b$10$hashed_password_here', 'builder', 'John Builder', 'true', 'approved', NOW() - INTERVAL '20 days'),
('builder-002', 'builder2@example.com', '$2b$10$hashed_password_here', 'builder', 'Sarah Developer', 'true', 'approved', NOW() - INTERVAL '18 days'),
('builder-003', 'builder3@example.com', '$2b$10$hashed_password_here', 'builder', 'Mike Creator', 'true', 'approved', NOW() - INTERVAL '15 days'),
('builder-004', 'builder4@example.com', '$2b$10$hashed_password_here', 'builder', 'Lisa Innovator', 'true', 'pending', NOW() - INTERVAL '10 days'),

-- End user users (only consume projects)
('user-001', 'user1@example.com', '$2b$10$hashed_password_here', 'end_user', 'Alice Consumer', 'true', 'approved', NOW() - INTERVAL '5 days'),
('user-002', 'user2@example.com', '$2b$10$hashed_password_here', 'end_user', 'Bob Customer', 'true', 'approved', NOW() - INTERVAL '3 days'),
('user-003', 'user3@example.com', '$2b$10$hashed_password_here', 'end_user', 'Carol User', 'true', 'approved', NOW() - INTERVAL '2 days'),
('user-004', 'user4@example.com', '$2b$10$hashed_password_here', 'end_user', 'David Buyer', 'true', 'approved', NOW() - INTERVAL '1 day'),
('user-005', 'user5@example.com', '$2b$10$hashed_password_here', 'end_user', 'Eva Shopper', 'true', 'approved', NOW());

-- ============================================================================
-- INSERT LLM MODELS (MANAGED BY ADMIN)
-- ============================================================================

INSERT INTO llm_models (id, name, display_name, provider, model, type, status, context_length, max_tokens, pricing, capabilities, configuration, created_by) VALUES
('llm-001', 'GPT-4 Turbo', 'GPT-4 Turbo', 'openai', 'gpt-4-turbo', 'chat', 'active', 128000, 4096, '{"input": 0.01, "output": 0.03}', '["chat", "code", "analysis", "reasoning"]', '{"api_key": "encrypted_key", "endpoint": "https://api.openai.com/v1"}', 'admin-001'),
('llm-002', 'Claude 3 Opus', 'Claude 3 Opus', 'anthropic', 'claude-3-opus-20240229', 'chat', 'active', 200000, 4096, '{"input": 0.015, "output": 0.075}', '["chat", "code", "analysis", "creative"]', '{"api_key": "encrypted_key", "endpoint": "https://api.anthropic.com"}', 'admin-001'),
('llm-003', 'Gemini Pro 1.5', 'Gemini Pro 1.5', 'google', 'gemini-1.5-pro', 'chat', 'active', 1000000, 8192, '{"input": 0.001, "output": 0.002}', '["chat", "multimodal", "code", "analysis"]', '{"api_key": "encrypted_key", "endpoint": "https://generativelanguage.googleapis.com"}', 'admin-002'),
('llm-004', 'GPT-3.5 Turbo', 'GPT-3.5 Turbo', 'openai', 'gpt-3.5-turbo', 'chat', 'active', 16384, 4096, '{"input": 0.0015, "output": 0.002}', '["chat", "code", "analysis"]', '{"api_key": "encrypted_key", "endpoint": "https://api.openai.com/v1"}', 'admin-001'),
('llm-005', 'Claude 3 Sonnet', 'Claude 3 Sonnet', 'anthropic', 'claude-3-sonnet-20240229', 'chat', 'active', 200000, 4096, '{"input": 0.003, "output": 0.015}', '["chat", "code", "analysis"]', '{"api_key": "encrypted_key", "endpoint": "https://api.anthropic.com"}', 'admin-002');

-- ============================================================================
-- INSERT MCP SERVERS (MANAGED BY ADMIN)
-- ============================================================================

INSERT INTO mcp_servers (id, name, type, url, description, status, configuration, latency, created_by) VALUES
('mcp-001', 'GitHub Integration', 'sse', 'https://github-mcp.example.com', 'GitHub API integration for code management and repository access', 'active', '{"auth_token": "encrypted_token", "webhook_secret": "secret", "allowed_orgs": ["myorg"]}', 45, 'admin-001'),
('mcp-002', 'Database Connector', 'websocket', 'wss://db-mcp.example.com', 'Database connectivity and query execution for PostgreSQL, MySQL, MongoDB', 'active', '{"connection_string": "encrypted_conn", "ssl_cert": "cert", "supported_dbs": ["postgres", "mysql", "mongodb"]}', 23, 'admin-001'),
('mcp-003', 'File System Manager', 'stdio', NULL, 'Local and remote file system operations with security controls', 'active', '{"allowed_paths": ["/tmp", "/uploads", "/data"], "max_file_size": 10485760, "supported_formats": ["txt", "json", "pdf", "docx"]}', 5, 'admin-002'),
('mcp-004', 'Email Service', 'sse', 'https://email-mcp.example.com', 'Email sending and management with templates and tracking', 'active', '{"smtp_config": "encrypted", "tracking_enabled": true, "daily_limit": 1000}', 67, 'admin-002'),
('mcp-005', 'Weather API', 'sse', 'https://weather-mcp.example.com', 'Real-time weather data and forecasts from multiple providers', 'active', '{"api_keys": "encrypted", "providers": ["openweather", "accuweather"], "cache_ttl": 300}', 89, 'admin-001');

-- ============================================================================
-- INSERT PROJECTS (OWNED BY BUILDERS)
-- ============================================================================

INSERT INTO projects (id, user_id, name, description, status, category, tags, llm_model_id, marketplace_price, marketplace_description, published) VALUES
('project-001', 'builder-001', 'AI Customer Support Assistant', 'Intelligent customer support chatbot with multi-channel integration and knowledge base', 'completed', 'business', '["ai", "chatbot", "customer-service", "automation"]', 'llm-001', 2500, 'Complete customer support automation solution', 'true'),
('project-002', 'builder-001', 'Data Analytics Dashboard', 'Real-time analytics visualization with interactive charts and custom reports', 'completed', 'business', '["analytics", "dashboard", "data", "visualization"]', 'llm-002', 1800, 'Transform your data into actionable insights', 'true'),
('project-003', 'builder-002', 'Health Monitoring System', 'Comprehensive health tracking with wearable integration and AI insights', 'completed', 'health', '["health", "monitoring", "fitness", "ai"]', 'llm-003', 2200, 'Monitor vital signs and get personalized health insights', 'true'),
('project-004', 'builder-002', 'Language Learning Companion', 'AI-powered language learning with personalized lessons and pronunciation feedback', 'completed', 'education', '["education", "language", "learning", "ai"]', 'llm-004', 1500, 'Master new languages with AI assistance', 'true'),
('project-005', 'builder-003', 'Recipe Generator & Meal Planner', 'AI recipe creation with dietary restrictions and ingredient optimization', 'completed', 'lifestyle', '["cooking", "recipes", "meal-planning", "ai"]', 'llm-005', 1200, 'Discover perfect recipes based on your ingredients', 'true'),
('project-006', 'builder-003', 'Travel Itinerary Planner', 'Intelligent travel planning with budget optimization and recommendations', 'development', 'lifestyle', '["travel", "planning", "itinerary", "ai"]', 'llm-001', 1600, 'Plan perfect trips with AI assistance', 'false');

-- ============================================================================
-- INSERT PROMPTS (ONE PER PROJECT, CREATED BY BUILDER)
-- ============================================================================

INSERT INTO prompts (id, project_id, title, content, variables, is_active) VALUES
('prompt-001', 'project-001', 'Customer Support Assistant', 'You are a helpful customer service assistant for {{company_name}}. Help customers with their {{service_type}} inquiries in a professional and friendly manner. Always be polite, accurate, and provide clear solutions.

Company Information:
- Company: {{company_name}}
- Services: {{service_type}}
- Support Hours: 24/7
- Contact: support@{{company_name}}.com

Guidelines:
1. Always greet customers warmly
2. Listen to their concerns carefully
3. Provide accurate information
4. Escalate complex issues to human agents
5. Follow up to ensure satisfaction

Current customer inquiry: {{customer_message}}', '{"company_name": "string", "service_type": "string", "customer_message": "string"}', 'true'),

('prompt-002', 'project-002', 'Data Analyst Assistant', 'You are an expert data analyst. Analyze the provided {{data_type}} and provide insights about {{analysis_focus}}. Present your findings in a clear, structured format with actionable recommendations.

Data Context:
- Type: {{data_type}}
- Focus Area: {{analysis_focus}}
- Time Period: {{time_period}}
- Key Metrics: {{key_metrics}}

Analysis Framework:
1. Data Overview and Quality Assessment
2. Key Trends and Patterns
3. Statistical Insights and Correlations
4. Predictive Analysis and Forecasting
5. Actionable Recommendations

Please structure your response with:
- Executive Summary
- Key Findings
- Visual Recommendations
- Next Steps', '{"data_type": "string", "analysis_focus": "string", "time_period": "string", "key_metrics": "string"}', 'true'),

('prompt-003', 'project-003', 'Health Advisor Assistant', 'You are a health advisor assistant. Provide personalized health insights based on {{health_data}} and {{user_goals}}. Always recommend consulting healthcare professionals for medical advice.

User Profile:
- Age: {{user_age}}
- Health Goals: {{user_goals}}
- Current Health Data: {{health_data}}
- Medical History: {{medical_history}}

Guidelines:
1. Provide evidence-based health information
2. Encourage healthy lifestyle choices
3. Recommend professional medical consultation
4. Respect user privacy and data security
5. Focus on wellness and prevention

Health Analysis Request: {{health_query}}', '{"user_age": "number", "user_goals": "string", "health_data": "string", "medical_history": "string", "health_query": "string"}', 'true'),

('prompt-004', 'project-004', 'Language Learning Assistant', 'You are a language learning assistant helping users master {{target_language}}. Create personalized lessons based on their {{current_level}} and {{learning_goals}}.

Learning Profile:
- Target Language: {{target_language}}
- Current Level: {{current_level}}
- Learning Goals: {{learning_goals}}
- Preferred Learning Style: {{learning_style}}
- Available Time: {{available_time}}

Lesson Structure:
1. Vocabulary Building
2. Grammar Practice
3. Conversation Practice
4. Cultural Context
5. Progress Assessment

Current Lesson Topic: {{lesson_topic}}', '{"target_language": "string", "current_level": "string", "learning_goals": "string", "learning_style": "string", "available_time": "string", "lesson_topic": "string"}', 'true'),

('prompt-005', 'project-005', 'Recipe Creation Assistant', 'You are a culinary assistant. Create delicious recipes based on available {{ingredients}}, considering {{dietary_restrictions}} and {{cooking_skill_level}}.

Recipe Requirements:
- Available Ingredients: {{ingredients}}
- Dietary Restrictions: {{dietary_restrictions}}
- Cooking Skill Level: {{cooking_skill_level}}
- Cuisine Preference: {{cuisine_type}}
- Meal Type: {{meal_type}}

Recipe Structure:
1. Ingredient Analysis and Optimization
2. Recipe Creation with Instructions
3. Nutritional Information
4. Cooking Tips and Variations
5. Storage and Reheating Guidelines

Recipe Request: {{recipe_request}}', '{"ingredients": "string", "dietary_restrictions": "string", "cooking_skill_level": "string", "cuisine_type": "string", "meal_type": "string", "recipe_request": "string"}', 'true');

-- ============================================================================
-- INSERT KNOWLEDGE BASES (ONE PER PROJECT, CREATED BY BUILDER)
-- ============================================================================

INSERT INTO knowledge_bases (id, project_id, name, type, configuration, documents, status) VALUES
('kb-001', 'project-001', 'Customer Support Knowledge Base', 'rag', '{"chunk_size": 512, "overlap": 50, "embedding_model": "text-embedding-ada-002", "vector_dimension": 1536}', '[{"name": "faq.pdf", "size": "2.5MB", "type": "application/pdf", "url": "/docs/faq.pdf"}, {"name": "policies.txt", "size": "150KB", "type": "text/plain", "url": "/docs/policies.txt"}, {"name": "troubleshooting.json", "size": "1.2MB", "type": "application/json", "url": "/docs/troubleshooting.json"}]', 'active'),
('kb-002', 'project-002', 'Analytics Knowledge Base', 'vector_db', '{"vector_dimension": 1536, "metric": "cosine", "index_type": "hnsw", "chunk_size": 1000}', '[{"name": "reports.zip", "size": "45MB", "type": "application/zip", "url": "/data/reports.zip"}, {"name": "dashboards.json", "size": "2.1MB", "type": "application/json", "url": "/data/dashboards.json"}]', 'active'),
('kb-003', 'project-003', 'Health & Wellness Knowledge Base', 'rag', '{"chunk_size": 256, "overlap": 25, "embedding_model": "text-embedding-ada-002"}', '[{"name": "nutrition_guide.pdf", "size": "5.2MB", "type": "application/pdf", "url": "/health/nutrition.pdf"}, {"name": "exercise_database.json", "size": "3.7MB", "type": "application/json", "url": "/health/exercises.json"}, {"name": "medical_glossary.txt", "size": "890KB", "type": "text/plain", "url": "/health/glossary.txt"}]', 'active'),
('kb-004', 'project-004', 'Language Learning Resources', 'rag', '{"chunk_size": 300, "overlap": 30, "embedding_model": "text-embedding-ada-002"}', '[{"name": "vocabulary_sets.json", "size": "1.8MB", "type": "application/json", "url": "/language/vocab.json"}, {"name": "grammar_rules.pdf", "size": "3.4MB", "type": "application/pdf", "url": "/language/grammar.pdf"}, {"name": "cultural_context.txt", "size": "650KB", "type": "text/plain", "url": "/language/culture.txt"}]', 'active'),
('kb-005', 'project-005', 'Culinary Knowledge Base', 'rag', '{"chunk_size": 400, "overlap": 40, "embedding_model": "text-embedding-ada-002"}', '[{"name": "recipe_database.json", "size": "12MB", "type": "application/json", "url": "/cooking/recipes.json"}, {"name": "ingredient_guide.pdf", "size": "2.8MB", "type": "application/pdf", "url": "/cooking/ingredients.pdf"}, {"name": "cooking_techniques.txt", "size": "1.1MB", "type": "text/plain", "url": "/cooking/techniques.txt"}]', 'active');

-- ============================================================================
-- LINK PROJECTS TO MCP SERVERS (MANY-TO-MANY)
-- ============================================================================

INSERT INTO project_mcp_servers (project_id, mcp_server_id, configuration, is_active) VALUES
-- Customer Support Assistant connections
('project-001', 'mcp-001', '{"permissions": ["read", "write"], "repositories": ["support-docs"]}', 'true'), -- GitHub for documentation
('project-001', 'mcp-003', '{"allowed_operations": ["read", "search"], "file_types": ["pdf", "txt"]}', 'true'), -- File System for knowledge base
('project-001', 'mcp-004', '{"templates": ["support_response", "escalation"], "tracking": true}', 'true'), -- Email for notifications

-- Data Analytics Dashboard connections
('project-002', 'mcp-002', '{"read_only": true, "query_timeout": 30}', 'true'), -- Database for data access
('project-002', 'mcp-003', '{"allowed_operations": ["read"], "export_formats": ["csv", "json"]}', 'true'), -- File System for data export

-- Health Monitoring System connections
('project-003', 'mcp-002', '{"read_only": true, "tables": ["health_data", "user_profiles"]}', 'true'), -- Database for health records
('project-003', 'mcp-005', '{"cache_enabled": true, "location_precision": "city"}', 'true'), -- Weather API for outdoor activity suggestions

-- Language Learning Companion connections
('project-004', 'mcp-003', '{"allowed_operations": ["read", "write"], "file_types": ["mp3", "txt"]}', 'true'), -- File System for audio files
('project-004', 'mcp-002', '{"read_only": true, "tables": ["vocabulary", "progress"]}', 'true'), -- Database for learning progress

-- Recipe Generator connections
('project-005', 'mcp-002', '{"read_only": true, "tables": ["ingredients", "recipes", "nutrition"]}', 'true'), -- Database for recipe data
('project-005', 'mcp-003', '{"allowed_operations": ["read"], "file_types": ["jpg", "png"]}', 'true'); -- File System for recipe images

-- ============================================================================
-- INSERT MARKETPLACE PROJECTS
-- ============================================================================

INSERT INTO marketplace_projects (id, project_id, builder_id, title, description, price, category, tags, status, approval_status, featured, rating, review_count, download_count, revenue, mcp_servers, published_at) VALUES
('mp-001', 'project-001', 'builder-001', 'AI Customer Support Assistant', 'Intelligent customer support chatbot with multi-channel integration and knowledge base. Perfect for customer service automation and business communication.', 2500, 'business', '["ai", "chatbot", "automation", "customer-service"]', 'active', 'approved', true, 4.5, 12, 45, 11250, '["GitHub Integration", "File System Manager", "Email Service"]', NOW() - INTERVAL '25 days'),
('mp-002', 'project-002', 'builder-001', 'Data Analytics Dashboard', 'Real-time analytics visualization with interactive charts. Transform your data into actionable insights with beautiful, customizable dashboards.', 1800, 'business', '["analytics", "dashboard", "data", "visualization"]', 'active', 'approved', false, 4.2, 8, 23, 4140, '["Database Connector", "File System Manager"]', NOW() - INTERVAL '20 days'),
('mp-003', 'project-003', 'builder-002', 'Health Monitoring System', 'Comprehensive health tracking with wearable integration and AI insights. Monitor vital signs and track fitness goals.', 2200, 'health', '["health", "monitoring", "fitness", "ai"]', 'active', 'approved', false, 4.3, 10, 34, 7480, '["Database Connector", "Weather API"]', NOW() - INTERVAL '23 days'),
('mp-004', 'project-004', 'builder-002', 'Language Learning Companion', 'AI-powered language learning with personalized lessons and pronunciation feedback. Master new languages with AI assistance.', 1500, 'education', '["education", "language", "learning", "ai"]', 'active', 'approved', true, 4.6, 14, 52, 7800, '["File System Manager", "Database Connector"]', NOW() - INTERVAL '18 days'),
('mp-005', 'project-005', 'builder-003', 'Recipe Generator & Meal Planner', 'AI recipe creation with dietary restrictions and ingredient optimization. Discover perfect recipes based on your ingredients.', 1200, 'lifestyle', '["cooking", "recipes", "meal-planning", "ai"]', 'active', 'approved', false, 4.0, 5, 12, 1440, '["Database Connector", "File System Manager"]', NOW() - INTERVAL '21 days');

-- ============================================================================
-- UPDATE PROJECT REFERENCES
-- ============================================================================

-- Update projects with their component IDs
UPDATE projects SET prompt_id = 'prompt-001', knowledge_base_id = 'kb-001' WHERE id = 'project-001';
UPDATE projects SET prompt_id = 'prompt-002', knowledge_base_id = 'kb-002' WHERE id = 'project-002';
UPDATE projects SET prompt_id = 'prompt-003', knowledge_base_id = 'kb-003' WHERE id = 'project-003';
UPDATE projects SET prompt_id = 'prompt-004', knowledge_base_id = 'kb-004' WHERE id = 'project-004';
UPDATE projects SET prompt_id = 'prompt-005', knowledge_base_id = 'kb-005' WHERE id = 'project-005';

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

DO $$
DECLARE
    user_count INTEGER;
    project_count INTEGER;
    llm_count INTEGER;
    mcp_count INTEGER;
    prompt_count INTEGER;
    kb_count INTEGER;
    marketplace_count INTEGER;
    mcp_connection_count INTEGER;
BEGIN
    -- Count records
    SELECT COUNT(*) INTO user_count FROM users;
    SELECT COUNT(*) INTO project_count FROM projects;
    SELECT COUNT(*) INTO llm_count FROM llm_models;
    SELECT COUNT(*) INTO mcp_count FROM mcp_servers;
    SELECT COUNT(*) INTO prompt_count FROM prompts;
    SELECT COUNT(*) INTO kb_count FROM knowledge_bases;
    SELECT COUNT(*) INTO marketplace_count FROM marketplace_projects;
    SELECT COUNT(*) INTO mcp_connection_count FROM project_mcp_servers;

    RAISE NOTICE 'Sample data insertion completed successfully!';
    RAISE NOTICE 'Users: % (Admins: %, Builders: %, End Users: %)',
        user_count,
        (SELECT COUNT(*) FROM users WHERE persona = 'super_admin'),
        (SELECT COUNT(*) FROM users WHERE persona = 'builder'),
        (SELECT COUNT(*) FROM users WHERE persona = 'end_user');
    RAISE NOTICE 'Projects: %', project_count;
    RAISE NOTICE 'LLM Models: %', llm_count;
    RAISE NOTICE 'MCP Servers: %', mcp_count;
    RAISE NOTICE 'Prompts: %', prompt_count;
    RAISE NOTICE 'Knowledge Bases: %', kb_count;
    RAISE NOTICE 'Marketplace Projects: %', marketplace_count;
    RAISE NOTICE 'Project-MCP Connections: %', mcp_connection_count;

    -- Verify relationships
    IF NOT EXISTS (
        SELECT 1 FROM projects p
        JOIN users u ON p.user_id = u.id
        WHERE u.persona = 'builder'
        LIMIT 1
    ) THEN
        RAISE EXCEPTION 'Projects must be owned by builders!';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM llm_models lm
        JOIN users u ON lm.created_by = u.id
        WHERE u.persona = 'super_admin'
        LIMIT 1
    ) THEN
        RAISE EXCEPTION 'LLM models must be created by admins!';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM mcp_servers ms
        JOIN users u ON ms.created_by = u.id
        WHERE u.persona = 'super_admin'
        LIMIT 1
    ) THEN
        RAISE EXCEPTION 'MCP servers must be created by admins!';
    END IF;

    RAISE NOTICE 'All data integrity checks passed!';
END $$;

-- ============================================================================
-- DISPLAY SUMMARY
-- ============================================================================

SELECT
    'Data Summary' as info,
    (SELECT COUNT(*) FROM users WHERE persona = 'super_admin') as admin_users,
    (SELECT COUNT(*) FROM users WHERE persona = 'builder') as builder_users,
    (SELECT COUNT(*) FROM users WHERE persona = 'end_user') as end_users,
    (SELECT COUNT(*) FROM projects) as projects,
    (SELECT COUNT(*) FROM llm_models) as llm_models,
    (SELECT COUNT(*) FROM mcp_servers) as mcp_servers,
    (SELECT COUNT(*) FROM prompts) as prompts,
    (SELECT COUNT(*) FROM knowledge_bases) as knowledge_bases,
    (SELECT COUNT(*) FROM marketplace_projects) as marketplace_projects,
    (SELECT COUNT(*) FROM project_mcp_servers) as mcp_connections;

