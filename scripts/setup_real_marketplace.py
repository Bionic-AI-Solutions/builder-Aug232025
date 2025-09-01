#!/usr/bin/env python3
"""
Real Marketplace Database Setup Script

This script sets up the database schema and generates sample data for the real-marketplace feature.
It validates the existing schema, enhances it with new columns and indexes, and creates comprehensive sample data.

Usage:
    python scripts/setup_real_marketplace.py [--env ENV] [--cleanup] [--verify-only]

Options:
    --env ENV        Environment to use (default: test)
    --cleanup        Clean up existing sample data before creating new data
    --verify-only    Only verify the database schema without creating sample data
"""

import os
import sys
import argparse
import subprocess
import psycopg2
from pathlib import Path
import logging

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def get_database_config(env='test'):
    """Get database configuration based on environment."""
    env_file = f'.env.{env}' if env != 'production' else '.env'
    
    if not os.path.exists(env_file):
        logger.error(f"Environment file {env_file} not found")
        sys.exit(1)
    
    # Read environment variables
    config = {}
    with open(env_file, 'r') as f:
        for line in f:
            if line.strip() and not line.startswith('#'):
                key, value = line.strip().split('=', 1)
                config[key] = value
    
    return {
        'host': config.get('DB_HOST', 'localhost'),
        'port': config.get('DB_PORT', '5432'),
        'database': config.get('DB_NAME', 'builderai'),
        'user': config.get('DB_USER', 'postgres'),
        'password': config.get('DB_PASSWORD', ''),
    }

def execute_sql_file(db_config, sql_file, description):
    """Execute a SQL file against the database."""
    logger.info(f"Executing {description}...")
    
    try:
        # Read SQL file
        with open(sql_file, 'r') as f:
            sql_content = f.read()
        
        # Connect to database
        conn = psycopg2.connect(**db_config)
        conn.autocommit = True
        cursor = conn.cursor()
        
        # Execute SQL
        cursor.execute(sql_content)
        
        # Get any notices
        notices = conn.notices
        for notice in notices:
            logger.info(f"Database notice: {notice.strip()}")
        
        cursor.close()
        conn.close()
        
        logger.info(f"✅ {description} completed successfully")
        return True
        
    except Exception as e:
        logger.error(f"❌ Error executing {description}: {str(e)}")
        return False

def verify_database_schema(db_config):
    """Verify that the database schema is properly set up."""
    logger.info("Verifying database schema...")
    
    try:
        conn = psycopg2.connect(**db_config)
        cursor = conn.cursor()
        
        # Check if required tables exist
        required_tables = [
            'users', 'projects', 'marketplace_projects', 
            'marketplace_purchases', 'marketplace_reviews', 'marketplace_downloads'
        ]
        
        for table in required_tables:
            cursor.execute("""
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_name = %s
                );
            """, (table,))
            
            if not cursor.fetchone()[0]:
                logger.error(f"❌ Required table '{table}' does not exist")
                return False
            else:
                logger.info(f"✅ Table '{table}' exists")
        
        # Check if required columns exist in marketplace_projects
        required_columns = [
            'id', 'project_id', 'builder_id', 'title', 'description', 'price',
            'category', 'tags', 'status', 'featured', 'rating', 'review_count',
            'download_count', 'revenue', 'published_at', 'updated_at', 'metadata',
            'popularity_score', 'mcp_servers', 'approval_status', 'approved_by',
            'approved_at', 'rejection_reason'
        ]
        
        for column in required_columns:
            cursor.execute("""
                SELECT EXISTS (
                    SELECT FROM information_schema.columns 
                    WHERE table_name = 'marketplace_projects' AND column_name = %s
                );
            """, (column,))
            
            if not cursor.fetchone()[0]:
                logger.error(f"❌ Required column '{column}' does not exist in marketplace_projects")
                return False
            else:
                logger.info(f"✅ Column '{column}' exists in marketplace_projects")
        
        # Check if required indexes exist
        required_indexes = [
            'idx_marketplace_projects_status',
            'idx_marketplace_projects_builder',
            'idx_marketplace_projects_category',
            'idx_marketplace_projects_featured',
            'idx_marketplace_projects_approval_status',
            'idx_marketplace_projects_rating',
            'idx_marketplace_projects_price',
            'idx_marketplace_projects_published_at'
        ]
        
        for index in required_indexes:
            cursor.execute("""
                SELECT EXISTS (
                    SELECT FROM pg_indexes 
                    WHERE indexname = %s
                );
            """, (index,))
            
            if not cursor.fetchone()[0]:
                logger.error(f"❌ Required index '{index}' does not exist")
                return False
            else:
                logger.info(f"✅ Index '{index}' exists")
        
        cursor.close()
        conn.close()
        
        logger.info("✅ Database schema verification completed successfully")
        return True
        
    except Exception as e:
        logger.error(f"❌ Error verifying database schema: {str(e)}")
        return False

