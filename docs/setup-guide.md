# 🚀 BuilderAI - Complete Setup Guide

## 📋 Table of Contents
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Clean Deployment](#clean-deployment)
- [Detailed Setup](#detailed-setup)
- [Demo Users](#demo-users)
- [Production Deployment](#production-deployment)
- [Troubleshooting](#troubleshooting)

## 📋 Prerequisites

Before running BuilderAI, ensure you have the following installed:

### Required Software
- **Docker & Docker Compose** (v20.10+)
  - Download: https://www.docker.com/get-started
  - Verify: `docker --version && docker-compose --version`

- **Node.js** (v18+)
  - Download: https://nodejs.org/
  - Verify: `node --version && npm --version`

- **Git**
  - Download: https://git-scm.com/
  - Verify: `git --version`

### System Requirements
- **RAM:** 4GB minimum, 8GB recommended
- **Disk Space:** 5GB free space
- **OS:** Windows 10/11, macOS, or Linux

## 🚀 Quick Start

**Note:** This is the standard setup. For a completely clean deployment, see the [Clean Deployment](#clean-deployment) section.

### 1. Clone the Repository
```bash
git clone <repository-url>
cd builder-Aug232025-enhance-persona-fixes
```

### 2. Start All Services
```bash
# Start PostgreSQL, Redis, MinIO, and the application
docker-compose -f docker-compose.dev.yml up -d

# Run database migration (creates demo users)
docker-compose -f docker-compose.dev.yml exec builderai-dev npx tsx scripts/migrate-to-postgres.ts
```

### 3. Access the Application
- **Frontend:** http://localhost:8080
- **API Documentation:** http://localhost:8080/api/docs (if Swagger enabled)
- **MinIO Console:** http://localhost:9001 (minioadmin/minioadmin123)

### 4. Login with Demo Users
| Role | Email | Password |
|------|-------|----------|
| 👑 Super Admin | `admin@builderai.com` | `demo123` |
| 🛠️ Builder | `builder@builderai.com` | `demo123` |
| 🎯 End User | `john.doe@example.com` | `demo123` |

## 🧹 Clean Deployment

For a completely clean deployment (recommended for production or when you want to start fresh), use these commands:

### Option 1: Complete Clean Deployment (Recommended)

```bash
# 1. Stop all services and remove everything
docker-compose -f docker-compose.dev.yml down -v
docker system prune -f
docker image prune -f

# 2. Fresh deployment with build
docker-compose -f docker-compose.dev.yml up --build -d

# 3. Wait for services to be ready
sleep 30

# 4. Run database migration
docker-compose -f docker-compose.dev.yml exec builderai-dev npx tsx scripts/migrate-to-postgres.ts

# 5. Verify deployment
docker-compose -f docker-compose.dev.yml ps
```

### Option 2: Clean Database Only

```bash
# Stop services and remove database volumes only
docker-compose -f docker-compose.dev.yml down -v

# Restart with fresh database
docker-compose -f docker-compose.dev.yml up -d

# Run migration
docker-compose -f docker-compose.dev.yml exec builderai-dev npx tsx scripts/migrate-to-postgres.ts
```

### Option 3: Quick Clean (Keep Images)

```bash
# Stop and remove containers only
docker-compose -f docker-compose.dev.yml down

# Restart without rebuilding
docker-compose -f docker-compose.dev.yml up -d

# Run migration
docker-compose -f docker-compose.dev.yml exec builderai-dev npx tsx scripts/migrate-to-postgres.ts
```

### What Each Option Does

| Option | Containers | Images | Volumes | Use Case |
|--------|------------|--------|---------|----------|
| **Option 1** | ❌ Remove | ❌ Remove | ❌ Remove | Production, major updates |
| **Option 2** | ❌ Remove | ✅ Keep | ❌ Remove | Database issues, fresh data |
| **Option 3** | ❌ Remove | ✅ Keep | ✅ Keep | Quick restart, minor issues |

### Clean Deployment Benefits

- ✅ **No cached data** - Fresh database state
- ✅ **No old containers** - Clean Docker environment
- ✅ **No dangling resources** - Optimized disk usage
- ✅ **Consistent state** - Same result every time
- ✅ **Production ready** - Safe for any environment

## 📝 Detailed Setup

### Step 1: Environment Configuration

The application uses environment variables for configuration. A sample `.env` file is provided:

```bash
# Copy the example environment file
cp env.example .env

# Edit .env with your preferred settings (optional for development)
# nano .env
```

### Step 2: Docker Services

The application consists of multiple services defined in `docker-compose.dev.yml`:

#### Services Overview
- **builderai-dev:** Main application (Node.js/Express)
- **postgres:** PostgreSQL database
- **redis:** Redis cache
- **minio:** MinIO object storage
- **minio-client:** MinIO client for setup

#### Service Ports
- **Application:** 8080 (localhost:8080)
- **PostgreSQL:** 5432 (internal only)
- **Redis:** 6379 (internal only)
- **MinIO API:** 9000 (internal only)
- **MinIO Console:** 9001 (localhost:9001)

### Step 3: Database Migration

The migration script performs the following:

1. **Drops existing tables** (for clean state)
2. **Creates database schema** from Drizzle definitions
3. **Creates database indexes** for performance
4. **Seeds initial data** including demo users
5. **Ensures demo users exist** with proper permissions

```bash
# Run migration from within Docker container
docker-compose -f docker-compose.dev.yml exec builderai-dev npx tsx scripts/migrate-to-postgres.ts
```

### Step 4: Verify Installation

#### Check Service Status
```bash
# View running containers
docker-compose -f docker-compose.dev.yml ps

# View logs
docker-compose -f docker-compose.dev.yml logs -f
```

#### Test API Endpoints
```bash
# Test login endpoint
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@builderai.com","password":"demo123"}'
```

## 👥 Demo Users

### Overview

Demo users are **automatically created** during database migration and are designed to:
- Provide immediate access for development/testing
- Work across any environment (local, staging, production)
- Have predefined roles and permissions
- Be easily identifiable and removable

### Demo User Details

| User ID | Email | Password | Persona | Permissions |
|---------|-------|----------|---------|-------------|
| `550e8400-e29b-41d4-a716-446655440000` | `admin@builderai.com` | `demo123` | `super_admin` | Full system access |
| `550e8400-e29b-41d4-a716-446655440001` | `builder@builderai.com` | `demo123` | `builder` | Create/edit/publish projects |
| `550e8400-e29b-41d4-a716-446655440002` | `john.doe@example.com` | `demo123` | `end_user` | Purchase/browse marketplace |

### How Demo Users Are Created

Demo users are created in `scripts/migrate-to-postgres.ts`:

```typescript
const defaultUsers = [
  {
    id: '550e8400-e29b-41d4-a716-446655440000',
    email: 'admin@builderai.com',
    password_hash: '$2b$12$Qdcg6ig8aPq1dONSzq.qJOGPg5RiH0sD2UWv4EeMYdyX2DsZVLB22', // demo123
    persona: 'super_admin',
    roles: '["super_admin"]',
    permissions: '["manage_users", "manage_marketplace", "view_all_analytics", "approve_users"]'
  },
  // ... other users
];
```

### Demo User Characteristics

- **Predefined UUIDs:** Consistent across all environments
- **Bcrypt Password Hash:** Pre-computed for "demo123"
- **Always Active:** `is_active = 'true'`
- **Pre-approved:** `approval_status = 'approved'`
- **Idempotent:** Can be run multiple times safely

## 🏭 Production Deployment

### Production Considerations

#### 1. Environment Variables
Update `.env` for production:
```bash
NODE_ENV=production
JWT_SECRET=your-secure-jwt-secret-here
DATABASE_URL=postgresql://prod-user:prod-password@prod-host:5432/prod-db
```

#### 2. Remove Demo Users (IMPORTANT)

**For production deployment, demo users MUST be removed:**

```bash
# Use the production preparation script
node scripts/prepare-production.js

# Or manually remove demo users from database
docker-compose -f docker-compose.prod.yml exec postgres psql -U prod-user -d prod-db

# Remove demo users
DELETE FROM users WHERE email IN (
  'admin@builderai.com',
  'builder@builderai.com',
  'john.doe@example.com'
);
```

#### 3. Database Migration for Production

```bash
# Run migration without demo users (modify script)
docker-compose -f docker-compose.prod.yml exec builderai-prod npx tsx scripts/migrate-to-postgres.ts --no-demo-users
```

### Production Docker Compose

Create `docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  builderai-prod:
    build:
      context: .
      dockerfile: Dockerfile.prod
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://prod-user:prod-password@postgres:5432/prod-db
      # ... other production env vars
    ports:
      - "80:5000"
    depends_on:
      - postgres

  postgres:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=prod-db
      - POSTGRES_USER=prod-user
      - POSTGRES_PASSWORD=prod-password
    volumes:
      - postgres_prod_data:/var/lib/postgresql/data

volumes:
  postgres_prod_data:
```

### Security Checklist for Production

- [ ] Change all default passwords
- [ ] Remove demo users
- [ ] Update JWT secrets
- [ ] Configure HTTPS/SSL
- [ ] Set up database backups
- [ ] Configure monitoring/logging
- [ ] Set up firewall rules
- [ ] Configure rate limiting
- [ ] Update CORS settings

## 🔧 Troubleshooting

### General Troubleshooting Tips

**For persistent issues, try a clean deployment:**
```bash
# Complete clean deployment (recommended for major issues)
docker-compose -f docker-compose.dev.yml down -v
docker system prune -f
docker image prune -f
docker-compose -f docker-compose.dev.yml up --build -d
docker-compose -f docker-compose.dev.yml exec builderai-dev npx tsx scripts/migrate-to-postgres.ts
```

See the [Clean Deployment](#clean-deployment) section for detailed options.

### Common Issues

#### 1. Migration Fails
```bash
# Check database connection
docker-compose -f docker-compose.dev.yml exec postgres psql -U builderai -d builderai_dev -c "SELECT 1;"

# Re-run migration
docker-compose -f docker-compose.dev.yml exec builderai-dev npx tsx scripts/migrate-to-postgres.ts
```

#### 2. Services Won't Start
```bash
# Check for port conflicts
netstat -tulpn | grep :8080

# View detailed logs
docker-compose -f docker-compose.dev.yml logs builderai-dev

# Restart services
docker-compose -f docker-compose.dev.yml restart
```

#### 3. Database Connection Issues
```bash
# Check database status
docker-compose -f docker-compose.dev.yml ps postgres

# View database logs
docker-compose -f docker-compose.dev.yml logs postgres
```

#### 4. Login Not Working
```bash
# Check user exists
docker-compose -f docker-compose.dev.yml exec postgres psql -U builderai -d builderai_dev \
  -c "SELECT email, is_active, approval_status FROM users;"

# Test API directly
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@builderai.com","password":"demo123"}'
```

### Logs and Debugging

#### View Application Logs
```bash
# All services
docker-compose -f docker-compose.dev.yml logs -f

# Specific service
docker-compose -f docker-compose.dev.yml logs -f builderai-dev
```

#### View Database Logs
```bash
docker-compose -f docker-compose.dev.yml logs -f postgres
```

#### Access Database Directly
```bash
docker-compose -f docker-compose.dev.yml exec postgres psql -U builderai -d builderai_dev
```

### Performance Optimization

#### Database Indexes
The migration script creates essential indexes. Monitor slow queries:

```sql
-- Check slow queries
SELECT * FROM pg_stat_statements ORDER BY total_time DESC LIMIT 10;
```

#### Memory Usage
```bash
# Check container memory usage
docker stats

# Adjust Docker memory limits in docker-compose.yml
builderai-dev:
  deploy:
    resources:
      limits:
        memory: 1G
      reservations:
        memory: 512M
```

## 📞 Support

### Getting Help
1. Check this documentation first
2. Review the troubleshooting section
3. Check GitHub issues for similar problems
4. Create a new issue with:
   - Error messages
   - Steps to reproduce
   - Environment details
   - Log files

### Useful Commands
```bash
# Clean restart
docker-compose -f docker-compose.dev.yml down -v
docker-compose -f docker-compose.dev.yml up --build -d

# Update application
git pull
docker-compose -f docker-compose.dev.yml up --build -d

# Backup database
docker-compose -f docker-compose.dev.yml exec postgres pg_dump -U builderai builderai_dev > backup.sql
```

---

## 📝 Notes

- **Demo Users:** Only for development/testing. Remove for production.
- **Database:** PostgreSQL is required. Other databases not supported.
- **Ports:** Ensure ports 8080, 9001 are available.
- **Memory:** 4GB RAM minimum for all services.
- **Backups:** Regular database backups recommended for production.

**Last Updated:** August 29, 2025
**Version:** 1.0.0
