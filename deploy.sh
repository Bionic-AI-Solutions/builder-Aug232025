#!/bin/bash

# BuilderAI Deployment Script

set -e

echo "🚀 Starting BuilderAI deployment..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Function to cleanup
cleanup() {
    echo "🧹 Cleaning up..."
    docker-compose down --remove-orphans
}

# Set trap to cleanup on exit
trap cleanup EXIT

# Build and start the application
echo "📦 Building and starting BuilderAI..."
docker-compose up --build -d

# Wait for the application to be ready
echo "⏳ Waiting for application to be ready..."
sleep 10

# Check if the application is running
if curl -f http://localhost:5000/api/health > /dev/null 2>&1; then
    echo "✅ BuilderAI is running successfully!"
    echo "🌐 Access the application at: http://localhost:5000"
    echo "📊 Health check: http://localhost:5000/api/health"
    echo ""
    echo "📝 To view logs: docker-compose logs -f"
    echo "🛑 To stop: docker-compose down"
    echo ""
    echo "🎉 Deployment complete!"
else
    echo "❌ Application failed to start properly"
    echo "📋 Checking logs..."
    docker-compose logs
    exit 1
fi

