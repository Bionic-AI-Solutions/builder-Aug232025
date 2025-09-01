-- ============================================================================
-- CREDENTIAL MANAGEMENT SYSTEM - DATABASE MIGRATION
-- ============================================================================

-- Create user_llm_credentials table
CREATE TABLE IF NOT EXISTS user_llm_credentials (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    llm_model_id VARCHAR NOT NULL REFERENCES llm_models(id) ON DELETE CASCADE,
    api_key TEXT NOT NULL, -- Encrypted API key
    secret_key TEXT, -- Encrypted secret key (for some providers)
    organization_id VARCHAR, -- OpenAI organization ID
    project_id VARCHAR, -- Google project ID
    base_url VARCHAR, -- Custom base URL for some providers
    model_name VARCHAR, -- Specific model name
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
);

-- Create user_mcp_credentials table
CREATE TABLE IF NOT EXISTS user_mcp_credentials (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    mcp_server_id VARCHAR NOT NULL REFERENCES mcp_servers(id) ON DELETE CASCADE,
    client_id VARCHAR, -- OAuth2 client ID
    client_secret TEXT, -- Encrypted client secret
    access_token TEXT, -- Encrypted access token
    refresh_token TEXT, -- Encrypted refresh token
    api_key TEXT, -- Encrypted API key (for API key auth)
    scopes JSONB, -- OAuth2 scopes
    token_expires_at TIMESTAMP, -- Token expiration
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
);

-- Create project_credentials table
CREATE TABLE IF NOT EXISTS project_credentials (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id VARCHAR NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_llm_credential_ids JSONB, -- Array of user_llm_credentials IDs
    user_mcp_credential_ids JSONB, -- Array of user_mcp_credentials IDs
    configuration_overrides JSONB, -- Project-specific configuration
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
);

-- Create credential_usage_log table
CREATE TABLE IF NOT EXISTS credential_usage_log (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    project_id VARCHAR REFERENCES projects(id) ON DELETE SET NULL,
    credential_id VARCHAR NOT NULL, -- ID of the credential used
    credential_type VARCHAR NOT NULL CHECK (credential_type IN ('llm', 'mcp')),
    operation VARCHAR NOT NULL, -- e.g., 'chat_completion', 'email_send', 'file_upload'
    tokens_used INTEGER, -- For LLM operations
    cost_cents INTEGER, -- Cost in cents
    success BOOLEAN NOT NULL,
    error_message TEXT,
    metadata JSONB, -- Additional operation metadata
    created_at TIMESTAMP DEFAULT now()
);

