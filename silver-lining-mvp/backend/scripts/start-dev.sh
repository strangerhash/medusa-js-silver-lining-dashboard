#!/bin/bash

# Silver Lining Backend - Development Startup Script

echo "🚀 Starting Silver Lining Backend Development Environment..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18 or higher."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18 or higher is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js version: $(node -v)"

# Check if .env file exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp env.example .env
    echo "✅ .env file created. Please update it with your configuration."
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Create logs directory
echo "📁 Creating logs directory..."
mkdir -p logs

# Start the development server
echo "🔥 Starting development server..."
echo "📊 Server will be available at: http://localhost:9000"
echo "🔗 Health check: http://localhost:9000/health"
echo "📚 API Documentation: http://localhost:9000/api-docs"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

npm run dev 