#!/bin/bash

# =============================================================================
# PORT CHANGE SCRIPT FOR BUILDERAI
# =============================================================================
# This script helps you change ports across the entire application
# Usage: ./scripts/change-port.sh [new_frontend_port] [new_backend_port]

set -e

# Default ports
DEFAULT_FRONTEND_PORT=8080
DEFAULT_BACKEND_PORT=5000

# Get new ports from command line arguments
NEW_FRONTEND_PORT=${1:-$DEFAULT_FRONTEND_PORT}
NEW_BACKEND_PORT=${2:-$DEFAULT_BACKEND_PORT}

echo "============================================================================="
echo "BUILDERAI PORT CONFIGURATION TOOL"
echo "============================================================================="
echo "Current default frontend port: $DEFAULT_FRONTEND_PORT"
echo "Current default backend port: $DEFAULT_BACKEND_PORT"
echo ""
echo "New frontend port: $NEW_FRONTEND_PORT"
echo "New backend port: $NEW_BACKEND_PORT"
echo ""

# Confirm the change
read -p "Do you want to change the ports? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Port change cancelled."
    exit 0
fi

echo ""
echo "Updating port configuration..."

# Update the centralized port configuration files
echo "1. Updating config/ports.js..."
sed -i "s/FRONTEND_PORT: [0-9]*/FRONTEND_PORT: $NEW_FRONTEND_PORT/g" config/ports.js
sed -i "s/BACKEND_PORT: [0-9]*/BACKEND_PORT: $NEW_BACKEND_PORT/g" config/ports.js

echo "2. Updating client/config/ports.js..."
sed -i "s/FRONTEND_PORT: [0-9]*/FRONTEND_PORT: $NEW_FRONTEND_PORT/g" client/config/ports.js
sed -i "s/localhost:[0-9]*\/api/localhost:$NEW_FRONTEND_PORT\/api/g" client/config/ports.js
sed -i "s/ws:\/\/localhost:[0-9]*/ws:\/\/localhost:$NEW_FRONTEND_PORT/g" client/config/ports.js

echo "3. Updating docker-compose.dev.yml..."
sed -i "s/\${FRONTEND_PORT:-[0-9]*}/\${FRONTEND_PORT:-$NEW_FRONTEND_PORT}/g" docker-compose.dev.yml
sed -i "s/\${BACKEND_PORT:-[0-9]*}/\${BACKEND_PORT:-$NEW_BACKEND_PORT}/g" docker-compose.dev.yml

echo "4. Updating docker-compose.test.yml..."
sed -i "s/localhost:[0-9]*/localhost:$NEW_FRONTEND_PORT/g" docker-compose.test.yml

echo "5. Updating env.example..."
sed -i "s/localhost:[0-9]*/localhost:$NEW_FRONTEND_PORT/g" env.example

echo ""
echo "============================================================================="
echo "PORT CONFIGURATION UPDATED SUCCESSFULLY!"
echo "============================================================================="
echo ""
echo "To apply the changes:"
echo "1. Stop the current Docker containers:"
echo "   docker-compose -f docker-compose.dev.yml down"
echo ""
echo "2. Clear browser cache and localStorage"
echo ""
echo "3. Restart the application:"
echo "   docker-compose -f docker-compose.dev.yml up --build"
echo ""
echo "4. Access the application at:"
echo "   http://localhost:$NEW_FRONTEND_PORT"
echo ""
echo "Note: If you have a .env file, you may need to update it manually"
echo "with the new FRONTEND_PORT and BACKEND_PORT values."
echo ""