-- Create mcp_server_auth_methods table
CREATE TABLE IF NOT EXISTS mcp_server_auth_methods (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    mcp_server_id VARCHAR NOT NULL REFERENCES mcp_servers(id) ON DELETE CASCADE,
    auth_method VARCHAR NOT NULL CHECK (auth_method IN ('oauth2', 'api_key', 'service_account')),
    config JSONB NOT NULL, -- Auth method configuration
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- User LLM Credentials indexes
CREATE INDEX IF NOT EXISTS idx_user_llm_credentials_user_id ON user_llm_credentials(user_id);
CREATE INDEX IF NOT EXISTS idx_user_llm_credentials_llm_model_id ON user_llm_credentials(llm_model_id);
CREATE INDEX IF NOT EXISTS idx_user_llm_credentials_active ON user_llm_credentials(is_active);

-- User MCP Credentials indexes
CREATE INDEX IF NOT EXISTS idx_user_mcp_credentials_user_id ON user_mcp_credentials(user_id);
CREATE INDEX IF NOT EXISTS idx_user_mcp_credentials_mcp_server_id ON user_mcp_credentials(mcp_server_id);
CREATE INDEX IF NOT EXISTS idx_user_mcp_credentials_active ON user_mcp_credentials(is_active);
CREATE INDEX IF NOT EXISTS idx_user_mcp_credentials_expires ON user_mcp_credentials(token_expires_at);

-- Project Credentials indexes
CREATE INDEX IF NOT EXISTS idx_project_credentials_project_id ON project_credentials(project_id);

-- Credential Usage Log indexes
CREATE INDEX IF NOT EXISTS idx_credential_usage_log_user_id ON credential_usage_log(user_id);
CREATE INDEX IF NOT EXISTS idx_credential_usage_log_project_id ON credential_usage_log(project_id);
CREATE INDEX IF NOT EXISTS idx_credential_usage_log_credential_id ON credential_usage_log(credential_id);
CREATE INDEX IF NOT EXISTS idx_credential_usage_log_created_at ON credential_usage_log(created_at);

-- MCP Server Auth Methods indexes
CREATE INDEX IF NOT EXISTS idx_mcp_server_auth_methods_server_id ON mcp_server_auth_methods(mcp_server_id);
CREATE INDEX IF NOT EXISTS idx_mcp_server_auth_methods_default ON mcp_server_auth_methods(is_default);

-- ============================================================================
-- CONSTRAINTS FOR DATA INTEGRITY
-- ============================================================================

-- Ensure one active credential per user per LLM model
ALTER TABLE user_llm_credentials 
ADD CONSTRAINT check_one_active_llm_credential_per_user_model 
CHECK (
    NOT EXISTS (
        SELECT 1 FROM user_llm_credentials ulc2 
        WHERE ulc2.user_id = user_llm_credentials.user_id 
        AND ulc2.llm_model_id = user_llm_credentials.llm_model_id 
        AND ulc2.is_active = true 
        AND ulc2.id != user_llm_credentials.id
    )
);

-- Ensure one active credential per user per MCP server
ALTER TABLE user_mcp_credentials 
ADD CONSTRAINT check_one_active_mcp_credential_per_user_server 
CHECK (
    NOT EXISTS (
        SELECT 1 FROM user_mcp_credentials umc2 
        WHERE umc2.user_id = user_mcp_credentials.user_id 
        AND umc2.mcp_server_id = user_mcp_credentials.mcp_server_id 
        AND umc2.is_active = true 
        AND umc2.id != user_mcp_credentials.id
    )
);

-- ============================================================================
-- TRIGGERS FOR UPDATED_AT TIMESTAMPS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_user_llm_credentials_updated_at 
    BEFORE UPDATE ON user_llm_credentials 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_mcp_credentials_updated_at 
    BEFORE UPDATE ON user_mcp_credentials 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_project_credentials_updated_at 
    BEFORE UPDATE ON project_credentials 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_mcp_server_auth_methods_updated_at 
    BEFORE UPDATE ON mcp_server_auth_methods 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- SAMPLE DATA FOR MCP SERVER AUTH METHODS
-- ============================================================================

-- Insert sample auth methods for common MCP servers
INSERT INTO mcp_server_auth_methods (mcp_server_id, auth_method, config, is_default) VALUES
-- Gmail
('mcp-gmail-001', 'oauth2', '{
    "authorization_url": "https://accounts.google.com/o/oauth2/auth",
    "token_url": "https://oauth2.googleapis.com/token",
    "scopes": ["https://www.googleapis.com/auth/gmail.readonly", "https://www.googleapis.com/auth/gmail.send"],
    "redirect_uri": "http://localhost:8080/api/oauth/callback/gmail"
}', true),

-- WhatsApp Business API
('mcp-whatsapp-001', 'api_key', '{
    "api_base_url": "https://graph.facebook.com/v18.0",
    "requires_phone_number_id": true,
    "requires_business_account_id": true
}', true),

-- Slack
('mcp-slack-001', 'oauth2', '{
    "authorization_url": "https://slack.com/oauth/v2/authorize",
    "token_url": "https://slack.com/api/oauth.v2.access",
    "scopes": ["chat:write", "channels:read", "users:read"],
    "redirect_uri": "http://localhost:8080/api/oauth/callback/slack"
}', true),

-- Discord
('mcp-discord-001', 'oauth2', '{
    "authorization_url": "https://discord.com/api/oauth2/authorize",
    "token_url": "https://discord.com/api/oauth2/token",
    "scopes": ["bot", "applications.commands"],
    "redirect_uri": "http://localhost:8080/api/oauth/callback/discord"
}', true),

-- GitHub
('mcp-github-001', 'oauth2', '{
    "authorization_url": "https://github.com/login/oauth/authorize",
    "token_url": "https://github.com/login/oauth/access_token",
    "scopes": ["repo", "user", "read:org"],
    "redirect_uri": "http://localhost:8080/api/oauth/callback/github"
}', true),

-- Twitter/X
('mcp-twitter-001', 'oauth2', '{
    "authorization_url": "https://twitter.com/i/oauth2/authorize",
    "token_url": "https://api.twitter.com/2/oauth2/token",
    "scopes": ["tweet.read", "tweet.write", "users.read"],
    "redirect_uri": "http://localhost:8080/api/oauth/callback/twitter"
}', true),

-- LinkedIn
('mcp-linkedin-001', 'oauth2', '{
    "authorization_url": "https://www.linkedin.com/oauth/v2/authorization",
    "token_url": "https://www.linkedin.com/oauth/v2/accessToken",
    "scopes": ["r_liteprofile", "w_member_social"],
    "redirect_uri": "http://localhost:8080/api/oauth/callback/linkedin"
}', true),

-- Google Calendar
('mcp-calendar-001', 'oauth2', '{
    "authorization_url": "https://accounts.google.com/o/oauth2/auth",
    "token_url": "https://oauth2.googleapis.com/token",
    "scopes": ["https://www.googleapis.com/auth/calendar", "https://www.googleapis.com/auth/calendar.events"],
    "redirect_uri": "http://localhost:8080/api/oauth/callback/calendar"
}', true),

-- Google Drive
('mcp-drive-001', 'oauth2', '{
    "authorization_url": "https://accounts.google.com/o/oauth2/auth",
    "token_url": "https://oauth2.googleapis.com/token",
    "scopes": ["https://www.googleapis.com/auth/drive", "https://www.googleapis.com/auth/drive.file"],
    "redirect_uri": "http://localhost:8080/api/oauth/callback/drive"
}', true),

-- Notion
('mcp-notion-001', 'oauth2', '{
    "authorization_url": "https://api.notion.com/v1/oauth/authorize",
    "token_url": "https://api.notion.com/v1/oauth/token",
    "scopes": ["read_content", "update_content"],
    "redirect_uri": "http://localhost:8080/api/oauth/callback/notion"
}', true);

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE user_llm_credentials IS 'Stores encrypted API keys and configuration for LLM models per user';
COMMENT ON TABLE user_mcp_credentials IS 'Stores encrypted OAuth2 tokens and API keys for MCP servers per user';
COMMENT ON TABLE project_credentials IS 'Links projects to specific user credentials with configuration overrides';
COMMENT ON TABLE credential_usage_log IS 'Audit trail of credential usage for billing and monitoring';
COMMENT ON TABLE mcp_server_auth_methods IS 'Defines authentication methods and configuration for MCP servers';
