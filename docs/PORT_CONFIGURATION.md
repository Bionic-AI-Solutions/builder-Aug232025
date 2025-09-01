# Port Configuration Guide

## Overview

This application now uses a centralized port configuration system that allows you to change ports across the entire application by modifying just a few files.

## Quick Port Change

To quickly change ports, use the provided script:

```bash
# Change to port 3000 (frontend) and 5000 (backend)
./scripts/change-port.sh 3000 5000

# Change only frontend port (backend stays at 5000)
./scripts/change-port.sh 3000

# Use default ports (8080 frontend, 5000 backend)
./scripts/change-port.sh
```

## Manual Port Configuration

If you prefer to change ports manually, here are the key files to modify:

### 1. Central Configuration Files

**`config/ports.js`** - Main server-side configuration:
```javascript
const PORT_CONFIG = {
  FRONTEND_PORT: 8080,    // Change this
  BACKEND_PORT: 5000,     // Change this
  DATABASE_PORT: 5432,
  REDIS_PORT: 6379,
  MINIO_PORT: 9000,
  MINIO_CONSOLE_PORT: 9001
};
```

**`client/config/ports.js`** - Client-side configuration:
```javascript
const CLIENT_PORT_CONFIG = {
  FRONTEND_PORT: 8080,    // Change this
  API_BASE_URL: `http://localhost:8080/api`,  // This updates automatically
  WS_BASE_URL: `ws://localhost:8080`          // This updates automatically
};
```

### 2. Docker Configuration

**`docker-compose.dev.yml`** - Uses environment variables:
```yaml
ports:
  - "${FRONTEND_PORT:-8080}:${BACKEND_PORT:-5000}"
```

### 3. Environment Variables

Create a `.env` file in the root directory:
```bash
# Port Configuration
FRONTEND_PORT=8080
BACKEND_PORT=5000
DATABASE_PORT=5432
REDIS_PORT=6379
MINIO_PORT=9000
MINIO_CONSOLE_PORT=9001

# Other configuration...
CORS_ORIGIN=http://localhost:8080
```

## Applying Changes

After changing ports:

1. **Stop the current containers:**
   ```bash
   docker-compose -f docker-compose.dev.yml down
   ```

2. **Clear browser cache and localStorage**

3. **Restart the application:**
   ```bash
   docker-compose -f docker-compose.dev.yml up --build
   ```

4. **Access the application:**
   ```
   http://localhost:[NEW_FRONTEND_PORT]
   ```

## Port Usage

| Service | Default Port | Purpose |
|---------|-------------|---------|
| Frontend | 8080 | React application (user access) |
| Backend | 5000 | Express API server (internal) |
| Database | 5432 | PostgreSQL database |
| Redis | 6379 | Caching and sessions |
| MinIO | 9000 | Object storage |
| MinIO Console | 9001 | MinIO web interface |

## Troubleshooting

### Port Already in Use
If you get "port already in use" errors:

1. Check what's using the port:
   ```bash
   lsof -i :8080
   ```

2. Stop the conflicting service or choose a different port

### Docker Port Conflicts
If Docker containers can't bind to ports:

1. Stop all containers:
   ```bash
   docker-compose -f docker-compose.dev.yml down
   ```

2. Remove any conflicting containers:
   ```bash
   docker ps -a
   docker rm [container_id]
   ```

3. Restart with new ports

### Browser Cache Issues
If the page doesn't load after port changes:

1. Clear browser cache (Ctrl+Shift+R or Cmd+Shift+R)
2. Clear localStorage:
   ```javascript
   localStorage.clear()
   ```
3. Hard refresh the page

## Environment-Specific Configuration

### Development
- Use the script: `./scripts/change-port.sh 3000 5000`
- Access at: `http://localhost:3000`

### Production
- Set environment variables in your deployment platform
- Use the same configuration files but with production values

### Testing
- Test configuration is in `docker-compose.test.yml`
- Uses the same port configuration system

## Best Practices

1. **Use the script** for quick port changes
2. **Document your changes** if using custom ports
3. **Test thoroughly** after port changes
4. **Update documentation** if changing default ports
5. **Use environment variables** in production deployments

## Support

If you encounter issues with port configuration:

1. Check the logs: `docker-compose -f docker-compose.dev.yml logs`
2. Verify port availability: `netstat -tulpn | grep :8080`
3. Reset to defaults: `./scripts/change-port.sh 8080 5000`
