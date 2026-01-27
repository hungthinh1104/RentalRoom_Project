#!/bin/bash

# Helper script to set GitHub Secrets using gh CLI
# Prerequisites: gh CLI installed and authenticated (gh auth login)

set -e

echo "🔐 RentalRoom GitHub Secrets Setup"
echo "=================================="

# Check for gh CLI
if ! command -v gh &> /dev/null; then
    echo "❌ 'gh' CLI not found. Please install it or set secrets manually in GitHub Settings."
    exit 1
fi

# Configuration
REPO_URL=$(gh repo view --json url -q .url)
echo "📂 Repository: $REPO_URL"

set_secret() {
    local key=$1
    local prompt=$2
    local extra_info=$3

    echo -e "\n📝 Setting $key..."
    if [ ! -z "$extra_info" ]; then
        echo -e "   ℹ️  $extra_info"
    fi
    
    read -p "   Enter value: " value
    
    if [ -z "$value" ]; then
        echo "   ⚠️  Skipping empty value"
        return
    fi

    echo "$value" | gh secret set "$key"
    echo "   ✅ Set $key"
}

# 1. Frontend Secrets
echo -e "\n--- [1/3] Frontend Secrets (Vercel) ---"
set_secret "VERCEL_TOKEN" "Vercel Access Token" "From Vercel Account Settings > Tokens"
set_secret "VERCEL_ORG_ID" "Vercel Org ID" "From .vercel/project.json or Vercel Team Settings"
set_secret "VERCEL_PROJECT_ID" "Vercel Project ID" "From .vercel/project.json or Project Settings"

# 2. Backend Secrets
echo -e "\n--- [2/3] Backend Secrets (Azure) ---"
set_secret "AZURE_CREDENTIALS" "Azure Credentials JSON" "Output of 'az ad sp create-for-rbac ...'"
set_secret "AZURE_WEBAPP_NAME" "App Service Name" "Name of your Azure Web App"
set_secret "PRODUCTION_API_URL" "Backend Production URL" "e.g., https://your-backend.azurewebsites.net"

# 3. Environment Secrets (Production)
echo -e "\n--- [3/3] Application Secrets ---"
set_secret "DATABASE_URL" "Production DB Connection String"
set_secret "REDIS_URL" "Production Redis URL"
set_secret "JWT_SECRET" "Production JWT Secret"
set_secret "JWT_REFRESH_SECRET" "Production JWT Refresh Secret"

echo -e "\n🎉 All secrets processed!"
echo "👉 You can verify them at: $REPO_URL/settings/secrets/actions"
