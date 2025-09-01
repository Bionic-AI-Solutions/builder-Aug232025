-- Create LLM Providers table
-- This script creates the llm_providers table with the correct schema

-- Drop the table if it exists (for clean migration)
DROP TABLE IF EXISTS llm_providers CASCADE;

-- Create LLM Providers table with correct schema
CREATE TABLE llm_providers (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('cloud', 'local')) DEFAULT 'cloud',
    description TEXT,
    base_url TEXT,
    api_key TEXT, -- encrypted
    status TEXT NOT NULL DEFAULT 'inactive' CHECK (status IN ('active', 'inactive', 'configured', 'error')),
    metadata JSONB DEFAULT '{}',
    created_by VARCHAR NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_llm_providers_status ON llm_providers(status);
CREATE INDEX idx_llm_providers_type ON llm_providers(type);
CREATE INDEX idx_llm_providers_created_by ON llm_providers(created_by);

-- Insert some sample data for testing
INSERT INTO llm_providers (id, name, type, description, base_url, status, created_by) VALUES
('provider-openai', 'OpenAI', 'cloud', 'Advanced language models from OpenAI', 'https://api.openai.com/v1', 'inactive', 'admin-001'),
('provider-anthropic', 'Anthropic', 'cloud', 'Claude models from Anthropic', 'https://api.anthropic.com', 'inactive', 'admin-001'),
('provider-ollama', 'Ollama', 'local', 'Local LLM models via Ollama', 'http://localhost:11434', 'inactive', 'admin-001')
ON CONFLICT (id) DO NOTHING;
