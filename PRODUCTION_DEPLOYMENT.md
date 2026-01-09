# 🚀 Production Deployment Guide - Vercel + Upstash Redis

## 📋 Overview

**Stack:**
- **Frontend:** Vercel (Next.js)
- **Backend:** Azure Container Instances → Use Azure App Service or Railway
- **Database:** Supabase PostgreSQL
- **Cache:** Upstash (Serverless Redis)

**Your URLs:**
- Frontend: `https://diphungthinh.io.vn` (or Vercel preview)
- Redis: `https://leading-pika-36906.upstash.io`

---

## 🔧 Part 1: Backend Configuration (Azure/Railway)

### Environment Variables for Backend

```env
# Redis (Upstash)
REDIS_HOST=leading-pika-36906.upstash.io
REDIS_PORT=6379
REDIS_PASSWORD=AZAqAAIncDE5NWU1MmQyYzBmMTg0ZjYzODZiNzM3Y2RmZGYyYjk3MXAxMzY5MDY
REDIS_TLS=true
REDIS_TTL=3600

# CORS
CORS_ORIGIN=https://diphungthinh.io.vn,https://rental-room-project-git-main-diphungthinh-8454s-projects.vercel.app

# Database (Supabase)
DATABASE_URL=postgresql://postgres:password@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres

# JWT
JWT_SECRET=your-super-secret-key-change-in-production
JWT_EXPIRES_IN=7d

# App
NODE_ENV=production
PORT=3000
```

### ✅ Cache Config Already Updated

File: `be-rental-room/src/config/cache.config.ts` - Already has TLS support for Upstash!

```typescript
export const getCacheConfig = (
  configService: ConfigService,
): CacheModuleOptions => {
  const redisTls = configService.get<boolean>('REDIS_TLS', false);

  return {
    store: redisStore,
    host: configService.get<string>('REDIS_HOST', 'localhost'),
    port: configService.get<number>('REDIS_PORT', 6379),
    password: configService.get<string>('REDIS_PASSWORD'),
    ttl: configService.get<number>('REDIS_TTL', 3600),
    tls: redisTls ? { rejectUnauthorized: false } : undefined,
  };
};
```

---

## 🌐 Part 2: Frontend Configuration (Vercel)

### Environment Variables on Vercel Dashboard

Go to: **Vercel Dashboard → Your Project → Settings → Environment Variables**

Add these variables:

| Variable | Value | Environment |
|----------|-------|-------------|
| `NEXT_PUBLIC_API_URL` | `https://your-backend-domain.com/api/v1` | Production, Preview, Development |
| `NEXT_PUBLIC_SITE_URL` | `https://diphungthinh.io.vn` | Production |
| `NEXTAUTH_URL` | `https://diphungthinh.io.vn` | Production |
| `NEXTAUTH_SECRET` | `<generate-random-string>` | All |

**⚠️ IMPORTANT:**
- Replace `https://your-backend-domain.com/api/v1` with your actual backend URL
- Generate NEXTAUTH_SECRET: `openssl rand -base64 32`

### API Client Already Configured ✅

File: `fe-rental-room/src/lib/api/client.ts` - Already handles env vars correctly!

```typescript
const baseURL = typeof window === 'undefined'
  ? process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3005'
  : process.env.NEXT_PUBLIC_API_URL ?? process.env.API_URL ?? 'http://localhost:3005';
```

---

## 🔐 Part 3: Upstash Redis Setup

### Your Credentials

```
URL: https://leading-pika-36906.upstash.io
REST Token: <available-in-upstash-dashboard-do-not-commit>
```

### Redis Protocol (Recommended - Already Configured)

✅ **No code changes needed!** Your backend already uses:
- `cache-manager-redis-store` (installed)
- TLS support enabled in `cache.config.ts`

Just add these environment variables:
```env
REDIS_HOST=leading-pika-36906.upstash.io
REDIS_PORT=6379
REDIS_PASSWORD=<get-from-upstash-dashboard>
REDIS_TLS=true
```

---

## 📦 Part 4: Deployment Steps

### Option 1: Azure Container Instances (Current)

#### Step 1: Build & Push Docker Image

```bash
cd /home/diphungthinh/Desktop/rental-room/be-rental-room

# Login to Azure Container Registry
az acr login --name rentalroomacr

# Build and push image
docker build -t rentalroomacr.azurecr.io/rental-room-api:latest .
docker push rentalroomacr.azurecr.io/rental-room-api:latest

# Or use ACR build
az acr build --registry rentalroomacr --image rental-room-api:latest .
```

#### Step 2: Update Container Environment Variables

