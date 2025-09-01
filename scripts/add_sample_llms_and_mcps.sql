-- Add sample LLM models and MCP servers
-- This provides a variety of options for builders to use in their projects

-- First, get the admin user ID for created_by field
DO $$
DECLARE
    admin_user_id VARCHAR;
BEGIN
    SELECT id INTO admin_user_id FROM users WHERE email = 'admin@builderai.com' LIMIT 1;
    
    IF admin_user_id IS NULL THEN
        RAISE EXCEPTION 'Admin user not found. Please ensure admin@example.com exists.';
    END IF;

    -- Insert sample LLM models
    INSERT INTO llm_models (id, name, display_name, provider, model, type, status, context_length, max_tokens, pricing, capabilities, created_by, approved) VALUES
    ('llm-openai-gpt4', 'gpt-4', 'GPT-4', 'OpenAI', 'gpt-4', 'chat', 'active', 8192, 4096, '{"input": 0.03, "output": 0.06}', '["chat", "reasoning", "coding"]', admin_user_id, true),
    ('llm-openai-gpt35', 'gpt-3.5-turbo', 'GPT-3.5 Turbo', 'OpenAI', 'gpt-3.5-turbo', 'chat', 'active', 4096, 4096, '{"input": 0.0015, "output": 0.002}', '["chat", "reasoning"]', admin_user_id, true),
    ('llm-anthropic-claude', 'claude-3-opus', 'Claude 3 Opus', 'Anthropic', 'claude-3-opus-20240229', 'chat', 'active', 200000, 4096, '{"input": 0.015, "output": 0.075}', '["chat", "reasoning", "vision"]', admin_user_id, true),
    ('llm-anthropic-sonnet', 'claude-3-sonnet', 'Claude 3 Sonnet', 'Anthropic', 'claude-3-sonnet-20240229', 'chat', 'active', 200000, 4096, '{"input": 0.003, "output": 0.015}', '["chat", "reasoning", "vision"]', admin_user_id, true),
    ('llm-microsoft-azure', 'gpt-4-azure', 'GPT-4 Azure', 'Microsoft', 'gpt-4', 'chat', 'active', 8192, 4096, '{"input": 0.03, "output": 0.06}', '["chat", "reasoning", "coding"]', admin_user_id, true),
    ('llm-local-llama', 'llama-3-8b', 'Llama 3 8B', 'Local', 'llama-3-8b-instruct', 'chat', 'active', 8192, 4096, '{"input": 0, "output": 0}', '["chat", "reasoning"]', admin_user_id, false),
    ('llm-local-mistral', 'mistral-7b', 'Mistral 7B', 'Local', 'mistral-7b-instruct', 'chat', 'active', 8192, 4096, '{"input": 0, "output": 0}', '["chat", "reasoning"]', admin_user_id, false)
    ON CONFLICT (id) DO UPDATE SET
        display_name = EXCLUDED.display_name,
        provider = EXCLUDED.provider,
        model = EXCLUDED.model,
        status = EXCLUDED.status,
        approved = EXCLUDED.approved;

    -- Insert sample MCP servers
    INSERT INTO mcp_servers (id, name, type, url, description, status, configuration, latency, created_by, approved) VALUES
    ('mcp-google-gmail', 'Gmail MCP Server', 'http', 'https://mcp.google.com/gmail', 'Google Gmail integration for email management, sending, and reading emails', 'active', '{"auth_type": "oauth2", "scopes": ["https://www.googleapis.com/auth/gmail.readonly", "https://www.googleapis.com/auth/gmail.send"]}', 150, admin_user_id, true),
    ('mcp-google-calendar', 'Google Calendar MCP Server', 'http', 'https://mcp.google.com/calendar', 'Google Calendar integration for scheduling, events, and time management', 'active', '{"auth_type": "oauth2", "scopes": ["https://www.googleapis.com/auth/calendar", "https://www.googleapis.com/auth/calendar.events"]}', 120, admin_user_id, true),
    ('mcp-google-drive', 'Google Drive MCP Server', 'http', 'https://mcp.google.com/drive', 'Google Drive integration for file storage, sharing, and collaboration', 'active', '{"auth_type": "oauth2", "scopes": ["https://www.googleapis.com/auth/drive", "https://www.googleapis.com/auth/drive.file"]}', 200, admin_user_id, true),
    ('mcp-whatsapp', 'WhatsApp MCP Server', 'http', 'https://mcp.whatsapp.com/api', 'WhatsApp Business API integration for messaging and notifications', 'active', '{"auth_type": "api_key", "features": ["send_message", "receive_message", "media_sharing"]}', 300, admin_user_id, true),
    ('mcp-database-connector', 'Database Connector MCP Server', 'tcp', 'localhost:5432', 'Universal database connector supporting PostgreSQL, MySQL, and SQLite', 'active', '{"supported_databases": ["postgresql", "mysql", "sqlite"], "connection_pooling": true}', 50, admin_user_id, true),
    ('mcp-paypal', 'PayPal MCP Server', 'http', 'https://mcp.paypal.com/api', 'PayPal integration for payment processing and financial transactions', 'active', '{"auth_type": "oauth2", "features": ["create_payment", "capture_payment", "refund"]}', 250, admin_user_id, true),
    ('mcp-outlook', 'Outlook MCP Server', 'http', 'https://mcp.microsoft.com/outlook', 'Microsoft Outlook integration for email and calendar management', 'active', '{"auth_type": "oauth2", "scopes": ["Mail.Read", "Mail.Send", "Calendars.ReadWrite"]}', 180, admin_user_id, true),
    ('mcp-slack', 'Slack MCP Server', 'http', 'https://mcp.slack.com/api', 'Slack integration for team communication and notifications', 'active', '{"auth_type": "oauth2", "features": ["send_message", "create_channel", "invite_user"]}', 100, admin_user_id, true),
    ('mcp-twitter', 'Twitter MCP Server', 'http', 'https://mcp.twitter.com/api', 'Twitter API integration for social media management', 'active', '{"auth_type": "oauth2", "features": ["tweet", "read_timeline", "follow_user"]}', 400, admin_user_id, false),
    ('mcp-instagram', 'Instagram MCP Server', 'http', 'https://mcp.instagram.com/api', 'Instagram API integration for social media content management', 'active', '{"auth_type": "oauth2", "features": ["post_photo", "read_comments", "like_post"]}', 350, admin_user_id, false)
    ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        type = EXCLUDED.type,
        url = EXCLUDED.url,
        description = EXCLUDED.description,
        status = EXCLUDED.status,
        approved = EXCLUDED.approved;

    RAISE NOTICE 'Sample LLM models and MCP servers added successfully!';
    RAISE NOTICE 'Approved LLMs: OpenAI GPT-4, GPT-3.5, Anthropic Claude, Microsoft Azure';
    RAISE NOTICE 'Unapproved LLMs: Local Llama, Local Mistral';
    RAISE NOTICE 'Approved MCPs: Gmail, Calendar, Drive, WhatsApp, Database, PayPal, Outlook, Slack';
    RAISE NOTICE 'Unapproved MCPs: Twitter, Instagram';

END $$;
