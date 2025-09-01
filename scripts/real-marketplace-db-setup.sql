-- Real Marketplace Database Setup Script
-- This script validates and enhances the database schema for the real-marketplace feature

-- ============================================================================
-- PHASE 1: SCHEMA VALIDATION AND ENHANCEMENT
-- ============================================================================

-- Ensure required extensions are available
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- VALIDATE AND ENHANCE MARKETPLACE TABLES
-- ============================================================================

-- Ensure marketplace_projects table has all required columns and constraints
DO $$
BEGIN
    -- Add missing columns if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'marketplace_projects' AND column_name = 'popularity_score') THEN
        ALTER TABLE marketplace_projects ADD COLUMN popularity_score DECIMAL(5,2) DEFAULT 0.00;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'marketplace_projects' AND column_name = 'mcp_servers') THEN
        ALTER TABLE marketplace_projects ADD COLUMN mcp_servers TEXT[] DEFAULT '{}';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'marketplace_projects' AND column_name = 'approval_status') THEN
        ALTER TABLE marketplace_projects ADD COLUMN approval_status VARCHAR(50) DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected'));
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'marketplace_projects' AND column_name = 'approved_by') THEN
        ALTER TABLE marketplace_projects ADD COLUMN approved_by UUID REFERENCES users(id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'marketplace_projects' AND column_name = 'approved_at') THEN
        ALTER TABLE marketplace_projects ADD COLUMN approved_at TIMESTAMP WITH TIME ZONE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'marketplace_projects' AND column_name = 'rejection_reason') THEN
        ALTER TABLE marketplace_projects ADD COLUMN rejection_reason TEXT;
    END IF;
END $$;

-- Ensure proper foreign key constraints exist
DO $$
BEGIN
    -- Add foreign key constraint for builder_id if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_marketplace_projects_builder' 
        AND table_name = 'marketplace_projects'
    ) THEN
        ALTER TABLE marketplace_projects 
        ADD CONSTRAINT fk_marketplace_projects_builder 
        FOREIGN KEY (builder_id) REFERENCES users(id) ON DELETE CASCADE;
    END IF;
    
    -- Add foreign key constraint for project_id if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_marketplace_projects_project' 
        AND table_name = 'marketplace_projects'
    ) THEN
        ALTER TABLE marketplace_projects 
        ADD CONSTRAINT fk_marketplace_projects_project 
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;
    END IF;
END $$;

-- ============================================================================
-- CREATE PERFORMANCE INDEXES
-- ============================================================================

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_marketplace_projects_status ON marketplace_projects(status);
CREATE INDEX IF NOT EXISTS idx_marketplace_projects_builder ON marketplace_projects(builder_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_projects_category ON marketplace_projects(category);
CREATE INDEX IF NOT EXISTS idx_marketplace_projects_featured ON marketplace_projects(featured);
CREATE INDEX IF NOT EXISTS idx_marketplace_projects_approval_status ON marketplace_projects(approval_status);
CREATE INDEX IF NOT EXISTS idx_marketplace_projects_rating ON marketplace_projects(rating);
CREATE INDEX IF NOT EXISTS idx_marketplace_projects_price ON marketplace_projects(price);
CREATE INDEX IF NOT EXISTS idx_marketplace_projects_published_at ON marketplace_projects(published_at);

-- Create composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_marketplace_projects_status_approval ON marketplace_projects(status, approval_status);
CREATE INDEX IF NOT EXISTS idx_marketplace_projects_category_status ON marketplace_projects(category, status);
CREATE INDEX IF NOT EXISTS idx_marketplace_projects_builder_status ON marketplace_projects(builder_id, status);

-- Create GIN indexes for array columns
CREATE INDEX IF NOT EXISTS idx_marketplace_projects_tags_gin ON marketplace_projects USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_marketplace_projects_mcp_servers_gin ON marketplace_projects USING GIN(mcp_servers);

-- ============================================================================
-- ENHANCE EXISTING TABLES
-- ============================================================================

-- Ensure users table has required fields for marketplace functionality
DO $$
BEGIN
    -- Add missing user fields if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'name') THEN
        ALTER TABLE users ADD COLUMN name VARCHAR(255);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'username') THEN
        ALTER TABLE users ADD COLUMN username VARCHAR(100) UNIQUE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'avatar_url') THEN
        ALTER TABLE users ADD COLUMN avatar_url TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'last_login_at') THEN
        ALTER TABLE users ADD COLUMN last_login_at TIMESTAMP WITH TIME ZONE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'approval_status') THEN
        ALTER TABLE users ADD COLUMN approval_status VARCHAR(50) DEFAULT 'pending';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'approved_by') THEN
        ALTER TABLE users ADD COLUMN approved_by UUID REFERENCES users(id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'approved_at') THEN
        ALTER TABLE users ADD COLUMN approved_at TIMESTAMP WITH TIME ZONE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'rejection_reason') THEN
        ALTER TABLE users ADD COLUMN rejection_reason TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'plan_type') THEN
        ALTER TABLE users ADD COLUMN plan_type VARCHAR(50) DEFAULT 'free';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'plan_expires_at') THEN
        ALTER TABLE users ADD COLUMN plan_expires_at TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- Ensure projects table has required fields for marketplace functionality
