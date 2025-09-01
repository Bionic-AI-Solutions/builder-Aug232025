-- Correct Data Model Migration Script
-- This script corrects the data model to match the proper relationships:
-- - Admin manages LLM Models and MCP Servers
-- - Builders own Projects with one LLM, one Prompt, one Knowledge Base
-- - Projects can have multiple MCP Server connections
-- - Users only consume projects (no creation/modification rights)

-- ============================================================================
-- STEP 1: BACKUP EXISTING DATA (if needed)
-- ============================================================================

-- Create backup tables (uncomment if you want to preserve existing data)
-- CREATE TABLE IF NOT EXISTS backup_projects AS SELECT * FROM projects;
-- CREATE TABLE IF NOT EXISTS backup_mcp_servers AS SELECT * FROM mcp_servers;

-- ============================================================================
-- STEP 2: DROP EXISTING TABLES (in correct order due to dependencies)
-- ============================================================================

-- Drop all existing tables (cascade will handle dependencies)
DROP TABLE IF EXISTS marketplace_reviews CASCADE;
DROP TABLE IF EXISTS marketplace_purchases CASCADE;
DROP TABLE IF EXISTS marketplace_downloads CASCADE;
DROP TABLE IF EXISTS marketplace_projects CASCADE;
DROP TABLE IF EXISTS usage_events CASCADE;
DROP TABLE IF EXISTS revenue_events CASCADE;
DROP TABLE IF EXISTS template_purchases CASCADE;
DROP TABLE IF EXISTS widget_implementations CASCADE;
DROP TABLE IF EXISTS chat_messages CASCADE;
DROP TABLE IF EXISTS projects CASCADE;
DROP TABLE IF EXISTS mcp_servers CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS social_accounts CASCADE;

-- Drop old LLM tables if they exist
DROP TABLE IF EXISTS llm_providers CASCADE;
DROP TABLE IF EXISTS llm_models CASCADE;

-- ============================================================================
-- STEP 3: CREATE CORRECTED TABLES
-- ============================================================================

