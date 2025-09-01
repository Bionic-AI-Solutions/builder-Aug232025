-- Add approval fields to LLM models and MCP servers
-- This allows admins to control which models and servers are available for projects

-- Add approved field to llm_models table
ALTER TABLE llm_models 
ADD COLUMN IF NOT EXISTS approved BOOLEAN DEFAULT false;

-- Add approved field to mcp_servers table  
ALTER TABLE mcp_servers 
ADD COLUMN IF NOT EXISTS approved BOOLEAN DEFAULT false;

-- Create indexes for better performance on approval queries
CREATE INDEX IF NOT EXISTS idx_llm_models_approved ON llm_models(approved);
CREATE INDEX IF NOT EXISTS idx_mcp_servers_approved ON mcp_servers(approved);

-- Update existing records to be approved by default (for backward compatibility)
UPDATE llm_models SET approved = true WHERE approved IS NULL;
UPDATE mcp_servers SET approved = true WHERE approved IS NULL;
