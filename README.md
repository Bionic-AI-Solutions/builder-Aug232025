# 🚀 BuilderAI - AI-Powered Development Platform

A comprehensive platform for building, deploying, and monetizing AI applications with multi-persona support.

## 📖 Documentation

For complete setup instructions, demo users, and production deployment guide, see:
- **[Complete Setup Guide](./docs/setup-guide.md)** - Step-by-step instructions
- **[Demo Users Guide](./DEMO-USERS.md)** - User credentials and roles
- **[Production Checklist](./docs/production-checklist.md)** - Production deployment checklist

### Production Setup
```bash
# Generate production checklist and setup instructions
node scripts/prepare-production.js
```

## 🎯 Quick Start

### Prerequisites
- Docker & Docker Compose
- Node.js 18+
- PostgreSQL (via Docker)

### 1. Clone & Setup
```bash
git clone <repository-url>
cd builder-Aug232025-enhance-persona-fixes
```

### 2. Start Services
```bash
# Start all services (PostgreSQL, Redis, MinIO, App)
docker-compose -f docker-compose.dev.yml up -d

# Run database migration (creates demo users)
docker-compose -f docker-compose.dev.yml exec builderai-dev npx tsx scripts/migrate-to-postgres.ts
```

### 3. Access Application
- **Frontend**: http://localhost:8080
- **API**: http://localhost:8080/api
- **MinIO Console**: http://localhost:9001 (minioadmin/minioadmin123)

## 👥 Demo Users (Always Available)

These users are **automatically created** during setup and work on any database:

| Role | Email | Password | Persona |
|------|-------|----------|---------|
| 👑 **Super Admin** | `admin@builderai.com` | `demo123` | super_admin |
| 🛠️ **Builder** | `builder@builderai.com` | `demo123` | builder |
| 🎯 **End User** | `john.doe@example.com` | `demo123` | end_user |

### Quick Login Test
```bash
# Test login with admin
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@builderai.com","password":"demo123"}'
```

## 🏗️ Architecture

### Tech Stack
- **Backend**: Node.js, Express, TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Cache**: Redis
- **Storage**: MinIO (S3-compatible)
- **Frontend**: React, TypeScript, Tailwind CSS
- **Deployment**: Docker & Docker Compose

### Services
- **PostgreSQL**: Primary database
- **Redis**: Caching and sessions
- **MinIO**: Object storage
- **BuilderAI App**: Main application

## 🔧 Development

### Environment Setup
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm test

# Build for production
npm run build
```

### Database Operations
```bash
# Run migrations
npx tsx scripts/migrate-to-postgres.ts

# Check users
npx tsx scripts/check-users.ts

# Reset database
docker-compose -f docker-compose.dev.yml down -v
docker-compose -f docker-compose.dev.yml up -d
```

## 📁 Project Structure

```
├── client/                 # React frontend
├── server/                 # Express backend
│   ├── routes/            # API routes
│   ├── storage/           # Data storage layer
│   └── middleware/        # Express middleware
├── scripts/               # Database scripts
├── shared/                # Shared types/schemas
├── docs/                  # Documentation
└── docker-compose.dev.yml # Development setup
```

## 🎨 Features

### Multi-Persona Support
- **Super Admin**: Full system management
- **Builder**: Project creation and publishing
- **End User**: Marketplace browsing and purchases

### Core Functionality
- ✅ User authentication & authorization
- ✅ Project creation and management
- ✅ Marketplace for AI applications
- ✅ Revenue tracking and analytics
- ✅ File storage with MinIO
- ✅ Real-time chat with MCP servers
- ✅ Widget implementation system

## 📚 Documentation

- [Demo Users Guide](./DEMO-USERS.md) - Default users and credentials
- [API Documentation](./docs/features/backend-apis/) - API endpoints
- [Deployment Guide](./DEPLOYMENT.md) - Production deployment
- [Database Schema](./shared/schema.ts) - Data models

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests: `npm test`
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For issues and questions:
- Check the [Demo Users Guide](./DEMO-USERS.md)
- Review the [API Documentation](./docs/features/backend-apis/)
- Open an issue on GitHub

---

**Happy Building!** 🚀