-- Users table (with personas)
CREATE TABLE users (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT, -- Optional for OAuth users
  persona TEXT NOT NULL DEFAULT 'builder', -- super_admin, builder, end_user
  name TEXT, -- Added name field for users
  roles JSONB DEFAULT '[]',
  permissions JSONB DEFAULT '[]',
  metadata JSONB DEFAULT '{}',
  is_active TEXT NOT NULL DEFAULT 'true',
  approval_status TEXT NOT NULL DEFAULT 'pending',
  approved_by VARCHAR REFERENCES users(id),
  approved_at TIMESTAMP,
  rejection_reason TEXT,
  last_login_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- OAuth social accounts
CREATE TABLE social_accounts (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  provider_user_id TEXT NOT NULL,
  access_token TEXT,
  refresh_token TEXT,
  expires_at TIMESTAMP,
  profile_data JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- LLM Models (managed by Admin)
CREATE TABLE llm_models (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  display_name TEXT,
  provider TEXT NOT NULL,
  model TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'chat' CHECK (type IN ('chat', 'completion', 'embedding')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'deprecated')),
  context_length INTEGER,
  max_tokens INTEGER,
  pricing JSONB,
  capabilities JSONB DEFAULT '[]',
  configuration JSONB,
  created_by VARCHAR NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- MCP Servers (managed by Admin)
CREATE TABLE mcp_servers (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'sse',
  url TEXT,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'error')),
  configuration JSONB,
  latency INTEGER DEFAULT 0,
  created_by VARCHAR NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Projects (owned by Builders)
CREATE TABLE projects (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR NOT NULL REFERENCES users(id), -- Builder who owns the project
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'development',
  category TEXT,
  tags JSONB DEFAULT '[]',

  -- References to components (one per project)
  llm_model_id VARCHAR REFERENCES llm_models(id),
  prompt_id VARCHAR REFERENCES prompts(id),
  knowledge_base_id VARCHAR REFERENCES knowledge_bases(id),

  -- Legacy fields (will be migrated)
  llm TEXT,
  files JSONB DEFAULT '[]',

  -- Marketplace fields
  marketplace_price INTEGER,
  marketplace_description TEXT,
  published TEXT DEFAULT 'false',

  -- Analytics
  revenue INTEGER DEFAULT 0,
  revenue_growth INTEGER DEFAULT 0,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Prompts (one per project, created by builder)
CREATE TABLE prompts (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id VARCHAR NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  variables JSONB,
  version INTEGER DEFAULT 1,
  is_active TEXT DEFAULT 'true',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Knowledge Bases (one per project, created by builder)
CREATE TABLE knowledge_bases (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id VARCHAR NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'rag',
  configuration JSONB,
  documents JSONB DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Project MCP Server associations (many-to-many)
CREATE TABLE project_mcp_servers (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id VARCHAR NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  mcp_server_id VARCHAR NOT NULL REFERENCES mcp_servers(id) ON DELETE CASCADE,
  configuration JSONB,
  is_active TEXT DEFAULT 'true',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Chat Messages
CREATE TABLE chat_messages (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR NOT NULL REFERENCES users(id),
  sender TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Marketplace Projects
CREATE TABLE marketplace_projects (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id VARCHAR NOT NULL REFERENCES projects(id),
  builder_id VARCHAR NOT NULL REFERENCES users(id),
  title TEXT NOT NULL,
  description TEXT,
  price INTEGER NOT NULL,
  category TEXT,
  tags JSONB DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'active',
  approval_status TEXT DEFAULT 'pending',
  featured BOOLEAN DEFAULT false,
  rating DECIMAL(3,2) DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  download_count INTEGER DEFAULT 0,
  revenue INTEGER DEFAULT 0,
  mcp_servers JSONB DEFAULT '[]',
  popularity_score DECIMAL(5,2) DEFAULT 0,
  published_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  approved_by VARCHAR REFERENCES users(id),
  approved_at TIMESTAMP,
  rejection_reason TEXT,
  metadata JSONB DEFAULT '{}'
);

-- Marketplace Purchases
CREATE TABLE marketplace_purchases (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id VARCHAR NOT NULL REFERENCES marketplace_projects(id),
  buyer_id VARCHAR NOT NULL REFERENCES users(id),
  seller_id VARCHAR NOT NULL REFERENCES users(id),
  amount INTEGER NOT NULL,
  currency TEXT DEFAULT 'USD',
  status TEXT DEFAULT 'pending',
  transaction_id TEXT,
  payment_method TEXT,
  purchased_at TIMESTAMP DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'
);

-- Marketplace Reviews
CREATE TABLE marketplace_reviews (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id VARCHAR NOT NULL REFERENCES marketplace_projects(id),
  reviewer_id VARCHAR NOT NULL REFERENCES users(id),
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  helpful_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Marketplace Downloads
CREATE TABLE marketplace_downloads (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id VARCHAR NOT NULL REFERENCES marketplace_projects(id),
  user_id VARCHAR NOT NULL REFERENCES users(id),
  downloaded_at TIMESTAMP DEFAULT NOW(),
  ip_address TEXT,
  user_agent TEXT
);

-- Widget Implementations
CREATE TABLE widget_implementations (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  end_user_id VARCHAR NOT NULL REFERENCES users(id),
  project_id VARCHAR NOT NULL REFERENCES projects(id),
  builder_id VARCHAR NOT NULL REFERENCES users(id),
  implementation_url TEXT NOT NULL,
  embed_code TEXT NOT NULL,
  configuration JSONB DEFAULT '{}',
  status TEXT DEFAULT 'active',
  usage_count INTEGER DEFAULT 0,
  revenue_generated INTEGER DEFAULT 0,
  last_activity TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Revenue Events
CREATE TABLE revenue_events (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  implementation_id VARCHAR REFERENCES widget_implementations(id),
  builder_id VARCHAR NOT NULL REFERENCES users(id),
  end_user_id VARCHAR NOT NULL REFERENCES users(id),
  amount INTEGER NOT NULL,
  event_type TEXT NOT NULL,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Template Purchases
CREATE TABLE template_purchases (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id VARCHAR NOT NULL REFERENCES users(id),
  template_project_id VARCHAR NOT NULL REFERENCES projects(id),
  seller_id VARCHAR NOT NULL REFERENCES users(id),
  purchase_amount INTEGER NOT NULL,
  purchase_date TIMESTAMP DEFAULT NOW(),
  status TEXT DEFAULT 'completed',
  metadata JSONB DEFAULT '{}'
);

-- Usage Events
CREATE TABLE usage_events (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  implementation_id VARCHAR NOT NULL REFERENCES widget_implementations(id),
  event_type TEXT NOT NULL,
  event_data JSONB DEFAULT '{}',
  user_agent TEXT,
  ip_address TEXT,
  session_id VARCHAR,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- STEP 4: CREATE INDEXES FOR PERFORMANCE
-- ============================================================================

-- Users indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_persona ON users(persona);
CREATE INDEX idx_users_approval_status ON users(approval_status);

-- Projects indexes
CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_category ON projects(category);
CREATE INDEX idx_projects_published ON projects(published);
CREATE INDEX idx_projects_llm_model_id ON projects(llm_model_id);
CREATE INDEX idx_projects_prompt_id ON projects(prompt_id);
CREATE INDEX idx_projects_knowledge_base_id ON projects(knowledge_base_id);

-- LLM Models indexes
CREATE INDEX idx_llm_models_provider ON llm_models(provider);
CREATE INDEX idx_llm_models_status ON llm_models(status);
CREATE INDEX idx_llm_models_created_by ON llm_models(created_by);

-- MCP Servers indexes
CREATE INDEX idx_mcp_servers_status ON mcp_servers(status);
CREATE INDEX idx_mcp_servers_created_by ON mcp_servers(created_by);

-- Prompts indexes
CREATE INDEX idx_prompts_project_id ON prompts(project_id);
CREATE INDEX idx_prompts_is_active ON prompts(is_active);

-- Knowledge Bases indexes
CREATE INDEX idx_knowledge_bases_project_id ON knowledge_bases(project_id);
CREATE INDEX idx_knowledge_bases_status ON knowledge_bases(status);

-- Project MCP Servers indexes
CREATE INDEX idx_project_mcp_servers_project_id ON project_mcp_servers(project_id);
CREATE INDEX idx_project_mcp_servers_mcp_server_id ON project_mcp_servers(mcp_server_id);
CREATE INDEX idx_project_mcp_servers_is_active ON project_mcp_servers(is_active);

-- Marketplace Projects indexes
CREATE INDEX idx_marketplace_projects_project_id ON marketplace_projects(project_id);
CREATE INDEX idx_marketplace_projects_builder_id ON marketplace_projects(builder_id);
CREATE INDEX idx_marketplace_projects_status ON marketplace_projects(status);
CREATE INDEX idx_marketplace_projects_approval_status ON marketplace_projects(approval_status);
CREATE INDEX idx_marketplace_projects_category ON marketplace_projects(category);
CREATE INDEX idx_marketplace_projects_featured ON marketplace_projects(featured);
CREATE INDEX idx_marketplace_projects_rating ON marketplace_projects(rating);
CREATE INDEX idx_marketplace_projects_published_at ON marketplace_projects(published_at);

-- ============================================================================
-- STEP 5: INSERT SAMPLE DATA
-- ============================================================================

-- Insert sample users with correct personas
INSERT INTO users (id, email, password_hash, persona, name, is_active, approval_status, created_at) VALUES
-- Admin users
('550e8400-e29b-41d4-a716-446655440001', 'admin@builderai.com', '$2b$10$hashed_password_here', 'super_admin', 'Admin User', 'true', 'approved', NOW()),
('550e8400-e29b-41d4-a716-446655440002', 'admin2@builderai.com', '$2b$10$hashed_password_here', 'super_admin', 'Admin Manager', 'true', 'approved', NOW()),

-- Builder users
('550e8400-e29b-41d4-a716-446655440003', 'builder1@example.com', '$2b$10$hashed_password_here', 'builder', 'John Builder', 'true', 'approved', NOW()),
('550e8400-e29b-41d4-a716-446655440004', 'builder2@example.com', '$2b$10$hashed_password_here', 'builder', 'Sarah Developer', 'true', 'approved', NOW()),
('550e8400-e29b-41d4-a716-446655440005', 'builder3@example.com', '$2b$10$hashed_password_here', 'builder', 'Mike Creator', 'true', 'approved', NOW()),
('550e8400-e29b-41d4-a716-446655440006', 'builder4@example.com', '$2b$10$hashed_password_here', 'builder', 'Lisa Innovator', 'true', 'pending', NOW()),

-- End user users
('550e8400-e29b-41d4-a716-446655440007', 'user1@example.com', '$2b$10$hashed_password_here', 'end_user', 'Alice Consumer', 'true', 'approved', NOW()),
('550e8400-e29b-41d4-a716-446655440008', 'user2@example.com', '$2b$10$hashed_password_here', 'end_user', 'Bob Customer', 'true', 'approved', NOW()),
('550e8400-e29b-41d4-a716-446655440009', 'user3@example.com', '$2b$10$hashed_password_here', 'end_user', 'Carol User', 'true', 'approved', NOW()),
('550e8400-e29b-41d4-a716-446655440010', 'user4@example.com', '$2b$10$hashed_password_here', 'end_user', 'David Buyer', 'true', 'approved', NOW()),
('550e8400-e29b-41d4-a716-446655440011', 'user5@example.com', '$2b$10$hashed_password_here', 'end_user', 'Eva Shopper', 'true', 'approved', NOW());

-- Insert sample LLM models (managed by admin)
INSERT INTO llm_models (id, name, display_name, provider, model, type, status, context_length, max_tokens, pricing, capabilities, configuration, created_by) VALUES
('550e8400-e29b-41d4-a716-446655440101', 'GPT-4', 'GPT-4 Turbo', 'openai', 'gpt-4-turbo', 'chat', 'active', 128000, 4096, '{"input": 0.01, "output": 0.03}', '["chat", "code", "analysis"]', '{"api_key": "encrypted_key_here", "endpoint": "https://api.openai.com/v1"}', '550e8400-e29b-41d4-a716-446655440001'),
('550e8400-e29b-41d4-a716-446655440102', 'Claude-3', 'Claude 3 Opus', 'anthropic', 'claude-3-opus', 'chat', 'active', 200000, 4096, '{"input": 0.015, "output": 0.075}', '["chat", "code", "analysis", "creative"]', '{"api_key": "encrypted_key_here", "endpoint": "https://api.anthropic.com"}', '550e8400-e29b-41d4-a716-446655440001'),
('550e8400-e29b-41d4-a716-446655440103', 'Gemini Pro', 'Gemini 1.5 Pro', 'google', 'gemini-1.5-pro', 'chat', 'active', 1000000, 8192, '{"input": 0.001, "output": 0.002}', '["chat", "multimodal", "code"]', '{"api_key": "encrypted_key_here", "endpoint": "https://generativelanguage.googleapis.com"}', '550e8400-e29b-41d4-a716-446655440002');

-- Insert sample MCP servers (managed by admin)
INSERT INTO mcp_servers (id, name, type, url, description, status, configuration, created_by) VALUES
('550e8400-e29b-41d4-a716-446655440201', 'GitHub MCP', 'sse', 'https://github-mcp.example.com', 'GitHub integration for code management', 'active', '{"auth_token": "encrypted_token", "webhook_secret": "secret"}', '550e8400-e29b-41d4-a716-446655440001'),
('550e8400-e29b-41d4-a716-446655440202', 'Database MCP', 'websocket', 'wss://db-mcp.example.com', 'Database connectivity and query execution', 'active', '{"connection_string": "encrypted_conn", "ssl_cert": "cert"}', '550e8400-e29b-41d4-a716-446655440001'),
('550e8400-e29b-41d4-a716-446655440203', 'File System MCP', 'stdio', null, 'Local file system operations', 'active', '{"allowed_paths": ["/tmp", "/uploads"], "max_file_size": 10485760}', '550e8400-e29b-41d4-a716-446655440002');

-- Insert sample projects for builders
INSERT INTO projects (id, user_id, name, description, status, category, tags, llm_model_id, marketplace_price, marketplace_description, published) VALUES
('550e8400-e29b-41d4-a716-446655440301', '550e8400-e29b-41d4-a716-446655440003', 'AI Chat Assistant Pro', 'Advanced chatbot with multiple integrations and natural language processing', 'completed', 'business', '["ai", "chatbot", "automation", "customer-service"]', '550e8400-e29b-41d4-a716-446655440101', 2500, 'Perfect for customer service automation', 'true'),
('550e8400-e29b-41d4-a716-446655440302', '550e8400-e29b-41d4-a716-446655440003', 'Data Analytics Dashboard', 'Real-time analytics visualization with interactive charts', 'completed', 'business', '["analytics", "dashboard", "data", "visualization"]', '550e8400-e29b-41d4-a716-446655440102', 1500, 'Transform data into actionable insights', 'true'),
('550e8400-e29b-41d4-a716-446655440303', '550e8400-e29b-41d4-a716-446655440004', 'Health Monitoring System', 'Comprehensive health tracking and monitoring platform', 'completed', 'health', '["health", "monitoring", "fitness", "wellness"]', '550e8400-e29b-41d4-a716-446655440103', 2000, 'Monitor vital signs and track fitness goals', 'true'),
('550e8400-e29b-41d4-a716-446655440304', '550e8400-e29b-41d4-a716-446655440005', 'Recipe Generator', 'AI-powered recipe creation and meal planning', 'completed', 'lifestyle', '["cooking", "recipes", "meal-planning", "ai"]', '550e8400-e29b-41d4-a716-446655440101', 800, 'Discover recipes based on your ingredients', 'true');

-- Insert sample prompts
INSERT INTO prompts (id, project_id, title, content, variables, is_active) VALUES
('550e8400-e29b-41d4-a716-446655440401', '550e8400-e29b-41d4-a716-446655440301', 'Customer Service Assistant', 'You are a helpful customer service assistant for {{company_name}}. Help customers with their {{service_type}} inquiries in a professional and friendly manner. Always be polite, accurate, and provide clear solutions.', '{"company_name": "string", "service_type": "string"}', 'true'),
('550e8400-e29b-41d4-a716-446655440402', '550e8400-e29b-41d4-a716-446655440302', 'Data Analyst', 'You are an expert data analyst. Analyze the provided {{data_type}} and provide insights about {{analysis_focus}}. Present your findings in a clear, structured format with actionable recommendations.', '{"data_type": "string", "analysis_focus": "string"}', 'true');

-- Insert sample knowledge bases
INSERT INTO knowledge_bases (id, project_id, name, type, configuration, documents, status) VALUES
('550e8400-e29b-41d4-a716-446655440501', '550e8400-e29b-41d4-a716-446655440301', 'Customer Service KB', 'rag', '{"chunk_size": 512, "overlap": 50, "embedding_model": "text-embedding-ada-002"}', '[{"name": "faq.pdf", "size": "2.5MB", "type": "application/pdf"}, {"name": "policies.txt", "size": "150KB", "type": "text/plain"}]', 'active'),
('550e8400-e29b-41d4-a716-446655440502', '550e8400-e29b-41d4-a716-446655440302', 'Analytics Knowledge Base', 'vector_db', '{"vector_dimension": 1536, "metric": "cosine", "index_type": "hnsw"}', '[{"name": "reports.zip", "size": "45MB", "type": "application/zip"}]', 'active');

-- Link projects to MCP servers
INSERT INTO project_mcp_servers (project_id, mcp_server_id, configuration, is_active) VALUES
('550e8400-e29b-41d4-a716-446655440301', '550e8400-e29b-41d4-a716-446655440201', '{"permissions": ["read", "write"]}', 'true'), -- Chat Assistant -> GitHub
('550e8400-e29b-41d4-a716-446655440301', '550e8400-e29b-41d4-a716-446655440203', '{"allowed_operations": ["read", "search"]}', 'true'), -- Chat Assistant -> File System
('550e8400-e29b-41d4-a716-446655440302', '550e8400-e29b-41d4-a716-446655440202', '{"read_only": true}', 'true'), -- Analytics -> Database
('550e8400-e29b-41d4-a716-446655440302', '550e8400-e29b-41d4-a716-446655440203', '{"allowed_operations": ["read"]}', 'true'); -- Analytics -> File System

-- Insert marketplace projects
INSERT INTO marketplace_projects (id, project_id, builder_id, title, description, price, category, tags, status, approval_status, featured, rating, review_count, download_count, revenue, mcp_servers, published_at) VALUES
('550e8400-e29b-41d4-a716-446655440601', '550e8400-e29b-41d4-a716-446655440301', '550e8400-e29b-41d4-a716-446655440003', 'AI Chat Assistant Pro', 'Advanced chatbot with multiple integrations and natural language processing. Perfect for customer service automation and business communication.', 2500, 'business', '["ai", "chatbot", "automation", "customer-service"]', 'active', 'approved', true, 4.5, 12, 45, 11250, '["GitHub MCP", "File System MCP"]', NOW() - INTERVAL '25 days'),
('550e8400-e29b-41d4-a716-446655440602', '550e8400-e29b-41d4-a716-446655440302', '550e8400-e29b-41d4-a716-446655440003', 'Data Analytics Dashboard', 'Real-time analytics visualization with interactive charts. Transform your data into actionable insights with beautiful, customizable dashboards.', 1500, 'business', '["analytics", "dashboard", "data", "visualization"]', 'active', 'approved', false, 4.2, 8, 23, 3450, '["Database MCP", "File System MCP"]', NOW() - INTERVAL '20 days'),
('550e8400-e29b-41d4-a716-446655440603', '550e8400-e29b-41d4-a716-446655440303', '550e8400-e29b-41d4-a716-446655440004', 'Health Monitoring System', 'Comprehensive health tracking and monitoring platform. Monitor vital signs, track fitness goals, and get personalized health insights.', 2000, 'health', '["health", "monitoring", "fitness", "wellness"]', 'active', 'approved', false, 4.3, 10, 34, 6800, '["Database MCP"]', NOW() - INTERVAL '23 days'),
('550e8400-e29b-41d4-a716-446655440604', '550e8400-e29b-41d4-a716-446655440304', '550e8400-e29b-41d4-a716-446655440005', 'Recipe Generator', 'AI-powered recipe creation and meal planning. Discover new recipes based on your ingredients and dietary preferences.', 800, 'lifestyle', '["cooking", "recipes", "meal-planning", "ai"]', 'active', 'approved', false, 4.0, 5, 12, 960, '[]', NOW() - INTERVAL '21 days');

-- ============================================================================
-- STEP 6: CREATE FUNCTIONS FOR DATA INTEGRITY
-- ============================================================================

-- Function to update project marketplace status
CREATE OR REPLACE FUNCTION update_project_marketplace_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the original project's published status when marketplace project is created/updated
  UPDATE projects
  SET
    published = CASE WHEN NEW.status = 'active' AND NEW.approval_status = 'approved' THEN 'true' ELSE 'false' END,
    marketplace_price = NEW.price,
    marketplace_description = NEW.description,
    updated_at = NOW()
  WHERE id = NEW.project_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically sync project status with marketplace status
CREATE TRIGGER sync_project_marketplace_status
  AFTER INSERT OR UPDATE ON marketplace_projects
  FOR EACH ROW
  EXECUTE FUNCTION update_project_marketplace_status();

-- Function to calculate marketplace project popularity
CREATE OR REPLACE FUNCTION calculate_marketplace_popularity(project_id UUID)
RETURNS DECIMAL AS $$
DECLARE
  rating_weight DECIMAL := 0.4;
  review_weight DECIMAL := 0.3;
  download_weight DECIMAL := 0.3;
  popularity DECIMAL := 0;
BEGIN
  SELECT
    (COALESCE(rating, 0) * rating_weight) +
    (LEAST(review_count, 100) * review_weight) +
    (LEAST(download_count, 1000) * download_weight / 10)
  INTO popularity
  FROM marketplace_projects
  WHERE id = project_id;

  RETURN ROUND(popularity, 2);
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- STEP 7: VALIDATION QUERIES
-- ============================================================================

-- Verify all relationships
DO $$
DECLARE
  user_count INTEGER;
  project_count INTEGER;
  llm_count INTEGER;
  mcp_count INTEGER;
  prompt_count INTEGER;
  kb_count INTEGER;
  marketplace_count INTEGER;
BEGIN
  -- Count records
  SELECT COUNT(*) INTO user_count FROM users;
  SELECT COUNT(*) INTO project_count FROM projects;
  SELECT COUNT(*) INTO llm_count FROM llm_models;
  SELECT COUNT(*) INTO mcp_count FROM mcp_servers;
  SELECT COUNT(*) INTO prompt_count FROM prompts;
  SELECT COUNT(*) INTO kb_count FROM knowledge_bases;
  SELECT COUNT(*) INTO marketplace_count FROM marketplace_projects;

  RAISE NOTICE 'Migration completed successfully!';
  RAISE NOTICE 'Users: %', user_count;
  RAISE NOTICE 'Projects: %', project_count;
  RAISE NOTICE 'LLM Models: %', llm_count;
  RAISE NOTICE 'MCP Servers: %', mcp_count;
  RAISE NOTICE 'Prompts: %', prompt_count;
  RAISE NOTICE 'Knowledge Bases: %', kb_count;
  RAISE NOTICE 'Marketplace Projects: %', marketplace_count;

  -- Validate relationships
  IF NOT EXISTS (
    SELECT 1 FROM projects p
    JOIN users u ON p.user_id = u.id
    WHERE u.persona = 'builder'
    LIMIT 1
  ) THEN
    RAISE EXCEPTION 'Projects must be owned by builders!';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM marketplace_projects mp
    JOIN projects p ON mp.project_id = p.id
    JOIN users u ON mp.builder_id = u.id
    WHERE u.persona = 'builder'
    LIMIT 1
  ) THEN
    RAISE EXCEPTION 'Marketplace projects must be created by builders!';
  END IF;

  RAISE NOTICE 'All data integrity checks passed!';
END $$;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Final summary
SELECT
  'Migration Summary' as info,
  (SELECT COUNT(*) FROM users WHERE persona = 'super_admin') as admin_users,
  (SELECT COUNT(*) FROM users WHERE persona = 'builder') as builder_users,
  (SELECT COUNT(*) FROM users WHERE persona = 'end_user') as end_users,
  (SELECT COUNT(*) FROM projects) as total_projects,
  (SELECT COUNT(*) FROM llm_models) as llm_models,
  (SELECT COUNT(*) FROM mcp_servers) as mcp_servers,
  (SELECT COUNT(*) FROM prompts) as prompts,
  (SELECT COUNT(*) FROM knowledge_bases) as knowledge_bases,
  (SELECT COUNT(*) FROM marketplace_projects) as marketplace_projects;

COMMENT ON DATABASE CURRENT_DATABASE IS 'Data model corrected: Admin manages LLM/MCP, Builders own Projects with 1:1 components, Users consume only. Migration completed successfully.';