DO $$
BEGIN
    -- Add missing project fields if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'marketplace_price') THEN
        ALTER TABLE projects ADD COLUMN marketplace_price INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'marketplace_description') THEN
        ALTER TABLE projects ADD COLUMN marketplace_description TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'published') THEN
        ALTER TABLE projects ADD COLUMN published TEXT DEFAULT 'false';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'category') THEN
        ALTER TABLE projects ADD COLUMN category VARCHAR(100);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'tags') THEN
        ALTER TABLE projects ADD COLUMN tags TEXT[] DEFAULT '{}';
    END IF;
END $$;

-- ============================================================================
-- CREATE HELPER FUNCTIONS
-- ============================================================================

-- Function to calculate popularity score based on downloads, reviews, and rating
CREATE OR REPLACE FUNCTION calculate_popularity_score(
    p_download_count INTEGER,
    p_review_count INTEGER,
    p_rating DECIMAL
) RETURNS DECIMAL AS $$
BEGIN
    -- Simple popularity formula: (downloads * 0.4) + (reviews * 0.3) + (rating * 10 * 0.3)
    RETURN (p_download_count * 0.4) + (p_review_count * 0.3) + (COALESCE(p_rating, 0) * 10 * 0.3);
END;
$$ LANGUAGE plpgsql;

