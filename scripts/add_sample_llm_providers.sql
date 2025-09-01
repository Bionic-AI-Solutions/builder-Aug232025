-- Add sample LLM providers
-- This provides the basic provider structure that the LLMs page expects

DO $$
DECLARE
    admin_user_id VARCHAR;
BEGIN
    SELECT id INTO admin_user_id FROM users WHERE email = 'admin@builderai.com' LIMIT 1;
    
    IF admin_user_id IS NULL THEN
        RAISE EXCEPTION 'Admin user not found. Please ensure admin@builderai.com exists.';
    END IF;

    -- Insert sample LLM providers
    INSERT INTO llm_providers (id, name, type, description, base_url, api_key, status, created_by, created_at, updated_at) VALUES
    ('provider-openai', 'OpenAI', 'cloud', 'OpenAI provides cutting-edge AI models including GPT-4 and GPT-3.5', 'https://api.openai.com', 'sk-...', 'active', admin_user_id, NOW(), NOW()),
    ('provider-anthropic', 'Anthropic', 'cloud', 'Anthropic offers Claude models with advanced reasoning capabilities', 'https://api.anthropic.com', 'sk-ant-...', 'active', admin_user_id, NOW(), NOW()),
    ('provider-microsoft', 'Microsoft Azure', 'cloud', 'Microsoft Azure OpenAI Service for enterprise AI solutions', 'https://api.openai.com', 'sk-...', 'active', admin_user_id, NOW(), NOW()),
    ('provider-local', 'Local Models', 'local', 'Local AI models running on your infrastructure', 'http://localhost:11434', NULL, 'active', admin_user_id, NOW(), NOW())
    ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        type = EXCLUDED.type,
        description = EXCLUDED.description,
        base_url = EXCLUDED.base_url,
        status = EXCLUDED.status,
        updated_at = NOW();

    RAISE NOTICE 'Sample LLM providers added successfully!';
    RAISE NOTICE 'Providers: OpenAI, Anthropic, Microsoft Azure, Local Models';

END $$;