```bash
# Get container details
az container show --resource-group rental-room-rg --name rental-room-api

# Update container with new environment variables
az container create \
  --resource-group rental-room-rg \
  --name rental-room-api \
  --image rentalroomacr.azurecr.io/rental-room-api:latest \
  --cpu 1 --memory 1 \
  --ports 3000 \
  --registry-login-server rentalroomacr.azurecr.io \
  --registry-username <username> \
  --registry-password <password> \
  --environment-variables \
    REDIS_HOST=leading-pika-36906.upstash.io \
    REDIS_PORT=6379 \
    REDIS_PASSWORD=<get-from-upstash-dashboard> \
    REDIS_TLS=true \
    NODE_ENV=production \
    PORT=3000 \
    DATABASE_URL=postgresql://... \
    CORS_ORIGIN=https://diphungthinh.io.vn,https://rental-room-project-git-main-diphungthinh-8454s-projects.vercel.app
```

#### Step 3: Verify Deployment

```bash
# Check container logs
az container logs --resource-group rental-room-rg --name rental-room-api

# Look for:
# ✅ "CORS origins: ..."
# ✅ "Redis connected successfully"
# ✅ "Listening on port 3000"
```

---

### Option 2: Railway.app (Alternative - Recommended for Simplicity)

#### Step 1: Push to GitHub (if not already)

```bash
git add .
git commit -m "Add Upstash Redis and production configs"
git push origin main
```

#### Step 2: Connect Railway to GitHub

1. Go to: `https://railway.app`
2. New Project → Deploy from GitHub
3. Select this repository
4. Connect

#### Step 3: Add Environment Variables

Railway Dashboard → Variables tab:

```env
REDIS_HOST=leading-pika-36906.upstash.io
REDIS_PORT=6379
REDIS_PASSWORD=AZAqAAIncDE5NWU1MmQyYzBmMTg0ZjYzODZiNzM3Y2RmZGYyYjk3MXAxMzY5MDY
REDIS_TLS=true
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://...
CORS_ORIGIN=https://diphungthinh.io.vn,https://rental-room-project-git-main-diphungthinh-8454s-projects.vercel.app
```

✅ **Railway auto-deploys on git push**

---

### Part 3: Deploy Frontend to Vercel

#### Step 1: Via Vercel Dashboard

1. Go to: **Vercel Dashboard → Your Project**
2. **Settings → Environment Variables**
3. Add variables (see Part 2)
4. **Deployments → Redeploy** latest commit

#### Step 2: Via Vercel CLI

```bash
cd fe-rental-room

# Add environment variables
vercel env add NEXT_PUBLIC_API_URL
# Paste: https://your-backend-domain.com/api/v1

vercel env add NEXTAUTH_URL
# Paste: https://diphungthinh.io.vn

vercel env add NEXTAUTH_SECRET
# Paste: $(openssl rand -base64 32)

# Deploy
vercel --prod
```

---

## 🧪 Part 5: Testing

### Test 1: Backend Health Check

```bash
# Get your backend URL (from Azure Container Instances or Railway)
curl https://your-backend-domain.com/api/v1/health

# Should return: 200 OK
```

### Test 2: Redis Connection

```bash
# SSH into container (Azure)
az container exec --resource-group rental-room-rg --name rental-room-api --exec-command /bin/bash

# Or SSH into Railway
railway run bash

# Test Redis connection
redis-cli -h leading-pika-36906.upstash.io -p 6379 \
  -a <your-redis-password> \
  --tls ping

# Expected output: PONG
```

### Test 3: Backend Logs for Redis Connection

```bash
# Azure Container Instances
az container logs --resource-group rental-room-rg --name rental-room-api | grep -i redis

# Railway
railway logs | grep -i redis

# Look for: ✅ "Redis connected successfully"
# Or error: ❌ "Redis connection failed"
```

### Test 4: Frontend API Calls

1. Open: `https://rental-room-project-git-main-diphungthinh-8454s-projects.vercel.app`
2. Press **F12** → Console
3. Try any API call (login, search, etc.)
4. Check **Network tab**:
   - Request URL should be: `https://your-backend-domain.com/api/v1/...`
   - Status: `200 OK` (no CORS errors)

### Test 5: Cache Working

```bash
# Call AI search twice

# First call (Cache MISS)
curl https://your-backend-domain.com/api/v1/ai/search \
  -H "Content-Type: application/json" \
  -d '{"query": "phòng giá rẻ"}'

# Second call (Cache HIT - should be faster)
curl https://your-backend-domain.com/api/v1/ai/search \
  -H "Content-Type: application/json" \
  -d '{"query": "phòng giá rẻ"}'

# Check backend logs:
# Cache MISS: phòng giá rẻ - Calling AI API
# Cache HIT: phòng giá rẻ
```

---

## 🚨 Common Issues & Fixes

### Issue 1: "ECONNREFUSED" Redis Error

**Cause:** Wrong Redis host/port or TLS not enabled

