#!/bin/bash

# Production Deployment Script for Azure
# Run this script to deploy backend to Azure App Service

set -e

echo "🚀 Starting deployment to Azure..."

# Configuration
RESOURCE_GROUP="rental-room-rg"
APP_NAME="rental-room-api"
LOCATION="southeastasia"

# Check if Azure CLI is installed
if ! command -v az &> /dev/null; then
    echo "❌ Azure CLI not found. Please install: https://aka.ms/InstallAzureCLIDeb"
    exit 1
fi

# Login check
echo "Checking Azure login status..."
az account show &> /dev/null || {
    echo "Please login to Azure:"
    az login
}

# Build backend
echo "📦 Building backend..."
cd be-rental-room
npm ci
npx prisma generate
npm run build

# Create deployment package
echo "📦 Creating deployment package..."
rm -rf deploy deploy.zip
mkdir -p deploy
cp -r dist node_modules package.json package-lock.json prisma deploy/
cd deploy && zip -r ../deploy.zip . && cd ..

# Deploy to Azure
echo "☁️ Deploying to Azure App Service..."
az webapp deployment source config-zip \
  --resource-group $RESOURCE_GROUP \
  --name $APP_NAME \
  --src deploy.zip

# Run migrations
echo "🗄️ Running database migrations..."
# Note: Set DATABASE_URL in Azure App Settings first
az webapp config appsettings list \
  --resource-group $RESOURCE_GROUP \
  --name $APP_NAME \
  --query "[?name=='DATABASE_URL'].value" -o tsv > /dev/null

if [ $? -eq 0 ]; then
    echo "Running Prisma migrations..."
    DATABASE_URL=$(az webapp config appsettings list \
      --resource-group $RESOURCE_GROUP \
      --name $APP_NAME \
      --query "[?name=='DATABASE_URL'].value" -o tsv)
    
    DATABASE_URL=$DATABASE_URL npx prisma migrate deploy
else
    echo "⚠️ DATABASE_URL not set in Azure. Skipping migrations."
fi

# Cleanup
rm -rf deploy deploy.zip

echo "✅ Deployment complete!"
echo "🌐 App URL: https://$APP_NAME.azurewebsites.net"
