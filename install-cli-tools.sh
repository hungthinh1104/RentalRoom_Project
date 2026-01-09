#!/bin/bash

# CLI Tools Installation Script
# Installs: gcloud, Azure CLI, Vercel CLI

set -e

echo "🚀 Installing CLI Tools for Deployment..."
echo ""

# Check if running as root
if [ "$EUID" -eq 0 ]; then 
   echo "⚠️  Please do not run as root. Run as normal user with sudo access."
   exit 1
fi

# 1. Install Google Cloud SDK
echo "📦 Installing Google Cloud SDK..."
if command -v gcloud &> /dev/null; then
    echo "✅ gcloud already installed"
else
    # Add repository
    echo "deb [signed-by=/usr/share/keyrings/cloud.google.gpg] https://packages.cloud.google.com/apt cloud-sdk main" | sudo tee -a /etc/apt/sources.list.d/google-cloud-sdk.list
    
    # Import key
    curl https://packages.cloud.google.com/apt/doc/apt-key.gpg | sudo apt-key --keyring /usr/share/keyrings/cloud.google.gpg add -
    
    # Install
    sudo apt-get update && sudo apt-get install -y google-cloud-cli
    
    echo "✅ Google Cloud SDK installed"
fi

echo ""

# 2. Install Azure CLI
echo "📦 Installing Azure CLI..."
if command -v az &> /dev/null; then
    echo "✅ Azure CLI already installed"
else
    curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash
    echo "✅ Azure CLI installed"
fi

echo ""

# 3. Install Vercel CLI
echo "📦 Installing Vercel CLI..."
if command -v vercel &> /dev/null; then
    echo "✅ Vercel CLI already installed"
else
    npm install -g vercel
    echo "✅ Vercel CLI installed"
fi

echo ""
echo "🎉 All CLI tools installed successfully!"
echo ""
echo "=== Verification ==="
echo "Google Cloud SDK:"
gcloud version | head -1
echo ""
echo "Azure CLI:"
az version --output json | grep '"azure-cli":' | head -1
echo ""
echo "Vercel CLI:"
vercel --version
echo ""
echo "✅ All tools ready for deployment!"
echo ""
echo "Next steps:"
echo "1. Run: gcloud auth login"
echo "2. Run: az login"
echo "3. Run: vercel login"