-- Function to update popularity score for a marketplace project
CREATE OR REPLACE FUNCTION update_marketplace_project_popularity(p_project_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE marketplace_projects 
    SET popularity_score = calculate_popularity_score(download_count, review_count, rating)
    WHERE id = p_project_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get marketplace projects by persona
CREATE OR REPLACE FUNCTION get_marketplace_projects_by_persona(
    p_user_id UUID,
    p_persona VARCHAR,
    p_status VARCHAR DEFAULT 'active'
) RETURNS TABLE (
    id UUID,
    project_id UUID,
    builder_id UUID,
    title VARCHAR,
    description TEXT,
    price INTEGER,
    category VARCHAR,
    tags TEXT[],
    status VARCHAR,
    featured BOOLEAN,
    rating DECIMAL,
    review_count INTEGER,
    download_count INTEGER,
    popularity_score DECIMAL,
    mcp_servers TEXT[],
    published_at TIMESTAMP WITH TIME ZONE,
    builder_name VARCHAR
) AS $$
BEGIN
    -- For super_admin: return all projects
    IF p_persona = 'super_admin' THEN
        RETURN QUERY
        SELECT 
            mp.id,
            mp.project_id,
            mp.builder_id,
            mp.title,
            mp.description,
            mp.price,
            mp.category,
            mp.tags,
            mp.status,
            mp.featured,
            mp.rating,
            mp.review_count,
            mp.download_count,
            mp.popularity_score,
            mp.mcp_servers,
            mp.published_at,
            u.name as builder_name
        FROM marketplace_projects mp
        JOIN users u ON mp.builder_id = u.id
        WHERE mp.status = p_status
        ORDER BY mp.published_at DESC;
    
    -- For builder: return all active projects plus own projects
    ELSIF p_persona = 'builder' THEN
        RETURN QUERY
        SELECT 
            mp.id,
            mp.project_id,
            mp.builder_id,
            mp.title,
            mp.description,
            mp.price,
            mp.category,
            mp.tags,
            mp.status,
            mp.featured,
            mp.rating,
            mp.review_count,
            mp.download_count,
            mp.popularity_score,
            mp.mcp_servers,
            mp.published_at,
            u.name as builder_name
        FROM marketplace_projects mp
        JOIN users u ON mp.builder_id = u.id
        WHERE (mp.status = 'active' AND mp.approval_status = 'approved')
           OR mp.builder_id = p_user_id
        ORDER BY mp.published_at DESC;
    
    -- For end_user: return only active and approved projects
    ELSE
        RETURN QUERY
        SELECT 
            mp.id,
            mp.project_id,
            mp.builder_id,
            mp.title,
            mp.description,
            mp.price,
            mp.category,
            mp.tags,
            mp.status,
            mp.featured,
            mp.rating,
            mp.review_count,
            mp.download_count,
            mp.popularity_score,
            mp.mcp_servers,
            mp.published_at,
            u.name as builder_name
        FROM marketplace_projects mp
        JOIN users u ON mp.builder_id = u.id
        WHERE mp.status = 'active' AND mp.approval_status = 'approved'
        ORDER BY mp.published_at DESC;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- CREATE TRIGGERS
-- ============================================================================

-- Trigger to automatically update popularity score when review count or rating changes
CREATE OR REPLACE FUNCTION trigger_update_popularity()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.review_count != OLD.review_count OR NEW.rating != OLD.rating OR NEW.download_count != OLD.download_count THEN
        NEW.popularity_score = calculate_popularity_score(NEW.download_count, NEW.review_count, NEW.rating);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger if it doesn't exist
DROP TRIGGER IF EXISTS update_popularity_trigger ON marketplace_projects;
CREATE TRIGGER update_popularity_trigger
    BEFORE UPDATE ON marketplace_projects
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_popularity();

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Verify that all required tables exist
DO $$
DECLARE
    required_tables TEXT[] := ARRAY[
        'users',
        'projects', 
        'marketplace_projects',
        'marketplace_purchases',
        'marketplace_reviews',
        'marketplace_downloads'
    ];
    tbl_name TEXT;
BEGIN
    FOREACH tbl_name IN ARRAY required_tables
    LOOP
        IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = tbl_name) THEN
            RAISE EXCEPTION 'Required table % does not exist', tbl_name;
        END IF;
    END LOOP;
    
    RAISE NOTICE 'All required tables exist';
END $$;

-- Verify that all required columns exist in marketplace_projects
DO $$
DECLARE
    required_columns TEXT[] := ARRAY[
        'id', 'project_id', 'builder_id', 'title', 'description', 'price',
        'category', 'tags', 'status', 'featured', 'rating', 'review_count',
        'download_count', 'revenue', 'published_at', 'updated_at', 'metadata',
        'popularity_score', 'mcp_servers', 'approval_status', 'approved_by',
        'approved_at', 'rejection_reason'
    ];
    col_name TEXT;
BEGIN
    FOREACH col_name IN ARRAY required_columns
    LOOP
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'marketplace_projects' AND column_name = col_name) THEN
            RAISE EXCEPTION 'Required column % does not exist in marketplace_projects', col_name;
        END IF;
    END LOOP;
    
    RAISE NOTICE 'All required columns exist in marketplace_projects';
END $$;

-- Verify that all required indexes exist
DO $$
DECLARE
    required_indexes TEXT[] := ARRAY[
        'idx_marketplace_projects_status',
        'idx_marketplace_projects_builder',
        'idx_marketplace_projects_category',
        'idx_marketplace_projects_featured',
        'idx_marketplace_projects_approval_status',
        'idx_marketplace_projects_rating',
        'idx_marketplace_projects_price',
        'idx_marketplace_projects_published_at'
    ];
    idx_name TEXT;
BEGIN
    FOREACH idx_name IN ARRAY required_indexes
    LOOP
        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = idx_name) THEN
            RAISE EXCEPTION 'Required index % does not exist', idx_name;
        END IF;
    END LOOP;
    
    RAISE NOTICE 'All required indexes exist';
END $$;

DO $$
BEGIN
    RAISE NOTICE 'Real Marketplace database setup completed successfully!';
END $$;
