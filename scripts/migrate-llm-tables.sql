-- Migration script for LLM Providers and Models tables
-- Run this script to create the new database tables

-- Create LLM Providers table
CREATE TABLE IF NOT EXISTS llm_providers (
    id TEXT PRIMARY KEY DEFAULT 'provider-' || gen_random_uuid(),
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('cloud', 'local')),
    description TEXT,
    base_url TEXT,
    api_key_encrypted TEXT,
    status TEXT NOT NULL DEFAULT 'inactive' CHECK (status IN ('active', 'inactive', 'configured', 'error')),
    metadata JSONB,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create LLM Models table
CREATE TABLE IF NOT EXISTS llm_models (
    id TEXT PRIMARY KEY DEFAULT 'model-' || gen_random_uuid(),
    provider_id TEXT NOT NULL REFERENCES llm_providers(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    display_name TEXT,
    type TEXT NOT NULL DEFAULT 'chat' CHECK (type IN ('chat', 'completion', 'embedding')),
    status TEXT NOT NULL DEFAULT 'unavailable' CHECK (status IN ('available', 'unavailable', 'deprecated')),
    context_length INTEGER,
    max_tokens INTEGER,
    pricing JSONB,
    capabilities JSONB,
    metadata JSONB,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_llm_providers_status ON llm_providers(status);
CREATE INDEX IF NOT EXISTS idx_llm_providers_type ON llm_providers(type);
CREATE INDEX IF NOT EXISTS idx_llm_providers_created_by ON llm_providers(created_by);
CREATE INDEX IF NOT EXISTS idx_llm_models_provider_id ON llm_models(provider_id);
CREATE INDEX IF NOT EXISTS idx_llm_models_status ON llm_models(status);
CREATE INDEX IF NOT EXISTS idx_llm_models_type ON llm_models(type);

-- Insert some sample data for testing
INSERT INTO llm_providers (id, name, type, description, base_url, status, created_by) VALUES
('provider-openai', 'OpenAI', 'cloud', 'Advanced language models from OpenAI', 'https://api.openai.com/v1', 'inactive', 'd8eeb9a4-5f2c-4209-ab51-ced39d622d1d'),
('provider-anthropic', 'Anthropic', 'cloud', 'Claude models from Anthropic', 'https://api.anthropic.com', 'inactive', 'd8eeb9a4-5f2c-4209-ab51-ced39d622d1d'),
('provider-ollama', 'Ollama', 'local', 'Local LLM models via Ollama', 'http://localhost:11434', 'inactive', 'd8eeb9a4-5f2c-4209-ab51-ced39d622d1d')
ON CONFLICT (id) DO NOTHING;

-- Insert sample models
INSERT INTO llm_models (id, provider_id, name, display_name, type, status, context_length, max_tokens, capabilities) VALUES
('model-gpt4', 'provider-openai', 'gpt-4-turbo', 'GPT-4 Turbo', 'chat', 'unavailable', 128000, 4096, '["chat", "completion", "function-calling"]'),
('model-gpt35', 'provider-openai', 'gpt-3.5-turbo', 'GPT-3.5 Turbo', 'chat', 'unavailable', 16385, 4096, '["chat", "completion"]'),
('model-claude-sonnet', 'provider-anthropic', 'claude-3-sonnet', 'Claude 3 Sonnet', 'chat', 'unavailable', 200000, 4096, '["chat", "completion", "vision"]'),
('model-llama2', 'provider-ollama', 'llama2', 'Llama 2', 'chat', 'unavailable', 4096, 2048, '["chat", "completion"]')
ON CONFLICT (id) DO NOTHING;
