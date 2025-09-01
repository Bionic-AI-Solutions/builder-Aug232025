# BuilderAI Deployment Guide

This guide explains how to deploy the BuilderAI application using Docker containers.

## Prerequisites

- Docker and Docker Compose installed
- At least 2GB of available RAM
- Port 5000 available on your system

## Quick Start

### Option 1: Using the deployment script (Recommended)

```bash
./deploy.sh
```

This script will:
- Check if Docker is running
- Build and start the application
- Verify the deployment
- Provide access URLs

### Option 2: Manual deployment

#### Production Deployment

```bash
# Build and start the production container
docker-compose up --build -d

# Check the status
docker-compose ps

# View logs
docker-compose logs -f
```

#### Development Deployment

```bash
# Build and start the development container with hot reloading
docker-compose -f docker-compose.dev.yml up --build -d

# Check the status
docker-compose -f docker-compose.dev.yml ps

# View logs
docker-compose -f docker-compose.dev.yml logs -f
```

## Accessing the Application

Once deployed, you can access the application at:

- **Main Application**: http://localhost:5000
- **Health Check**: http://localhost:5000/api/health
- **API Endpoints**: http://localhost:5000/api/*

## Demo Credentials

The application comes with demo data. You can log in with:

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

**Note**: These credentials provide access to different personas and features within the application.

## Management Commands

### View logs
```bash
# Production
docker-compose logs -f

# Development
docker-compose -f docker-compose.dev.yml logs -f
```

### Stop the application
```bash
# Production
docker-compose down

# Development
docker-compose -f docker-compose.dev.yml down
```

### Restart the application
```bash
# Production
docker-compose restart

# Development
docker-compose -f docker-compose.dev.yml restart
```

### Update the application
```bash
# Pull latest changes and rebuild
git pull
docker-compose up --build -d
```

## Environment Variables

The application uses the following environment variables:

- `NODE_ENV`: Set to `production` or `development`
- `PORT`: Port number (default: 5000)
- `DATABASE_URL`: PostgreSQL connection string (optional, uses in-memory storage by default)

## Troubleshooting

### Port already in use
If port 5000 is already in use, you can change it in the docker-compose.yml file:

```yaml
ports:
  - "8080:5000"  # Change 8080 to your preferred port
```

### Container fails to start
Check the logs for errors:
```bash
docker-compose logs
```

### Memory issues
If you encounter memory issues, try:
```bash
docker system prune -a
docker-compose up --build -d
```

### Health check fails
The health check endpoint is available at `/api/health`. If it fails, check:
- Application logs
- Database connectivity (if using PostgreSQL)
- Port availability

## Production Considerations

For production deployment, consider:

1. **Database**: Uncomment the PostgreSQL service in docker-compose.yml
2. **Environment Variables**: Set proper environment variables
3. **SSL/TLS**: Use a reverse proxy (nginx) for HTTPS
4. **Monitoring**: Add monitoring and logging solutions
5. **Backup**: Implement database backup strategies

## Architecture

The application consists of:

- **Frontend**: React + TypeScript + Vite
- **Backend**: Express.js + TypeScript
- **Database**: PostgreSQL (optional, in-memory storage by default)
- **Container**: Docker with multi-stage build for optimization

## Support

For issues or questions:
1. Check the logs: `docker-compose logs`
2. Verify Docker is running: `docker info`
3. Check port availability: `netstat -an | grep 5000`

