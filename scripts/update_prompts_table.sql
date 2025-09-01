-- Update existing prompts table to match new schema
-- This enables projects to have associated prompts for LLM + MCP server integration

-- First, drop the existing foreign key constraints
ALTER TABLE projects DROP CONSTRAINT IF EXISTS fk_projects_prompt_id;
ALTER TABLE prompts DROP CONSTRAINT IF EXISTS fk_prompts_project_id;

-- Add new columns to prompts table
ALTER TABLE prompts ADD COLUMN IF NOT EXISTS name VARCHAR(255);
ALTER TABLE prompts ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE prompts ADD COLUMN IF NOT EXISTS category VARCHAR(100);
ALTER TABLE prompts ADD COLUMN IF NOT EXISTS tags TEXT[];
ALTER TABLE prompts ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false;
ALTER TABLE prompts ADD COLUMN IF NOT EXISTS created_by VARCHAR;

-- Update existing prompts to have default values
UPDATE prompts SET 
  name = title,
  description = 'AI prompt for project',
  category = 'general',
  tags = ARRAY['ai', 'prompt'],
  is_public = true,
  created_by = (SELECT id::VARCHAR FROM users WHERE email = 'admin@builderai.com' LIMIT 1)
WHERE name IS NULL;

-- Make name not null after setting default values
ALTER TABLE prompts ALTER COLUMN name SET NOT NULL;

-- Drop old columns that are no longer needed
ALTER TABLE prompts DROP COLUMN IF EXISTS project_id;
ALTER TABLE prompts DROP COLUMN IF EXISTS version;
ALTER TABLE prompts DROP COLUMN IF EXISTS is_active;

-- Create project_prompts junction table for many-to-many relationship
CREATE TABLE IF NOT EXISTS project_prompts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id VARCHAR REFERENCES projects(id) ON DELETE CASCADE,
    prompt_id VARCHAR REFERENCES prompts(id) ON DELETE CASCADE,
    is_primary BOOLEAN DEFAULT false,
    custom_content TEXT, -- Allow project-specific prompt customization
    custom_variables JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(project_id, prompt_id)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_prompts_category ON prompts(category);
CREATE INDEX IF NOT EXISTS idx_prompts_created_by ON prompts(created_by);
CREATE INDEX IF NOT EXISTS idx_prompts_is_public ON prompts(is_public);
CREATE INDEX IF NOT EXISTS idx_project_prompts_project_id ON project_prompts(project_id);
CREATE INDEX IF NOT EXISTS idx_project_prompts_prompt_id ON project_prompts(prompt_id);
CREATE INDEX IF NOT EXISTS idx_project_prompts_primary ON project_prompts(is_primary);

