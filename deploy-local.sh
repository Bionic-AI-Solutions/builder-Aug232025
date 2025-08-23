#!/bin/bash

# BuilderAI Local Deployment Script

set -e

echo "🚀 Starting BuilderAI local deployment..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js and try again."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm and try again."
    exit 1
fi

echo "✅ Node.js version: $(node --version)"
echo "✅ npm version: $(npm --version)"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build the application
echo "🔨 Building the application..."
npm run build

# Check if build was successful
if [ ! -d "dist" ]; then
    echo "❌ Build failed. dist directory not found."
    exit 1
fi

# Start the application
echo "🚀 Starting the application..."
echo "🌐 The application will be available at: http://localhost:5000"
echo "📊 Health check: http://localhost:5000/api/health"
echo ""
echo "🛑 Press Ctrl+C to stop the application"
echo ""

# Start the production server
npm run start

