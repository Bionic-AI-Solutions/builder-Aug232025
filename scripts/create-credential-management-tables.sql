-- ============================================================================
-- CREDENTIAL MANAGEMENT SYSTEM MIGRATION
-- ============================================================================

-- Create User LLM Credentials table
CREATE TABLE IF NOT EXISTS user_llm_credentials (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    llm_model_id VARCHAR NOT NULL REFERENCES llm_models(id) ON DELETE CASCADE,
    
    -- Encrypted credentials (encrypted at application level)
    encrypted_api_key TEXT NOT NULL,
    encrypted_secret_key TEXT, -- For providers that need both
    encrypted_organization_id TEXT, -- For OpenAI org
    encrypted_project_id TEXT, -- For Google AI Studio
    
    -- Metadata
    credential_name TEXT NOT NULL, -- User-friendly name
    is_active TEXT NOT NULL DEFAULT 'true',
    last_used_at TIMESTAMP,
    usage_count INTEGER DEFAULT 0,
    
    -- Security
    encryption_version TEXT NOT NULL DEFAULT 'v1',
    key_rotation_at TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    -- Ensure one credential per user per LLM model per name
    UNIQUE(user_id, llm_model_id, credential_name)
);

-- Create User MCP Credentials table
CREATE TABLE IF NOT EXISTS user_mcp_credentials (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    mcp_server_id VARCHAR NOT NULL REFERENCES mcp_servers(id) ON DELETE CASCADE,
    
    -- Encrypted credentials
    encrypted_client_id TEXT NOT NULL,
    encrypted_client_secret TEXT NOT NULL,
    encrypted_access_token TEXT,
    encrypted_refresh_token TEXT,
    encrypted_api_key TEXT, -- For services that use API keys
    
    -- OAuth specific fields
    token_expires_at TIMESTAMP,
    scopes JSONB, -- OAuth scopes
    
    -- Metadata
    credential_name TEXT NOT NULL, -- User-friendly name
    is_active TEXT NOT NULL DEFAULT 'true',
    last_used_at TIMESTAMP,
    usage_count INTEGER DEFAULT 0,
    
    -- Security
    encryption_version TEXT NOT NULL DEFAULT 'v1',
    key_rotation_at TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    -- Ensure one credential per user per MCP server per name
    UNIQUE(user_id, mcp_server_id, credential_name)
);

