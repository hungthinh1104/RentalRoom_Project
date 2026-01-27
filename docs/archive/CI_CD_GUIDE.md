# CI/CD Deployment Guide

## 🚀 Overview

This project has automated CI/CD pipelines for both **development** and **production** environments.

---

## 📋 Workflows

### 1. Development CI (`dev-ci.yml`)

**Triggers**:
- Push to `develop` branch
- Push to `feature/**` branches
- Pull requests to `develop` or `main`

**Jobs**:
1. **Frontend Build & Test**
   - Lint code
   - Run security tests
   - Build application
   - Upload artifacts

2. **Backend Build & Test**
   - Setup PostgreSQL & Redis
   - Lint code
   - Run tests with coverage
   - Build application
   - Upload artifacts

3. **Security Scan**
   - Run Trivy vulnerability scanner
   - Upload results to GitHub Security

4. **Notify**
   - Report build status

---

### 2. Production Deployment (`production-deploy.yml`)

**Triggers**:
- Push to `main` branch
- Manual trigger via GitHub Actions UI

**Jobs**:
1. **Frontend Production Build**
   - Lint & test
   - Build for production
   - Upload artifacts

2. **Backend Production Build**
   - Lint & test with coverage
   - Build for production
   - Upload artifacts

3. **Deploy Frontend** (Vercel)
   - Download build artifacts
   - Deploy to Vercel
   - Comment deployment URL

4. **Deploy Backend** (Azure)
   - Download build artifacts
   - Deploy to Azure Web App
   - Run database migrations
   - Comment deployment URL

5. **Health Check**
   - Verify frontend health
   - Verify backend health
   - Notify success

6. **Rollback** (on failure)
   - Automatic rollback if health check fails

---

## 🔧 Setup Instructions

### Prerequisites

1. **GitHub Repository Secrets**

   Go to `Settings` → `Secrets and variables` → `Actions` and add:

   **For Vercel (Frontend)**:
   ```
   VERCEL_TOKEN=your_vercel_token
   VERCEL_ORG_ID=your_org_id
   VERCEL_PROJECT_ID=your_project_id
   ```

   **For Azure (Backend)**:
   ```
   AZURE_CREDENTIALS={"clientId":"...","clientSecret":"...","subscriptionId":"...","tenantId":"..."}
   AZURE_WEBAPP_NAME=your-webapp-name
   ```

   **Environment Variables**:
   ```
   PRODUCTION_API_URL=https://your-backend.azurewebsites.net
   ```

2. **Vercel Setup**

   ```bash
   # Install Vercel CLI
   npm i -g vercel
   
   # Login to Vercel
   vercel login
   
   # Link project
   cd rentalroom-fe
   vercel link
   
   # Get project details
   vercel project ls
   ```

3. **Azure Setup**

   ```bash
   # Install Azure CLI
   curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash
   
   # Login to Azure
   az login
   
   # Create service principal
   az ad sp create-for-rbac \
     --name "github-actions" \
     --role contributor \
     --scopes /subscriptions/{subscription-id}/resourceGroups/{resource-group} \
     --sdk-auth
   
   # Copy the JSON output to AZURE_CREDENTIALS secret
   ```

---

## 🏃 Running Locally

### Development Mode

```bash
# Frontend
cd rentalroom-fe
npm install
npm run dev

# Backend
cd rentalroom-be
npm install
npm run start:dev
```

### Production Build (Local Test)

```bash
# Frontend
cd rentalroom-fe
npm run build
npm start

# Backend
cd rentalroom-be
npm run build
npm run start:prod
```

---

## 📊 Workflow Status

### Development CI

```bash
# Check workflow status
gh workflow view "Development CI/CD"

# Run manually
gh workflow run dev-ci.yml
```

### Production Deployment

```bash
# Check deployment status
gh workflow view "Production Deployment"

# Deploy manually
gh workflow run production-deploy.yml

# Deploy to staging
gh workflow run production-deploy.yml -f environment=staging
```

---

## 🔍 Monitoring

### GitHub Actions

1. Go to `Actions` tab in GitHub
2. Select workflow run
3. View logs for each job

### Deployment URLs

- **Frontend**: https://your-app.vercel.app
- **Backend**: https://your-backend.azurewebsites.net

### Health Endpoints

```bash
# Frontend health
curl https://your-app.vercel.app/api/health

# Backend health
curl https://your-backend.azurewebsites.net/health
```

---

## 🚨 Troubleshooting

### Build Failures

1. **Check logs** in GitHub Actions
2. **Run locally** to reproduce
3. **Fix issues** and push again

### Deployment Failures

1. **Check secrets** are configured correctly
2. **Verify** Vercel/Azure credentials
3. **Check** deployment logs

### Health Check Failures

1. **Manual check** deployment URLs
2. **Review** application logs
3. **Rollback** if necessary

---

## 🔄 Rollback Procedure

### Automatic Rollback

- Triggered automatically if health check fails
- Reverts to previous successful deployment

### Manual Rollback

**Vercel**:
```bash
vercel rollback
```

**Azure**:
```bash
az webapp deployment slot swap \
  --resource-group your-rg \
  --name your-webapp \
  --slot staging \
  --target-slot production
```

---

## 📈 Best Practices

### Branch Strategy

```
main (production)
  ↑
develop (staging)
  ↑
feature/* (development)
```

### Deployment Flow

1. **Feature** → Push to `feature/*` → Dev CI runs
2. **Develop** → Merge to `develop` → Dev CI runs
3. **Production** → Merge to `main` → Production deploy runs

### Testing Before Deploy

```bash
# Run all tests locally
npm test

# Run security tests
npm test -- --testPathPattern="security"

# Build for production
npm run build
```

---

## 🎯 Next Steps

1. ✅ Configure GitHub secrets
2. ✅ Setup Vercel project
3. ✅ Setup Azure Web App
4. ✅ Test development CI
5. ✅ Test production deployment
6. ✅ Monitor first deployment
7. ✅ Setup alerts (optional)

---

## 📞 Support

- **GitHub Actions**: https://docs.github.com/actions
- **Vercel**: https://vercel.com/docs
- **Azure**: https://docs.microsoft.com/azure

---

**Last Updated**: 2026-01-25  
**Status**: ✅ Ready for use
