#!/bin/bash
# Azure Deployment Script for Rental Room Backend

set -e

echo "🚀 Azure Deployment Script for Rental Room API"
echo "================================================"

# Configuration
RESOURCE_GROUP="rental-room-rg"
LOCATION="southeastasia"
ACR_NAME="rentalroomacr"
IMAGE_NAME="rental-room-api"
IMAGE_TAG="latest"
CONTAINER_NAME="rental-room-api"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Step 1: Check if logged in to Azure
echo -e "\n${YELLOW}Step 1: Checking Azure login...${NC}"
if ! az account show &> /dev/null; then
    echo -e "${RED}Not logged in to Azure. Running 'az login'...${NC}"
    az login
else
    echo -e "${GREEN}✓ Already logged in to Azure${NC}"
fi

# Step 2: Create Resource Group (if not exists)
echo -e "\n${YELLOW}Step 2: Creating Resource Group...${NC}"
if az group show --name $RESOURCE_GROUP &> /dev/null; then
    echo -e "${GREEN}✓ Resource group already exists${NC}"
else
    az group create --name $RESOURCE_GROUP --location $LOCATION
    echo -e "${GREEN}✓ Resource group created${NC}"
fi

# Step 3: Create Azure Container Registry (if not exists)
echo -e "\n${YELLOW}Step 3: Creating Azure Container Registry...${NC}"
if az acr show --name $ACR_NAME --resource-group $RESOURCE_GROUP &> /dev/null; then
    echo -e "${GREEN}✓ ACR already exists${NC}"
else
    az acr create --resource-group $RESOURCE_GROUP \
        --name $ACR_NAME \
        --sku Basic \
        --admin-enabled true
    echo -e "${GREEN}✓ ACR created${NC}"
fi

# Step 4: Login to ACR
echo -e "\n${YELLOW}Step 4: Logging in to ACR...${NC}"
az acr login --name $ACR_NAME
echo -e "${GREEN}✓ Logged in to ACR${NC}"

# Step 5: Build Docker image (if not already built)
echo -e "\n${YELLOW}Step 5: Checking Docker image...${NC}"
if docker images | grep -q "$IMAGE_NAME.*$IMAGE_TAG"; then
    echo -e "${GREEN}✓ Docker image already exists${NC}"
else
    echo -e "${YELLOW}Building Docker image...${NC}"
    docker build -t $IMAGE_NAME:$IMAGE_TAG .
    echo -e "${GREEN}✓ Docker image built${NC}"
fi

# Step 6: Tag and push to ACR
echo -e "\n${YELLOW}Step 6: Tagging and pushing image to ACR...${NC}"
docker tag $IMAGE_NAME:$IMAGE_TAG $ACR_NAME.azurecr.io/$IMAGE_NAME:$IMAGE_TAG
docker push $ACR_NAME.azurecr.io/$IMAGE_NAME:$IMAGE_TAG
echo -e "${GREEN}✓ Image pushed to ACR${NC}"

# Step 7: Get ACR credentials
echo -e "\n${YELLOW}Step 7: Getting ACR credentials...${NC}"
ACR_PASSWORD=$(az acr credential show --name $ACR_NAME --query "passwords[0].value" -o tsv)
echo -e "${GREEN}✓ ACR credentials retrieved${NC}"

# Step 8: Deploy to Azure Container Instances
echo -e "\n${YELLOW}Step 8: Deploying to Azure Container Instances...${NC}"
echo -e "${YELLOW}Loading environment variables from .env.production...${NC}"
if [[ -f .env.production ]]; then
        set -a
        source .env.production
        set +a
        echo -e "${GREEN}✓ Loaded .env.production${NC}"
else
        echo -e "${RED}Missing .env.production in be-rental-room. Aborting.${NC}"
        exit 1
fi

# Generate processed deployment file by substituting ${VAR} with values
PROCESSED_YML="azure-deploy.processed.yml"
cp azure-deploy.yml "$PROCESSED_YML"

VARS=(
    NODE_ENV PORT CORS_ORIGIN DATABASE_URL REDIS_HOST REDIS_PORT REDIS_PASSWORD REDIS_TTL 
    JWT_SECRET JWT_EXPIRES_IN JWT_REFRESH_SECRET JWT_REFRESH_EXPIRES_IN 
    MAIL_HOST MAIL_PORT MAIL_USER MAIL_PASSWORD MAIL_FROM MAIL_FROM_NAME 
    GEMINI_API_KEY IMAGEKIT_PUBLIC_KEY IMAGEKIT_PRIVATE_KEY IMAGEKIT_URL_ENDPOINT 
    ENCRYPTION_KEY SEPAY_API_URL SEPAY_API_TOKEN P12_PASSWORD
)

echo -e "${YELLOW}Injecting variables into azure-deploy.yml...${NC}"

# Use Python script for safe variable replacement
chmod +x inject-env.py
python3 inject-env.py azure-deploy.yml "$PROCESSED_YML"

# Update ACR password
python3 -c "
import sys
with open('$PROCESSED_YML', 'r') as f:
    content = f.read()
content = content.replace('<get-from-azure-portal>', '$ACR_PASSWORD')
with open('$PROCESSED_YML', 'w') as f:
    f.write(content)
"

az container create --resource-group $RESOURCE_GROUP \
    --file "$PROCESSED_YML"

echo -e "${GREEN}✓ Container deployed${NC}"

# Step 9: Get container IP
echo -e "\n${YELLOW}Step 9: Getting container IP...${NC}"
CONTAINER_IP=$(az container show --resource-group $RESOURCE_GROUP \
    --name $CONTAINER_NAME \
    --query ipAddress.ip -o tsv)

echo -e "\n${GREEN}================================================${NC}"
echo -e "${GREEN}✓ Deployment Complete!${NC}"
echo -e "${GREEN}================================================${NC}"
echo -e "Container IP: ${YELLOW}$CONTAINER_IP${NC}"
echo -e "API URL: ${YELLOW}http://$CONTAINER_IP:3000${NC}"
echo -e "Swagger Docs: ${YELLOW}http://$CONTAINER_IP:3000/api/docs${NC}"
echo -e "\n${YELLOW}Next steps:${NC}"
echo -e "1. Update Cloudflare DNS to point to $CONTAINER_IP"
echo -e "2. Test API: curl http://$CONTAINER_IP:3000/api/docs"
echo -e "3. Update Vercel environment variables with new API URL"