def check_sample_data(db_config):
    """Check if sample data exists and display summary."""
    logger.info("Checking sample data...")
    
    try:
        conn = psycopg2.connect(**db_config)
        cursor = conn.cursor()
        
        # Count sample data
        cursor.execute("""
            SELECT 
                (SELECT COUNT(*) FROM users WHERE email LIKE '%@example.com' OR email LIKE '%@builderai.com') as total_users,
                (SELECT COUNT(*) FROM projects WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%@example.com' OR email LIKE '%@builderai.com')) as total_projects,
                (SELECT COUNT(*) FROM marketplace_projects) as total_marketplace_projects,
                (SELECT COUNT(*) FROM marketplace_projects WHERE status = 'active' AND approval_status = 'approved') as active_approved_projects,
                (SELECT COUNT(*) FROM marketplace_projects WHERE approval_status = 'pending') as pending_projects,
                (SELECT COUNT(*) FROM marketplace_purchases) as total_purchases,
                (SELECT COUNT(*) FROM marketplace_reviews) as total_reviews,
                (SELECT COUNT(*) FROM marketplace_downloads) as total_downloads
        """)
        
        result = cursor.fetchone()
        
        logger.info("📊 Sample Data Summary:")
        logger.info(f"   Users: {result[0]}")
        logger.info(f"   Projects: {result[1]}")
        logger.info(f"   Marketplace Projects: {result[2]}")
        logger.info(f"   Active & Approved Projects: {result[3]}")
        logger.info(f"   Pending Projects: {result[4]}")
        logger.info(f"   Purchases: {result[5]}")
        logger.info(f"   Reviews: {result[6]}")
        logger.info(f"   Downloads: {result[7]}")
        
        cursor.close()
        conn.close()
        
        return result
        
    except Exception as e:
        logger.error(f"❌ Error checking sample data: {str(e)}")
        return None

def cleanup_sample_data(db_config):
    """Clean up existing sample data."""
    logger.info("Cleaning up existing sample data...")
    
    try:
        conn = psycopg2.connect(**db_config)
        conn.autocommit = True
        cursor = conn.cursor()
        
        # Delete in correct order to respect foreign key constraints
        cursor.execute("DELETE FROM marketplace_reviews;")
        cursor.execute("DELETE FROM marketplace_downloads;")
        cursor.execute("DELETE FROM marketplace_purchases;")
        cursor.execute("DELETE FROM marketplace_projects;")
        cursor.execute("DELETE FROM projects WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%@example.com' OR email LIKE '%@builderai.com');")
        cursor.execute("DELETE FROM users WHERE email LIKE '%@example.com' OR email LIKE '%@builderai.com';")
        
        cursor.close()
        conn.close()
        
        logger.info("✅ Sample data cleanup completed")
        return True
        
    except Exception as e:
        logger.error(f"❌ Error cleaning up sample data: {str(e)}")
        return False

def main():
    parser = argparse.ArgumentParser(description='Setup Real Marketplace Database')
    parser.add_argument('--env', default='test', help='Environment to use (default: test)')
    parser.add_argument('--cleanup', action='store_true', help='Clean up existing sample data before creating new data')
    parser.add_argument('--verify-only', action='store_true', help='Only verify the database schema without creating sample data')
    
    args = parser.parse_args()
    
    logger.info(f"🚀 Starting Real Marketplace database setup for environment: {args.env}")
    
    # Get database configuration
    db_config = get_database_config(args.env)
    logger.info(f"📡 Connecting to database: {db_config['database']} on {db_config['host']}:{db_config['port']}")
    
    # Get script paths
    scripts_dir = Path(__file__).parent
    db_setup_script = scripts_dir / 'real-marketplace-db-setup.sql'
    sample_data_script = scripts_dir / 'generate-real-marketplace-data.sql'
    
    if not db_setup_script.exists():
        logger.error(f"❌ Database setup script not found: {db_setup_script}")
        sys.exit(1)
    
    if not sample_data_script.exists():
        logger.error(f"❌ Sample data script not found: {sample_data_script}")
        sys.exit(1)
    
    # Step 1: Execute database setup script
    if not execute_sql_file(db_config, db_setup_script, "Database schema setup"):
        logger.error("❌ Database setup failed")
        sys.exit(1)
    
    # Step 2: Verify database schema
    if not verify_database_schema(db_config):
        logger.error("❌ Database schema verification failed")
        sys.exit(1)
    
    if args.verify_only:
        logger.info("✅ Database schema verification completed successfully")
        return
    
    # Step 3: Clean up existing sample data if requested
    if args.cleanup:
        if not cleanup_sample_data(db_config):
            logger.error("❌ Sample data cleanup failed")
            sys.exit(1)
    
    # Step 4: Check if sample data already exists
    existing_data = check_sample_data(db_config)
    if existing_data and existing_data[0] > 0:
        logger.warning("⚠️  Sample data already exists. Use --cleanup to remove existing data first.")
        response = input("Do you want to continue and add more sample data? (y/N): ")
        if response.lower() != 'y':
            logger.info("Setup cancelled by user")
            return
    
    # Step 5: Generate sample data
    if not execute_sql_file(db_config, sample_data_script, "Sample data generation"):
        logger.error("❌ Sample data generation failed")
        sys.exit(1)
    
    # Step 6: Final verification
    logger.info("🔍 Performing final verification...")
    final_data = check_sample_data(db_config)
    
    if final_data and final_data[0] > 0:
        logger.info("✅ Real Marketplace database setup completed successfully!")
        logger.info("🎉 You can now test the marketplace functionality with the sample data.")
        
        # Display login credentials for testing
        logger.info("\n📋 Test User Credentials:")
        logger.info("   Admin: admin@builderai.com / password")
        logger.info("   Builder: builder1@example.com / password")
        logger.info("   End User: user1@example.com / password")
        
    else:
        logger.error("❌ Final verification failed - no sample data found")
        sys.exit(1)

if __name__ == '__main__':
    main()

