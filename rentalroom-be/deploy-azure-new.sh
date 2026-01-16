#!/usr/bin/env bash
# Fresh Azure deploy script using .env.production and placeholder injection
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT_DIR"

RESOURCE_GROUP=${RESOURCE_GROUP:-"rental-room-rg"}
LOCATION=${LOCATION:-"southeastasia"}
ACR_NAME=${ACR_NAME:-"rentalroomacr"}
IMAGE_NAME=${IMAGE_NAME:-"rental-room-api"}
IMAGE_TAG=${IMAGE_TAG:-"latest"}
CONTAINER_NAME=${CONTAINER_NAME:-"rental-room-api"}
ENV_FILE=".env.production"
PROCESSED_YML="azure-deploy.processed.yml"

printf "\n=== Azure deploy (new) ===\n"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing $ENV_FILE" >&2
  exit 1
fi

az account show >/dev/null 2>&1 || az login

if ! az group show --name "$RESOURCE_GROUP" >/dev/null 2>&1; then
  az group create --name "$RESOURCE_GROUP" --location "$LOCATION" >/dev/null
fi

if ! az acr show --name "$ACR_NAME" --resource-group "$RESOURCE_GROUP" >/dev/null 2>&1; then
  az acr create --resource-group "$RESOURCE_GROUP" --name "$ACR_NAME" --sku Basic --admin-enabled true >/dev/null
fi

az acr login --name "$ACR_NAME" >/dev/null

if ! docker images | grep -q "${IMAGE_NAME}\s*${IMAGE_TAG}"; then
  docker build -t "$IMAGE_NAME:$IMAGE_TAG" .
fi

docker tag "$IMAGE_NAME:$IMAGE_TAG" "$ACR_NAME.azurecr.io/$IMAGE_NAME:$IMAGE_TAG"
docker push "$ACR_NAME.azurecr.io/$IMAGE_NAME:$IMAGE_TAG"

ACR_PASSWORD=$(az acr credential show --name "$ACR_NAME" --query "passwords[0].value" -o tsv)
export ACR_PASSWORD

set -a
source "$ENV_FILE"
set +a

python3 inject-env.py azure-deploy.yml "$PROCESSED_YML"

az container delete --name "$CONTAINER_NAME" --resource-group "$RESOURCE_GROUP" --yes >/dev/null 2>&1 || true

az container create \
  --resource-group "$RESOURCE_GROUP" \
  --file "$PROCESSED_YML"

CONTAINER_IP=$(az container show --resource-group "$RESOURCE_GROUP" --name "$CONTAINER_NAME" --query ipAddress.ip -o tsv)

printf "\nDeployed container IP: %s\n" "$CONTAINER_IP"
printf "API: http://%s:3000\n" "$CONTAINER_IP"
printf "Docs: http://%s:3000/api/docs\n" "$CONTAINER_IP"