**Fix:**
```env
REDIS_HOST=leading-pika-36906.upstash.io  # ✅ Correct
REDIS_PORT=6379                            # ✅ Not 443 or 8079
REDIS_TLS=true                             # ✅ MUST be true for Upstash
```

### Issue 2: CORS Error on Frontend

**Cause:** CORS_ORIGIN missing Vercel URL

**Fix:**
```env
CORS_ORIGIN=https://diphungthinh.io.vn,https://rental-room-project-git-main-diphungthinh-8454s-projects.vercel.app
```

⚠️ **Requirements:**
- No trailing `/`
- No spaces after comma
- Both URLs must match exactly

### Issue 3: Frontend Calls Wrong API URL

**Cause:** NEXT_PUBLIC_API_URL not set on Vercel

**Fix:**
1. Vercel Dashboard → Settings → Environment Variables
2. Add: `NEXT_PUBLIC_API_URL = https://your-backend-domain.com/api/v1`
3. Click **Redeploy** under Deployments

### Issue 4: "Unauthorized" on API Calls

**Cause:** CORS not allowing credentials

**Verify Backend (Already Correct ✅):**
```typescript
// src/main.ts - Should have:
enableCors({
  origin: process.env.CORS_ORIGIN?.split(','),
  credentials: true,
})
```

**Verify Frontend (Already Correct ✅):**
```typescript
// src/lib/api/client.ts - Should have:
axios.create({
  withCredentials: true,
})
```

**Verify Environment Variable:**
```env
# Must NOT be *
CORS_ORIGIN=https://diphungthinh.io.vn,https://rental-room-project-git-main-diphungthinh-8454s-projects.vercel.app
```

---

## 📊 Deployment Checklist

### Backend
- [ ] Update `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`, `REDIS_TLS` env vars
- [ ] Update `DATABASE_URL` to Supabase pooler: `postgresql://...@aws-1-ap-southeast-1.pooler.supabase.com:5432/...`
- [ ] Update `CORS_ORIGIN` with both frontend URLs
- [ ] Update `JWT_SECRET` to a strong random string
- [ ] Build Docker image: `docker build -t rental-room-api:latest .`
- [ ] Push to container registry (ACR or Docker Hub)
- [ ] Deploy to Azure Container Instances or Railway
- [ ] Check logs for "Redis connected successfully"
- [ ] Test API: `curl https://your-backend.com/api/v1/health`

### Frontend
- [ ] Add `NEXT_PUBLIC_API_URL` on Vercel (point to backend)
- [ ] Add `NEXT_PUBLIC_SITE_URL` on Vercel (your domain)
- [ ] Add `NEXTAUTH_URL` on Vercel (your domain)
- [ ] Add `NEXTAUTH_SECRET` on Vercel (generated with `openssl rand -base64 32`)
- [ ] Deploy to Vercel (or connect GitHub repo)
- [ ] Test site loads without CORS errors
- [ ] Test login works

### Redis
- [ ] Verify Upstash credentials in backend env vars
- [ ] Test connection: `redis-cli ... ping` → should return `PONG`
- [ ] Check Upstash dashboard → Commands tab for activity

---

## 🎉 Success Indicators

### Backend
✅ Logs show: `"CORS origins: https://diphungthinh.io.vn, ..."`  
✅ Logs show: `"Redis connected successfully"`  
✅ Health check: `curl https://your-backend.com/api/v1/health` → `200 OK`  
✅ API responds to requests

### Frontend
✅ Site loads: `https://diphungthinh.io.vn`  
✅ DevTools Console: No CORS errors  
✅ Network tab: API calls to correct backend URL  
✅ Login works correctly

### Redis
✅ Upstash dashboard shows activity (SET/GET commands)  
✅ Backend logs: `"Cache HIT"` for repeated searches  
✅ `redis-cli ping` returns `PONG`

---

## 🎯 Next Steps

1. **Decide on Backend Hosting:**
   - Use existing Azure Container Instances (update env vars)
   - OR switch to Railway.app (simpler, auto-deploy)

2. **Set Environment Variables:**
   - Backend: Add Redis + Database + CORS settings
   - Frontend: Add API URL + Auth settings

3. **Deploy:**
   - Backend: Push new Docker image or connect GitHub to Railway
   - Frontend: Add Vercel env vars and redeploy

4. **Test:**
   - Health check API
   - Test login flow
   - Check Redis cache working (search twice)

5. **Monitor:**
   - Check container logs for errors
   - Monitor Upstash dashboard for Redis usage
   - Monitor API response times (should be faster with cache)

---

## 📞 Support

For issues:
- **Azure Container Instances:** `az container logs --resource-group rental-room-rg --name rental-room-api`
- **Railway:** `railway logs`
- **Upstash:** Check Commands tab in dashboard
- **Vercel:** Check Deployments tab for build logs

Ready to deploy! 🚀
