-- Create missing marketplace tables and sample data
-- This script creates the marketplace tables that are missing and inserts sample data

-- ============================================================================
-- CREATE MISSING MARKETPLACE TABLES
-- ============================================================================

-- Marketplace Projects
CREATE TABLE IF NOT EXISTS marketplace_projects (
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
CREATE TABLE IF NOT EXISTS marketplace_purchases (
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
CREATE TABLE IF NOT EXISTS marketplace_reviews (
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
CREATE TABLE IF NOT EXISTS marketplace_downloads (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id VARCHAR NOT NULL REFERENCES marketplace_projects(id),
  user_id VARCHAR NOT NULL REFERENCES users(id),
  downloaded_at TIMESTAMP DEFAULT NOW(),
  ip_address TEXT,
  user_agent TEXT
);

-- ============================================================================
-- CREATE INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_marketplace_projects_project_id ON marketplace_projects(project_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_projects_builder_id ON marketplace_projects(builder_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_projects_status ON marketplace_projects(status);
CREATE INDEX IF NOT EXISTS idx_marketplace_projects_approval_status ON marketplace_projects(approval_status);
CREATE INDEX IF NOT EXISTS idx_marketplace_projects_category ON marketplace_projects(category);
CREATE INDEX IF NOT EXISTS idx_marketplace_projects_featured ON marketplace_projects(featured);
CREATE INDEX IF NOT EXISTS idx_marketplace_projects_rating ON marketplace_projects(rating);
CREATE INDEX IF NOT EXISTS idx_marketplace_projects_published_at ON marketplace_projects(published_at);

-- ============================================================================
-- INSERT SIMPLE SAMPLE DATA
-- ============================================================================

-- Insert sample users (without name column)
INSERT INTO users (id, email, password_hash, persona, is_active, approval_status, created_at) VALUES
-- Admin users
('admin-001', 'admin@builderai.com', '$2b$10$hashed_password_here', 'super_admin', 'true', 'approved', NOW() - INTERVAL '30 days'),
('admin-002', 'admin2@builderai.com', '$2b$10$hashed_password_here', 'super_admin', 'true', 'approved', NOW() - INTERVAL '25 days'),

-- Builder users
('builder-001', 'builder1@example.com', '$2b$10$hashed_password_here', 'builder', 'true', 'approved', NOW() - INTERVAL '20 days'),
('builder-002', 'builder2@example.com', '$2b$10$hashed_password_here', 'builder', 'true', 'approved', NOW() - INTERVAL '18 days'),

-- End user users
('user-001', 'user1@example.com', '$2b$10$hashed_password_here', 'end_user', 'true', 'approved', NOW() - INTERVAL '5 days'),
('user-002', 'user2@example.com', '$2b$10$hashed_password_here', 'end_user', 'true', 'approved', NOW() - INTERVAL '3 days');

-- Insert sample LLM models
INSERT INTO llm_models (id, name, display_name, provider, model, type, status, context_length, max_tokens, pricing, capabilities, configuration, created_by) VALUES
('llm-001', 'GPT-4', 'GPT-4 Turbo', 'openai', 'gpt-4-turbo', 'chat', 'active', 128000, 4096, '{"input": 0.01, "output": 0.03}', '["chat", "code", "analysis"]', '{"api_key": "encrypted"}', 'admin-001'),
('llm-002', 'Claude-3', 'Claude 3 Opus', 'anthropic', 'claude-3-opus', 'chat', 'active', 200000, 4096, '{"input": 0.015, "output": 0.075}', '["chat", "code", "creative"]', '{"api_key": "encrypted"}', 'admin-002');

-- Insert sample MCP servers
INSERT INTO mcp_servers (id, name, type, url, description, status, configuration, created_by) VALUES
('mcp-001', 'GitHub Integration', 'sse', 'https://github-mcp.example.com', 'GitHub API integration', 'active', '{"auth_token": "encrypted"}', 'admin-001'),
('mcp-002', 'Database Connector', 'websocket', 'wss://db-mcp.example.com', 'Database connectivity', 'active', '{"connection_string": "encrypted"}', 'admin-002');

-- Insert sample projects
INSERT INTO projects (id, user_id, name, description, status, category, tags, llm_model_id, marketplace_price, marketplace_description, published) VALUES
('project-001', 'builder-001', 'AI Chat Assistant', 'Intelligent chatbot with integrations', 'completed', 'business', '["ai", "chatbot"]', 'llm-001', 2500, 'Complete customer support solution', 'true'),
('project-002', 'builder-002', 'Data Dashboard', 'Analytics visualization dashboard', 'completed', 'business', '["analytics", "dashboard"]', 'llm-002', 1800, 'Transform data into insights', 'true');

-- Insert sample prompts
INSERT INTO prompts (id, project_id, title, content, variables, is_active) VALUES
('prompt-001', 'project-001', 'Customer Assistant', 'You are a helpful customer service assistant for {{company}}. Help with {{service}} inquiries.', '{"company": "string", "service": "string"}', 'true'),
('prompt-002', 'project-002', 'Data Analyst', 'You are a data analyst. Analyze {{data_type}} and provide {{analysis_focus}}.', '{"data_type": "string", "analysis_focus": "string"}', 'true');

-- Insert sample knowledge bases
INSERT INTO knowledge_bases (id, project_id, name, type, configuration, documents, status) VALUES
('kb-001', 'project-001', 'Support KB', 'rag', '{"chunk_size": 512}', '[{"name": "faq.pdf", "size": "2.5MB", "type": "pdf"}]', 'active'),
('kb-002', 'project-002', 'Analytics KB', 'vector_db', '{"vector_dimension": 1536}', '[{"name": "reports.zip", "size": "45MB", "type": "zip"}]', 'active');

-- Link projects to MCP servers
INSERT INTO project_mcp_servers (project_id, mcp_server_id, configuration, is_active) VALUES
('project-001', 'mcp-001', '{"permissions": ["read", "write"]}', 'true'),
('project-002', 'mcp-002', '{"read_only": true}', 'true');

-- Insert marketplace projects
INSERT INTO marketplace_projects (id, project_id, builder_id, title, description, price, category, tags, status, approval_status, featured, rating, review_count, download_count, revenue, mcp_servers, published_at) VALUES
('mp-001', 'project-001', 'builder-001', 'AI Chat Assistant', 'Intelligent chatbot with integrations. Perfect for customer support.', 2500, 'business', '["ai", "chatbot", "automation"]', 'active', 'approved', true, 4.5, 12, 45, 11250, '["GitHub Integration"]', NOW() - INTERVAL '25 days'),
('mp-002', 'project-002', 'builder-002', 'Data Analytics Dashboard', 'Real-time analytics visualization with interactive charts.', 1800, 'business', '["analytics", "dashboard", "data"]', 'active', 'approved', false, 4.2, 8, 23, 4140, '["Database Connector"]', NOW() - INTERVAL '20 days');

-- Update projects with component references
UPDATE projects SET prompt_id = 'prompt-001', knowledge_base_id = 'kb-001' WHERE id = 'project-001';
UPDATE projects SET prompt_id = 'prompt-002', knowledge_base_id = 'kb-002' WHERE id = 'project-002';

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
DECLARE
  user_count INTEGER;
  project_count INTEGER;
  llm_count INTEGER;
  mcp_count INTEGER;
  marketplace_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO user_count FROM users;
  SELECT COUNT(*) INTO project_count FROM projects;
  SELECT COUNT(*) INTO llm_count FROM llm_models;
  SELECT COUNT(*) INTO mcp_count FROM mcp_servers;
  SELECT COUNT(*) INTO marketplace_count FROM marketplace_projects;

  RAISE NOTICE 'Sample data insertion completed!';
  RAISE NOTICE 'Users: %', user_count;
  RAISE NOTICE 'Projects: %', project_count;
  RAISE NOTICE 'LLM Models: %', llm_count;
  RAISE NOTICE 'MCP Servers: %', mcp_count;
  RAISE NOTICE 'Marketplace Projects: %', marketplace_count;
END $$;

-- Summary
SELECT
  'Summary' as info,
  (SELECT COUNT(*) FROM users) as users,
  (SELECT COUNT(*) FROM projects) as projects,
  (SELECT COUNT(*) FROM marketplace_projects) as marketplace_projects;