-- Insert sample prompts with new structure
INSERT INTO prompts (id, name, title, content, description, variables, category, tags, is_public, created_by) VALUES
(
    'prompt-customer-service',
    'Customer Service Assistant',
    'Customer Service Assistant',
    'You are a professional customer service representative for {{company_name}}. Help customers with their inquiries in a friendly and helpful manner. Always maintain a professional tone and provide accurate information about our products and services.

Company Information:
- Company: {{company_name}}
- Industry: {{industry}}
- Services: {{services}}

Customer Inquiry Guidelines:
- Listen carefully to customer concerns
- Provide clear, helpful responses
- Escalate complex issues when necessary
- Follow up on unresolved matters

Response Format:
1. Acknowledge the customer''s concern
2. Provide relevant information or solution
3. Ask if there''s anything else they need
4. Thank them for contacting us',
    'Professional customer service assistant for handling customer inquiries',
    '{"company_name": "string", "industry": "string", "services": "string"}',
    'customer-service',
    ARRAY['customer-service', 'support', 'helpdesk'],
    true,
    (SELECT id::VARCHAR FROM users WHERE email = 'admin@builderai.com' LIMIT 1)
),
(
    'prompt-content-writer',
    'Content Writer',
    'Content Writer',
    'You are a skilled content writer specializing in {{content_type}} content. Create engaging and informative content based on the given topic and requirements.

Content Requirements:
- Topic: {{topic}}
- Tone: {{tone}}
- Length: {{length}}
- Target Audience: {{target_audience}}
- Style: {{style}}

Writing Guidelines:
- Use clear, concise language
- Include relevant examples and data when appropriate
- Maintain consistent tone throughout
- Optimize for readability and engagement
- Include relevant keywords naturally

Output Format:
1. Compelling headline
2. Engaging introduction
3. Well-structured body content
4. Strong conclusion
5. Call-to-action if appropriate',
    'Professional content writer for creating various types of content',
    '{"content_type": "string", "topic": "string", "tone": "string", "length": "string", "target_audience": "string", "style": "string"}',
    'content-creation',
    ARRAY['writing', 'content', 'copywriting'],
    true,
    (SELECT id::VARCHAR FROM users WHERE email = 'admin@builderai.com' LIMIT 1)
),
(
    'prompt-data-analyst',
    'Data Analyst',
    'Data Analyst',
    'You are a data analyst with expertise in {{data_type}} analysis. Help analyze data, create insights, and provide recommendations based on the data provided.

Analysis Context:
- Data Type: {{data_type}}
- Analysis Goal: {{analysis_goal}}
- Dataset Size: {{dataset_size}}
- Time Period: {{time_period}}

Analysis Approach:
1. Data Exploration: Examine data structure and quality
2. Statistical Analysis: Apply appropriate statistical methods
3. Pattern Recognition: Identify trends and correlations
4. Insight Generation: Extract meaningful insights
5. Recommendation Development: Provide actionable recommendations

Output Format:
1. Executive Summary
2. Key Findings
3. Data Insights
4. Recommendations
5. Next Steps',
    'Data analyst for interpreting data and providing insights',
    '{"data_type": "string", "analysis_goal": "string", "dataset_size": "string", "time_period": "string"}',
    'data-analysis',
    ARRAY['analytics', 'data', 'insights'],
    true,
    (SELECT id::VARCHAR FROM users WHERE email = 'admin@builderai.com' LIMIT 1)
),
(
    'prompt-code-assistant',
    'Code Assistant',
    'Code Assistant',
    'You are a programming assistant specializing in {{language}} development. Help write, debug, and explain code in various programming languages.

Programming Context:
- Language: {{language}}
- Task: {{task}}
- Framework: {{framework}}
- Complexity: {{complexity}}

Assistance Guidelines:
- Provide clear, well-commented code
- Explain the logic and approach
- Suggest best practices and optimizations
- Help debug issues step by step
- Recommend appropriate libraries and tools

Code Output Format:
1. Problem analysis
2. Solution approach
3. Code implementation
4. Explanation of key parts
5. Testing suggestions
6. Alternative approaches if applicable',
    'Programming assistant for code development and debugging',
    '{"language": "string", "task": "string", "framework": "string", "complexity": "string"}',
    'programming',
    ARRAY['coding', 'development', 'debugging'],
    true,
    (SELECT id::VARCHAR FROM users WHERE email = 'admin@builderai.com' LIMIT 1)
),
(
    'prompt-sales-assistant',
    'Sales Assistant',
    'Sales Assistant',
    'You are a sales assistant helping with {{sales_activity}} activities. Support sales teams with lead generation, customer engagement, and closing deals.

Sales Context:
- Activity: {{sales_activity}}
- Product: {{product}}
- Target Market: {{target_market}}
- Sales Stage: {{sales_stage}}

Sales Support Functions:
- Lead qualification and scoring
- Customer research and profiling
- Sales pitch development
- Objection handling
- Follow-up scheduling
- Pipeline management

Response Guidelines:
- Be professional and persuasive
- Understand customer needs
- Provide relevant product information
- Address concerns proactively
- Guide prospects through sales process',
    'Sales assistant for supporting sales activities and customer engagement',
    '{"sales_activity": "string", "product": "string", "target_market": "string", "sales_stage": "string"}',
    'sales',
    ARRAY['sales', 'lead-generation', 'customer-engagement'],
    true,
    (SELECT id::VARCHAR FROM users WHERE email = 'admin@builderai.com' LIMIT 1)
),
(
    'prompt-marketing-assistant',
    'Marketing Assistant',
    'Marketing Assistant',
    'You are a marketing assistant specializing in {{marketing_channel}} marketing. Help create campaigns, analyze performance, and optimize marketing strategies.

Marketing Context:
- Channel: {{marketing_channel}}
- Campaign Type: {{campaign_type}}
- Target Audience: {{target_audience}}
- Goals: {{marketing_goals}}

Marketing Support Areas:
- Campaign strategy development
- Content creation and optimization
- Audience targeting and segmentation
- Performance analysis and reporting
- A/B testing recommendations
- ROI optimization

Output Guidelines:
- Provide strategic insights
- Suggest creative approaches
- Include performance metrics
- Recommend optimization tactics
- Consider budget and timeline constraints',
    'Marketing assistant for campaign development and optimization',
    '{"marketing_channel": "string", "campaign_type": "string", "target_audience": "string", "marketing_goals": "string"}',
    'marketing',
    ARRAY['marketing', 'campaigns', 'optimization'],
    true,
    (SELECT id::VARCHAR FROM users WHERE email = 'admin@builderai.com' LIMIT 1)
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  title = EXCLUDED.title,
  content = EXCLUDED.content,
  description = EXCLUDED.description,
  variables = EXCLUDED.variables,
  category = EXCLUDED.category,
  tags = EXCLUDED.tags,
  is_public = EXCLUDED.is_public,
  created_by = EXCLUDED.created_by,
  updated_at = NOW();

-- Link existing projects to prompts (assuming they exist)
-- This creates a default prompt association for each project
INSERT INTO project_prompts (project_id, prompt_id, is_primary, custom_content, custom_variables)
SELECT 
    p.id as project_id,
    'prompt-customer-service' as prompt_id,
    true as is_primary,
    'Customized prompt for ' || p.name as custom_content,
    ('{"company_name": "' || p.name || '", "industry": "technology", "services": "AI applications"}')::jsonb as custom_variables
FROM projects p
WHERE p.id IN ('project-001', 'project-002', 'project-003', 'project-004')
ON CONFLICT (project_id, prompt_id) DO NOTHING;

-- Update the prompts endpoint to use database instead of hardcoded data
-- This will be done in the backend code update
