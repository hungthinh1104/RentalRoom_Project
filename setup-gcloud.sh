#!/bin/bash

# Setup Google Cloud SQL and Storage
# Run this script to create database and storage bucket

set -e

echo "🚀 Setting up Google Cloud resources..."

# Configuration
PROJECT_ID="your-project-id"
REGION="asia-southeast1"
DB_INSTANCE="rental-room-db"
DB_NAME="rental_room"
BUCKET_NAME="rental-room-uploads"

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo "❌ Google Cloud SDK not found. Please install: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Set project
echo "Setting project to $PROJECT_ID..."
gcloud config set project $PROJECT_ID

# Create Cloud SQL instance
echo "📊 Creating Cloud SQL instance..."
gcloud sql instances create $DB_INSTANCE \
  --database-version=POSTGRES_15 \
  --tier=db-f1-micro \
  --region=$REGION \
  --storage-size=10GB \
  --storage-auto-increase \
  --backup-start-time=03:00 \
  --enable-bin-log \
  --database-flags=cloudsql.iam_authentication=on \
  || echo "Instance already exists"

# Set root password
echo "Setting database password..."
read -sp "Enter PostgreSQL password: " DB_PASSWORD
echo
gcloud sql users set-password postgres \
  --instance=$DB_INSTANCE \
  --password=$DB_PASSWORD

# Create database
echo "Creating database..."
gcloud sql databases create $DB_NAME \
  --instance=$DB_INSTANCE \
  || echo "Database already exists"

# Get connection name
echo "Getting connection details..."
CONNECTION_NAME=$(gcloud sql instances describe $DB_INSTANCE --format="value(connectionName)")
echo "Connection name: $CONNECTION_NAME"

# Create storage bucket
echo "📦 Creating Cloud Storage bucket..."
gsutil mb -l $REGION gs://$BUCKET_NAME || echo "Bucket already exists"

# Set CORS
echo "Setting CORS policy..."
cat > /tmp/cors.json << EOF
[
  {
    "origin": ["https://your-app.vercel.app", "http://localhost:3000"],
    "method": ["GET", "POST", "PUT", "DELETE"],
    "responseHeader": ["Content-Type"],
    "maxAgeSeconds": 3600
  }
]
EOF
gsutil cors set /tmp/cors.json gs://$BUCKET_NAME

# Create service account
echo "👤 Creating service account..."
SA_NAME="rental-room-backend"
SA_EMAIL="$SA_NAME@$PROJECT_ID.iam.gserviceaccount.com"

gcloud iam service-accounts create $SA_NAME \
  --display-name="Rental Room Backend" \
  || echo "Service account already exists"

# Grant permissions
echo "Setting permissions..."
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$SA_EMAIL" \
  --role="roles/cloudsql.client"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$SA_EMAIL" \
  --role="roles/storage.objectAdmin"

# Create key
echo "Creating service account key..."
gcloud iam service-accounts keys create gcp-service-account.json \
  --iam-account=$SA_EMAIL

echo "✅ Google Cloud setup complete!"
echo ""
echo "📝 Next steps:"
echo "1. Upload gcp-service-account.json to Azure App Service"
echo "2. Set DATABASE_URL in Azure:"
echo "   postgresql://postgres:$DB_PASSWORD@/$DB_NAME?host=/cloudsql/$CONNECTION_NAME"
echo "3. Set GCS_BUCKET_NAME=$BUCKET_NAME"
echo "4. Set GCS_PROJECT_ID=$PROJECT_ID"
