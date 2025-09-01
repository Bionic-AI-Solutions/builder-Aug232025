-- Migration to Single Table Design
-- Add marketplace columns to projects table and migrate data

-- Step 1: Add marketplace columns to projects table
ALTER TABLE projects ADD COLUMN IF NOT EXISTS published BOOLEAN DEFAULT FALSE;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS marketplace_price INTEGER;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS marketplace_description TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS marketplace_status TEXT DEFAULT 'inactive';
ALTER TABLE projects ADD COLUMN IF NOT EXISTS marketplace_approval_status TEXT DEFAULT 'pending';
ALTER TABLE projects ADD COLUMN IF NOT EXISTS marketplace_published_at TIMESTAMP;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS marketplace_featured BOOLEAN DEFAULT FALSE;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS marketplace_rating DECIMAL(3,2) DEFAULT 0;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS marketplace_review_count INTEGER DEFAULT 0;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS marketplace_download_count INTEGER DEFAULT 0;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS marketplace_like_count INTEGER DEFAULT 0;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS marketplace_revenue DECIMAL(10,2) DEFAULT 0;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS marketplace_approved_by VARCHAR;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS marketplace_approved_at TIMESTAMP;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS marketplace_rejection_reason TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS marketplace_mcp_servers JSONB DEFAULT '[]'::jsonb;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS marketplace_popularity_score DECIMAL(5,2) DEFAULT 0;

-- Step 2: Migrate data from marketplace_projects to projects
UPDATE projects 
SET 
    published = TRUE,
    marketplace_price = mp.price,
    marketplace_description = mp.description,
    marketplace_status = mp.status,
    marketplace_approval_status = mp.approval_status,
    marketplace_published_at = mp.published_at,
    marketplace_featured = mp.featured,
    marketplace_rating = mp.rating,
    marketplace_review_count = mp.review_count,
    marketplace_download_count = mp.download_count,
    marketplace_mcp_servers = mp.mcp_servers,
    marketplace_popularity_score = mp.popularity_score
FROM marketplace_projects mp
WHERE projects.id = mp.project_id;

-- Step 3: Update existing projects that were marked as published
UPDATE projects 
SET published = TRUE 
WHERE published IS NULL AND marketplace_price IS NOT NULL;

-- Step 4: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_projects_published ON projects(published);
CREATE INDEX IF NOT EXISTS idx_projects_marketplace_status ON projects(marketplace_status);
CREATE INDEX IF NOT EXISTS idx_projects_marketplace_approval_status ON projects(marketplace_approval_status);
CREATE INDEX IF NOT EXISTS idx_projects_marketplace_featured ON projects(marketplace_featured);
CREATE INDEX IF NOT EXISTS idx_projects_marketplace_rating ON projects(marketplace_rating);
CREATE INDEX IF NOT EXISTS idx_projects_marketplace_published_at ON projects(marketplace_published_at);

-- Step 5: Add constraints
ALTER TABLE projects ADD CONSTRAINT check_marketplace_status 
    CHECK (marketplace_status IN ('active', 'inactive', 'pending', 'suspended'));

ALTER TABLE projects ADD CONSTRAINT check_marketplace_approval_status 
    CHECK (marketplace_approval_status IN ('pending', 'approved', 'rejected'));

-- Step 6: Verify migration
SELECT 
    'Migration Summary' as info,
    COUNT(*) as total_projects,
    COUNT(*) FILTER (WHERE published = TRUE) as published_projects,
    COUNT(*) FILTER (WHERE published = FALSE) as draft_projects,
    COUNT(*) FILTER (WHERE marketplace_status = 'active') as active_marketplace_projects,
    COUNT(*) FILTER (WHERE marketplace_status = 'pending') as pending_marketplace_projects
FROM projects;
