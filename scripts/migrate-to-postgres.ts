import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { db } from '../server/db';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from '../shared/schema';

// Database migration script
async function runMigrations() {
  console.log('🚀 Starting database migrations...');

  try {
    // Drop existing tables if they exist (to fix data type issues)
    console.log('🗑️  Dropping existing tables...');
    const tables = [
      'usage_events',
      'template_purchases',
      'revenue_events',
      'widget_implementations',
      'marketplace_apps',
      'chat_messages',
      'mcp_servers',
      'projects',
      'social_accounts',
      'llm_models',
      'llm_providers',
      'users'
    ];

    for (const table of tables) {
      await db.execute(`DROP TABLE IF EXISTS ${table} CASCADE;`);
    }

    console.log('✅ Existing tables dropped successfully!');

    // Create tables using Drizzle schema
    console.log('📋 Creating tables from schema...');

    // Users table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT,
        persona TEXT NOT NULL DEFAULT 'builder',
        roles JSONB DEFAULT '[]'::jsonb,
        permissions JSONB DEFAULT '[]'::jsonb,
        metadata JSONB DEFAULT '{}'::jsonb,
        is_active TEXT NOT NULL DEFAULT 'true',
        approval_status TEXT NOT NULL DEFAULT 'pending',
        approved_by UUID REFERENCES users(id),
        approved_at TIMESTAMP,
        rejection_reason TEXT,
        last_login_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Social accounts table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS social_accounts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        provider TEXT NOT NULL,
        provider_user_id TEXT NOT NULL,
        access_token TEXT,
        refresh_token TEXT,
        expires_at TIMESTAMP,
        profile_data JSONB DEFAULT '{}'::jsonb,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Projects table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS projects (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id),
        name TEXT NOT NULL,
        description TEXT,
        prompt TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'development',
        llm TEXT NOT NULL,
        mcp_servers JSONB NOT NULL DEFAULT '[]'::jsonb,
        files JSONB DEFAULT '[]'::jsonb,
        revenue INTEGER DEFAULT 0,
        revenue_growth INTEGER DEFAULT 0,
        published TEXT DEFAULT 'false',
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // MCP servers table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS mcp_servers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id),
        name TEXT NOT NULL,
        type TEXT NOT NULL DEFAULT 'sse',
        url TEXT,
        description TEXT,
        status TEXT NOT NULL DEFAULT 'disconnected',
        latency INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Chat messages table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS chat_messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id),
        sender TEXT NOT NULL,
        message TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Marketplace apps table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS marketplace_apps (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        project_id UUID NOT NULL REFERENCES projects(id),
        name TEXT NOT NULL,
        description TEXT,
        price INTEGER NOT NULL,
        rating TEXT NOT NULL DEFAULT '0',
        downloads INTEGER DEFAULT 0,
        category TEXT NOT NULL DEFAULT 'custom',
        icon TEXT NOT NULL DEFAULT '🔧',
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Widget implementations table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS widget_implementations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        end_user_id UUID NOT NULL REFERENCES users(id),
        project_id UUID NOT NULL REFERENCES projects(id),
        builder_id UUID NOT NULL REFERENCES users(id),
        implementation_url TEXT NOT NULL,
        embed_code TEXT NOT NULL,
        configuration JSONB DEFAULT '{}'::jsonb,
        status TEXT NOT NULL DEFAULT 'active',
        usage_count INTEGER DEFAULT 0,
        revenue_generated INTEGER DEFAULT 0,
        last_activity TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Revenue events table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS revenue_events (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        implementation_id UUID REFERENCES widget_implementations(id),
        builder_id UUID NOT NULL REFERENCES users(id),
        end_user_id UUID NOT NULL REFERENCES users(id),
        amount INTEGER NOT NULL,
        event_type TEXT NOT NULL,
        description TEXT,
        metadata JSONB DEFAULT '{}'::jsonb,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Template purchases table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS template_purchases (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        buyer_id UUID NOT NULL REFERENCES users(id),
        template_project_id UUID NOT NULL REFERENCES projects(id),
        seller_id UUID NOT NULL REFERENCES users(id),
        purchase_amount INTEGER NOT NULL,
        purchase_date TIMESTAMP DEFAULT NOW(),
        status TEXT NOT NULL DEFAULT 'completed',
        metadata JSONB DEFAULT '{}'::jsonb
      );
    `);

    // Usage events table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS usage_events (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        implementation_id UUID NOT NULL REFERENCES widget_implementations(id),
        event_type TEXT NOT NULL,
        event_data JSONB DEFAULT '{}'::jsonb,
        user_agent TEXT,
        ip_address TEXT,
        session_id VARCHAR(255),
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // LLM Providers table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS llm_providers (
        id TEXT PRIMARY KEY DEFAULT ('provider-' || gen_random_uuid()::text),
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
    `);

    // LLM Models table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS llm_models (
        id TEXT PRIMARY KEY DEFAULT ('model-' || gen_random_uuid()::text),
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
    `);

    console.log('✅ Database schema created successfully!');

    // Create indexes for better performance
    console.log('📊 Creating database indexes...');

    await db.execute(`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);`);
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_users_persona ON users(persona);`);
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);`);
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);`);
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_mcp_servers_user_id ON mcp_servers(user_id);`);
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON chat_messages(user_id);`);
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_marketplace_apps_project_id ON marketplace_apps(project_id);`);
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_widget_implementations_end_user_id ON widget_implementations(end_user_id);`);
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_revenue_events_builder_id ON revenue_events(builder_id);`);

    console.log('✅ Database indexes created successfully!');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

// Seed initial data
async function seedInitialData() {
  console.log('🌱 Seeding initial data...');

  try {
    // Check if we already have users
    const result = await db.execute(`SELECT COUNT(*) as count FROM users;`);
    const userCount = parseInt(result[0].count as string);

    if (userCount === 0) {
      console.log('📝 Creating initial users...');

      // Create Super Admin
      await db.execute(`
        INSERT INTO users (id, email, password_hash, persona, roles, permissions, is_active, approval_status, created_at, updated_at)
        VALUES (
          '550e8400-e29b-41d4-a716-446655440000',
          'admin@builderai.com',
          '$2b$12$Qdcg6ig8aPq1dONSzq.qJOGPg5RiH0sD2UWv4EeMYdyX2DsZVLB22',
          'super_admin',
          '["super_admin"]'::jsonb,
          '["manage_users", "manage_marketplace", "view_all_analytics", "approve_users"]'::jsonb,
          'true',
          'approved',
          NOW(),
          NOW()
        );
      `);

      // Create Builder
      await db.execute(`
        INSERT INTO users (id, email, password_hash, persona, roles, permissions, is_active, approval_status, created_at, updated_at)
        VALUES (
          '550e8400-e29b-41d4-a716-446655440001',
          'builder@builderai.com',
          '$2b$12$Qdcg6ig8aPq1dONSzq.qJOGPg5RiH0sD2UWv4EeMYdyX2DsZVLB22',
          'builder',
          '["builder"]'::jsonb,
          '["create_project", "edit_project", "publish_project", "view_analytics"]'::jsonb,
          'true',
          'approved',
          NOW(),
          NOW()
        );
      `);

      // Create End User
      await db.execute(`
        INSERT INTO users (id, email, password_hash, persona, roles, permissions, is_active, approval_status, created_at, updated_at)
        VALUES (
          '550e8400-e29b-41d4-a716-446655440002',
          'user@builderai.com',
          '$2b$12$Qdcg6ig8aPq1dONSzq.qJOGPg5RiH0sD2UWv4EeMYdyX2DsZVLB22',
          'end_user',
          '["end_user"]'::jsonb,
          '["purchase_project", "view_marketplace"]'::jsonb,
          'true',
          'approved',
          NOW(),
          NOW()
        );
      `);

      console.log('✅ Initial users created successfully!');
    } else {
      console.log(`ℹ️  Found ${userCount} existing users, skipping seed data.`);
    }

  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  }
}

// Main migration function
async function main() {
  console.log('🔄 Starting BuilderAI Database Migration...');

  try {
    await runMigrations();
    await seedInitialData();

    console.log('🎉 Database migration completed successfully!');
    console.log('');
    console.log('📊 Migration Summary:');
    console.log('✅ All tables created');
    console.log('✅ Indexes optimized');
    console.log('✅ Initial data seeded');
    console.log('✅ Ready for PostgreSQL storage');
    console.log('');
    console.log('🚀 Next step: Update storage layer to use PostgreSQL');

  } catch (error) {
    console.error('💥 Migration failed:', error);
    throw error;
  }
}

export { runMigrations, seedInitialData };

// Run migration
main().catch(console.error);
