#!/bin/bash

# Verify Docker Builds & Composition
# This script builds and starts the application using Docker Compose

set -e

echo "🐳 Verifying Hub Docker Configuration..."
echo "========================================"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

echo "📦 Building images..."
docker compose build

if [ $? -ne 0 ]; then
    echo "❌ Docker build failed"
    exit 1
fi

echo "🚀 Starting services..."
docker compose up -d

echo "⏳ Waiting for services to be ready..."
sleep 20

echo "🏥 Checking health..."
if curl -s http://localhost:3001/health | grep "ok" > /dev/null; then
    echo "✅ Backend is healthy"
else
    echo "❌ Backend health check failed"
    docker compose logs backend
fi

if curl -s -I http://localhost:3000 > /dev/null; then
    echo "✅ Frontend is reachable"
else
    echo "❌ Frontend check failed"
    docker compose logs frontend
fi

echo "🧹 Cleaning up..."
docker compose down

echo "✨ Docker verification complete!"