-- Create Project Credential Associations table
CREATE TABLE IF NOT EXISTS project_credentials (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id VARCHAR NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    
    -- LLM Credential association
    llm_credential_id VARCHAR REFERENCES user_llm_credentials(id) ON DELETE SET NULL,
    
    -- MCP Credential associations (JSON array of credential IDs)
    mcp_credential_ids JSONB DEFAULT '[]',
    
    -- Configuration overrides for this project
    llm_configuration JSONB, -- temperature, max_tokens, etc.
    mcp_configuration JSONB, -- MCP-specific settings
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create Credential Usage Log table
CREATE TABLE IF NOT EXISTS credential_usage_log (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR NOT NULL REFERENCES users(id),
    project_id VARCHAR REFERENCES projects(id),
    
    -- Credential used
    llm_credential_id VARCHAR REFERENCES user_llm_credentials(id),
    mcp_credential_id VARCHAR REFERENCES user_mcp_credentials(id),
    
    -- Usage details
    operation TEXT NOT NULL, -- "llm_completion", "mcp_gmail_send", etc.
    tokens_used INTEGER, -- For LLM operations
    cost_in_cents INTEGER, -- Cost in cents
    success TEXT NOT NULL DEFAULT 'true', -- true/false
    error_message TEXT,
    
    -- Request metadata
    request_id VARCHAR, -- For tracing
    user_agent TEXT,
    ip_address TEXT,
    
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create MCP Server Authentication Methods table
CREATE TABLE IF NOT EXISTS mcp_server_auth_methods (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    mcp_server_id VARCHAR NOT NULL REFERENCES mcp_servers(id) ON DELETE CASCADE,
    
    -- Authentication type
    auth_type TEXT NOT NULL, -- "oauth2", "api_key", "service_account", "basic"
    
    -- OAuth2 configuration
    oauth2_config JSONB,
    
    -- API Key configuration
    api_key_config JSONB,
    
    -- Service Account configuration
    service_account_config JSONB,
    
    -- Required credential fields
    required_fields JSONB, -- ["client_id", "client_secret", "access_token"]
    optional_fields JSONB, -- ["refresh_token", "organization_id"]
    
    is_active TEXT NOT NULL DEFAULT 'true',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_llm_credentials_user_id ON user_llm_credentials(user_id);
CREATE INDEX IF NOT EXISTS idx_user_llm_credentials_llm_model_id ON user_llm_credentials(llm_model_id);
CREATE INDEX IF NOT EXISTS idx_user_llm_credentials_active ON user_llm_credentials(is_active);

CREATE INDEX IF NOT EXISTS idx_user_mcp_credentials_user_id ON user_mcp_credentials(user_id);
CREATE INDEX IF NOT EXISTS idx_user_mcp_credentials_mcp_server_id ON user_mcp_credentials(mcp_server_id);
CREATE INDEX IF NOT EXISTS idx_user_mcp_credentials_active ON user_mcp_credentials(is_active);

CREATE INDEX IF NOT EXISTS idx_project_credentials_project_id ON project_credentials(project_id);
CREATE INDEX IF NOT EXISTS idx_project_credentials_llm_credential_id ON project_credentials(llm_credential_id);

CREATE INDEX IF NOT EXISTS idx_credential_usage_log_user_id ON credential_usage_log(user_id);
CREATE INDEX IF NOT EXISTS idx_credential_usage_log_project_id ON credential_usage_log(project_id);
CREATE INDEX IF NOT EXISTS idx_credential_usage_log_created_at ON credential_usage_log(created_at);

CREATE INDEX IF NOT EXISTS idx_mcp_server_auth_methods_mcp_server_id ON mcp_server_auth_methods(mcp_server_id);
CREATE INDEX IF NOT EXISTS idx_mcp_server_auth_methods_active ON mcp_server_auth_methods(is_active);

-- Insert sample MCP server authentication methods
INSERT INTO mcp_server_auth_methods (mcp_server_id, auth_type, oauth2_config, required_fields, optional_fields) VALUES
-- Gmail MCP Server
('mcp-gmail-001', 'oauth2', 
 '{"authorizationUrl": "https://accounts.google.com/o/oauth2/auth", "tokenUrl": "https://oauth2.googleapis.com/token", "scopes": ["https://www.googleapis.com/auth/gmail.send", "https://www.googleapis.com/auth/gmail.readonly"]}',
 '["client_id", "client_secret", "access_token"]',
 '["refresh_token"]'),

-- WhatsApp MCP Server  
('mcp-whatsapp-001', 'oauth2',
 '{"authorizationUrl": "https://www.facebook.com/dialog/oauth", "tokenUrl": "https://graph.facebook.com/v18.0/oauth/access_token", "scopes": ["whatsapp_business_messaging"]}',
 '["client_id", "client_secret", "access_token"]',
 '["refresh_token"]'),

-- Slack MCP Server
('mcp-slack-001', 'oauth2',
 '{"authorizationUrl": "https://slack.com/oauth/v2/authorize", "tokenUrl": "https://slack.com/api/oauth.v2.access", "scopes": ["chat:write", "channels:read"]}',
 '["client_id", "client_secret", "access_token"]',
 '["refresh_token"]'),

-- Discord MCP Server
('mcp-discord-001', 'oauth2',
 '{"authorizationUrl": "https://discord.com/api/oauth2/authorize", "tokenUrl": "https://discord.com/api/oauth2/token", "scopes": ["bot", "send_messages"]}',
 '["client_id", "client_secret", "access_token"]',
 '["refresh_token"]'),

-- GitHub MCP Server
('mcp-github-001', 'oauth2',
 '{"authorizationUrl": "https://github.com/login/oauth/authorize", "tokenUrl": "https://github.com/login/oauth/access_token", "scopes": ["repo", "user"]}',
 '["client_id", "client_secret", "access_token"]',
 '["refresh_token"]'),

-- Twitter/X MCP Server
('mcp-twitter-001', 'oauth2',
 '{"authorizationUrl": "https://twitter.com/i/oauth2/authorize", "tokenUrl": "https://api.twitter.com/2/oauth2/token", "scopes": ["tweet.read", "tweet.write"]}',
 '["client_id", "client_secret", "access_token"]',
 '["refresh_token"]'),

-- LinkedIn MCP Server
('mcp-linkedin-001', 'oauth2',
 '{"authorizationUrl": "https://www.linkedin.com/oauth/v2/authorization", "tokenUrl": "https://www.linkedin.com/oauth/v2/accessToken", "scopes": ["r_liteprofile", "w_member_social"]}',
 '["client_id", "client_secret", "access_token"]',
 '["refresh_token"]'),

-- Calendar MCP Server
('mcp-calendar-001', 'oauth2',
 '{"authorizationUrl": "https://accounts.google.com/o/oauth2/auth", "tokenUrl": "https://oauth2.googleapis.com/token", "scopes": ["https://www.googleapis.com/auth/calendar", "https://www.googleapis.com/auth/calendar.events"]}',
 '["client_id", "client_secret", "access_token"]',
 '["refresh_token"]'),

-- Drive MCP Server
('mcp-drive-001', 'oauth2',
 '{"authorizationUrl": "https://accounts.google.com/o/oauth2/auth", "tokenUrl": "https://oauth2.googleapis.com/token", "scopes": ["https://www.googleapis.com/auth/drive", "https://www.googleapis.com/auth/drive.file"]}',
 '["client_id", "client_secret", "access_token"]',
 '["refresh_token"]'),

-- Notion MCP Server
('mcp-notion-001', 'oauth2',
 '{"authorizationUrl": "https://api.notion.com/v1/oauth/authorize", "tokenUrl": "https://api.notion.com/v1/oauth/token", "scopes": ["read_content", "update_content"]}',
 '["client_id", "client_secret", "access_token"]',
 '["refresh_token"]');

-- Add constraints
ALTER TABLE user_llm_credentials ADD CONSTRAINT check_is_active CHECK (is_active IN ('true', 'false'));
ALTER TABLE user_mcp_credentials ADD CONSTRAINT check_is_active CHECK (is_active IN ('true', 'false'));
ALTER TABLE credential_usage_log ADD CONSTRAINT check_success CHECK (success IN ('true', 'false'));
ALTER TABLE mcp_server_auth_methods ADD CONSTRAINT check_auth_type CHECK (auth_type IN ('oauth2', 'api_key', 'service_account', 'basic'));
ALTER TABLE mcp_server_auth_methods ADD CONSTRAINT check_is_active CHECK (is_active IN ('true', 'false'));

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_llm_credentials_updated_at BEFORE UPDATE ON user_llm_credentials FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_mcp_credentials_updated_at BEFORE UPDATE ON user_mcp_credentials FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_project_credentials_updated_at BEFORE UPDATE ON project_credentials FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_mcp_server_auth_methods_updated_at BEFORE UPDATE ON mcp_server_auth_methods FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions (adjust as needed for your setup)
-- GRANT ALL PRIVILEGES ON TABLE user_llm_credentials TO your_app_user;
-- GRANT ALL PRIVILEGES ON TABLE user_mcp_credentials TO your_app_user;
-- GRANT ALL PRIVILEGES ON TABLE project_credentials TO your_app_user;
-- GRANT ALL PRIVILEGES ON TABLE credential_usage_log TO your_app_user;
-- GRANT ALL PRIVILEGES ON TABLE mcp_server_auth_methods TO your_app_user;

COMMIT;
