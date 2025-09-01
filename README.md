# BuilderAI - AI-Powered Project Marketplace

A comprehensive platform for building, managing, and deploying AI-powered applications with MCP server integrations.

## 🚀 Features

- **Multi-Persona Support**: Super Admin, Builder, and End User roles
- **Real Marketplace**: Database-driven project marketplace with approval workflows
- **MCP Server Integration**: Connect to various external services (Gmail, WhatsApp, Database, etc.)
- **LLM Model Management**: Support for multiple AI providers (Anthropic, OpenAI, Microsoft, Local)
- **Credential Management**: Secure storage of API keys and OAuth credentials
- **Project Configuration**: Full pipeline for prompts, LLM selection, and MCP server connections

## 🏗️ Architecture

- **Frontend**: React + TypeScript + Tailwind CSS
- **Backend**: Node.js + Express + Drizzle ORM
- **Database**: PostgreSQL
- **Cache**: Redis
- **Storage**: MinIO (S3-compatible)
- **Containerization**: Docker + Docker Compose

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose
- Node.js 18+ (for local development)

### Development Setup
```bash
# Clone the repository
git clone <repository-url>
cd builder-Aug232025

# Start the development environment
docker-compose -f docker-compose.dev.yml up -d

# Access the application
open http://localhost:8080
```

### Production Setup
```bash
# Start production environment
docker-compose up -d

# Access the application
open http://localhost:5000
```

## 👥 Demo Accounts

### Super Admin Users
- **Email**: admin@builderai.com
- **Password**: admin123

- **Email**: admin2@builderai.com  
- **Password**: admin123

### Builder Users
- **Email**: builder1@example.com
- **Password**: builder123

- **Email**: builder2@example.com
- **Password**: builder123

- **Email**: builder@test.com
- **Password**: builder123

### End User Accounts
- **Email**: user1@example.com
- **Password**: user123

- **Email**: user2@example.com
- **Password**: user123

## 🔧 API Endpoints

- **Health Check**: `GET /api/health`
- **Authentication**: `POST /api/auth/login`
- **Marketplace**: `GET /api/marketplace/projects`
- **LLM Models**: `GET /api/llms/models`
- **MCP Servers**: `GET /api/servers`
- **Prompts**: `GET /api/prompts`
- **Admin**: `GET /api/admin/*`

## 📁 Project Structure

```
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/    # UI components
│   │   ├── pages/        # Page components
│   │   └── lib/          # Utilities and hooks
├── server/                # Node.js backend
│   ├── routes/           # API route handlers
│   ├── storage/          # Data access layer
│   └── lib/              # Backend utilities
├── shared/                # Shared schemas and types
├── scripts/               # Database scripts and migrations
├── docs/                  # Documentation
└── tests/                 # Test suites
```

## 🧪 Testing

### Unit Tests
```bash
ENV=test poetry run pytest tests/unit/
```

### Integration Tests
```bash
ENV=test poetry run pytest tests/integration/
```

### Check Services
```bash
python scripts/check_services.py
```

## 📚 Documentation

- [Deployment Guide](DEPLOYMENT.md)
- [Architecture Documentation](docs/architecture/)
- [Feature Documentation](docs/features/)

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Run tests
4. Submit a pull request

## 📄 License

This project is proprietary software.

---

**Note**: This application is designed for multi-user, scalable environments with proper authentication and authorization controls.
