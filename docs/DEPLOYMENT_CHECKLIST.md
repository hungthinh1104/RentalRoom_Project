# Deployment Checklist

## Pre-Deployment

### Google Cloud Setup
- [ ] Create Google Cloud project
- [ ] Run `./setup-gcloud.sh`
- [ ] Save database password securely
- [ ] Download service account key
- [ ] Enable pgvector extension
- [ ] Configure bucket CORS

### Azure Setup
- [ ] Create Azure account
- [ ] Create resource group
- [ ] Create App Service Plan (B1)
- [ ] Create Web App (Node 20)
- [ ] Upload GCP service account key
- [ ] Configure environment variables
- [ ] Get publish profile for GitHub Actions

### Vercel Setup
- [ ] Create Vercel account
- [ ] Connect GitHub repository
- [ ] Configure environment variables
- [ ] Set custom domain (optional)

## Environment Variables

### Azure App Service Settings
```bash
DATABASE_URL=postgresql://...
JWT_SECRET=xxx
ENCRYPTION_KEY=xxx
SEPAY_API_TOKEN=xxx
FRONTEND_URL=https://your-app.vercel.app
GCS_BUCKET_NAME=rental-room-uploads
GCS_PROJECT_ID=your-project-id
GOOGLE_APPLICATION_CREDENTIALS=/home/site/gcp-key.json
NODE_ENV=production
PORT=8080
```

### Vercel Environment Variables
```bash
NEXT_PUBLIC_API_URL=https://rental-room-api.azurewebsites.net/api/v1
NEXTAUTH_URL=https://your-app.vercel.app
NEXTAUTH_SECRET=xxx
```

### GitHub Secrets
- [ ] AZURE_WEBAPP_NAME
- [ ] AZURE_WEBAPP_PUBLISH_PROFILE
- [ ] DATABASE_URL

## Deployment Steps

### 1. Database Migration
```bash
cd rentalroom-be
DATABASE_URL="postgresql://..." npx prisma migrate deploy
```

### 2. Backend Deployment
```bash
# Option A: GitHub Actions (recommended)
git push origin main

# Option B: Manual
./deploy-azure.sh
```

### 3. Frontend Deployment
```bash
cd rentalroom-fe
vercel --prod
```

## Post-Deployment

### Testing
- [ ] Health check: https://rental-room-api.azurewebsites.net/health
- [ ] API docs: https://rental-room-api.azurewebsites.net/api/docs
- [ ] Frontend: https://your-app.vercel.app
- [ ] Database connection working
- [ ] File uploads working
- [ ] Payment QR generation working
- [ ] Email sending working

### Monitoring
- [ ] Set up Application Insights
- [ ] Configure Sentry (optional)
- [ ] Set up uptime monitoring
- [ ] Configure alerts

### Security
- [ ] Verify HTTPS working
- [ ] Check CORS configuration
- [ ] Review firewall rules
- [ ] Enable Cloud SQL backups
- [ ] Test rate limiting

### Performance
- [ ] Enable CDN (optional)
- [ ] Configure caching
- [ ] Optimize database queries
- [ ] Monitor response times

## Rollback Plan

If deployment fails:
1. Revert to previous GitHub commit
2. Restore database from backup
3. Check Azure logs: `az webapp log tail`
4. Check Vercel logs in dashboard

## Cost Monitoring

Monthly costs to track:
- Google Cloud SQL: ~$7
- Cloud Storage: ~$0.50
- Azure App Service: ~$13
- Vercel: $0-20
- Total: $20-40

## Support Contacts

- Azure Support: https://portal.azure.com
- Google Cloud Support: https://console.cloud.google.com
- Vercel Support: https://vercel.com/support
