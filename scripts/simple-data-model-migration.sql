-- Simple Data Model Migration Script
-- Corrects the data model to match proper relationships
-- Run this after backing up your existing data

-- ============================================================================
-- CREATE NEW TABLES WITH CORRECT RELATIONSHIPS
-- ============================================================================

-- 1. Create users table first (no foreign key dependencies)
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT,
  persona TEXT NOT NULL DEFAULT 'builder',
  name TEXT,
  roles JSONB DEFAULT '[]',
  permissions JSONB DEFAULT '[]',
  metadata JSONB DEFAULT '{}',
  is_active TEXT NOT NULL DEFAULT 'true',
  approval_status TEXT NOT NULL DEFAULT 'pending',
  approved_by VARCHAR,
  approved_at TIMESTAMP,
  rejection_reason TEXT,
  last_login_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. Create LLM models (managed by admin)
CREATE TABLE IF NOT EXISTS llm_models (
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
  created_by VARCHAR,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 3. Create MCP servers (managed by admin)
CREATE TABLE IF NOT EXISTS mcp_servers (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'sse',
  url TEXT,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'error')),
  configuration JSONB,
  latency INTEGER DEFAULT 0,
  created_by VARCHAR,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 4. Create projects (owned by builders)
CREATE TABLE IF NOT EXISTS projects (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'development',
  category TEXT,
  tags JSONB DEFAULT '[]',
  llm_model_id VARCHAR,
  prompt_id VARCHAR,
  knowledge_base_id VARCHAR,
  llm TEXT,
  files JSONB DEFAULT '[]',
  marketplace_price INTEGER,
  marketplace_description TEXT,
  published TEXT DEFAULT 'false',
  revenue INTEGER DEFAULT 0,
  revenue_growth INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 5. Create prompts (one per project)
CREATE TABLE IF NOT EXISTS prompts (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id VARCHAR NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  variables JSONB,
  version INTEGER DEFAULT 1,
  is_active TEXT DEFAULT 'true',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 6. Create knowledge bases (one per project)
CREATE TABLE IF NOT EXISTS knowledge_bases (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id VARCHAR NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'rag',
  configuration JSONB,
  documents JSONB DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 7. Create project MCP server associations (many-to-many)
CREATE TABLE IF NOT EXISTS project_mcp_servers (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id VARCHAR NOT NULL,
  mcp_server_id VARCHAR NOT NULL,
  configuration JSONB,
  is_active TEXT DEFAULT 'true',
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- ADD FOREIGN KEY CONSTRAINTS
-- ============================================================================

-- Add foreign key constraints to users table
ALTER TABLE users ADD CONSTRAINT fk_users_approved_by
  FOREIGN KEY (approved_by) REFERENCES users(id);

-- Add foreign key constraints to llm_models table
ALTER TABLE llm_models ADD CONSTRAINT fk_llm_models_created_by
  FOREIGN KEY (created_by) REFERENCES users(id);

-- Add foreign key constraints to mcp_servers table
ALTER TABLE mcp_servers ADD CONSTRAINT fk_mcp_servers_created_by
  FOREIGN KEY (created_by) REFERENCES users(id);

-- Add foreign key constraints to projects table
ALTER TABLE projects ADD CONSTRAINT fk_projects_user_id
  FOREIGN KEY (user_id) REFERENCES users(id);
ALTER TABLE projects ADD CONSTRAINT fk_projects_llm_model_id
  FOREIGN KEY (llm_model_id) REFERENCES llm_models(id);
ALTER TABLE projects ADD CONSTRAINT fk_projects_prompt_id
  FOREIGN KEY (prompt_id) REFERENCES prompts(id);
ALTER TABLE projects ADD CONSTRAINT fk_projects_knowledge_base_id
  FOREIGN KEY (knowledge_base_id) REFERENCES knowledge_bases(id);

-- Add foreign key constraints to prompts table
ALTER TABLE prompts ADD CONSTRAINT fk_prompts_project_id
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;

-- Add foreign key constraints to knowledge_bases table
ALTER TABLE knowledge_bases ADD CONSTRAINT fk_knowledge_bases_project_id
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;

-- Add foreign key constraints to project_mcp_servers table
ALTER TABLE project_mcp_servers ADD CONSTRAINT fk_project_mcp_servers_project_id
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;
ALTER TABLE project_mcp_servers ADD CONSTRAINT fk_project_mcp_servers_mcp_server_id
  FOREIGN KEY (mcp_server_id) REFERENCES mcp_servers(id) ON DELETE CASCADE;

-- ============================================================================
-- CREATE INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_persona ON users(persona);
CREATE INDEX IF NOT EXISTS idx_users_approval_status ON users(approval_status);

CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_category ON projects(category);
CREATE INDEX IF NOT EXISTS idx_projects_published ON projects(published);
CREATE INDEX IF NOT EXISTS idx_projects_llm_model_id ON projects(llm_model_id);
CREATE INDEX IF NOT EXISTS idx_projects_prompt_id ON projects(prompt_id);
CREATE INDEX IF NOT EXISTS idx_projects_knowledge_base_id ON projects(knowledge_base_id);

CREATE INDEX IF NOT EXISTS idx_llm_models_provider ON llm_models(provider);
CREATE INDEX IF NOT EXISTS idx_llm_models_status ON llm_models(status);
CREATE INDEX IF NOT EXISTS idx_llm_models_created_by ON llm_models(created_by);

CREATE INDEX IF NOT EXISTS idx_mcp_servers_status ON mcp_servers(status);
CREATE INDEX IF NOT EXISTS idx_mcp_servers_created_by ON mcp_servers(created_by);

CREATE INDEX IF NOT EXISTS idx_prompts_project_id ON prompts(project_id);
CREATE INDEX IF NOT EXISTS idx_prompts_is_active ON prompts(is_active);

CREATE INDEX IF NOT EXISTS idx_knowledge_bases_project_id ON knowledge_bases(project_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_bases_status ON knowledge_bases(status);

CREATE INDEX IF NOT EXISTS idx_project_mcp_servers_project_id ON project_mcp_servers(project_id);
CREATE INDEX IF NOT EXISTS idx_project_mcp_servers_mcp_server_id ON project_mcp_servers(mcp_server_id);
CREATE INDEX IF NOT EXISTS idx_project_mcp_servers_is_active ON project_mcp_servers(is_active);

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE 'Data model migration completed successfully!';
    RAISE NOTICE 'New tables created with correct relationships:';
    RAISE NOTICE '- Admin manages: LLM Models, MCP Servers';
    RAISE NOTICE '- Builders own: Projects (with 1 LLM, 1 Prompt, 1 Knowledge Base)';
    RAISE NOTICE '- Projects can have: Multiple MCP Server connections';
    RAISE NOTICE '- Users only: Consume projects (no creation/modification)';
END $$;

