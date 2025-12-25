# Production Deployment Guide - Digital Signature Module

## 🚀 Quick Deploy với Docker + Redis

### 1. Dockerfile (Multi-stage với Chromium)

```dockerfile
# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx prisma generate
RUN npm run build

# Stage 2: Production
FROM node:20-alpine
WORKDIR /app

# Install Chromium dependencies for Puppeteer
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont

# Set Puppeteer to use system Chromium
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

# Copy built app
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/src/templates ./src/templates
COPY --from=builder /app/package*.json ./

# Create storage directories
RUN mkdir -p storage/contracts certs && \
    chown -R node:node storage certs

USER node
EXPOSE 3000
CMD ["node", "dist/main"]
```

### 2. docker-compose.yml

```yaml
version: '3.8'

services:
  redis:
    image: redis:7-alpine
    container_name: rental-redis
    restart: unless-stopped
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    command: redis-server --appendonly yes

  app:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: rental-app
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_HOST=redis
      - REDIS_PORT=6379
      - P12_PASSWORD=${P12_PASSWORD}
    volumes:
      - ./storage:/app/storage
      - ./certs:/app/certs
    depends_on:
      - redis

volumes:
  redis_data:
```

### 3. .env.production

```env
NODE_ENV=production
DATABASE_URL=postgresql://user:password@host:5432/rental_db
REDIS_HOST=redis
REDIS_PORT=6379
P12_PASSWORD=your-secure-password-here
```

### 4. Async PDF Generation với Redis Cache

**src/modules/contracts/services/pdf-queue.service.ts**
```typescript
import { Injectable, Logger } from '@nestjs/common';
import { CacheService } from 'src/common/services/cache.service';

@Injectable()
export class PdfQueueService {
  private readonly logger = new Logger(PdfQueueService.name);

  constructor(private readonly cache: CacheService) {}

  // Enqueue PDF generation job
  async enqueuePdfGeneration(contractId: string, data: any): Promise<string> {
    const jobId = `pdf-job:${contractId}:${Date.now()}`;
    await this.cache.set(jobId, JSON.stringify({ contractId, data, status: 'pending' }), 3600);
    this.logger.log(`PDF job enqueued: ${jobId}`);
    return jobId;
  }

  // Check job status
  async getJobStatus(jobId: string): Promise<any> {
    const job = await this.cache.get(jobId);
    return job ? JSON.parse(job) : null;
  }

  // Mark job as completed
  async completeJob(jobId: string, result: any): Promise<void> {
    const job = await this.cache.get(jobId);
    if (job) {
      const updated = { ...JSON.parse(job), status: 'completed', result };
      await this.cache.set(jobId, JSON.stringify(updated), 3600);
    }
  }
}
```

**Controller Update (async endpoint):**
```typescript
@Post(':id/generate-pdf-async')
@Auth(UserRole.ADMIN, UserRole.LANDLORD, UserRole.TENANT)
async generatePDFAsync(@Param('id') id: string, @Body('templateName') templateName?: string) {
  const jobId = await this.pdfQueueService.enqueuePdfGeneration(id, { templateName });
  
  // Process in background (non-blocking)
  setImmediate(async () => {
    try {
      const result = await this.contractSigningService.generateContractPDF(id, templateName);
      await this.pdfQueueService.completeJob(jobId, result);
    } catch (error) {
      this.logger.error(`PDF generation failed: ${error.message}`);
    }
  });

  return { jobId, status: 'processing', message: 'PDF generation started' };
}

@Get('jobs/:jobId')
@Auth(UserRole.ADMIN, UserRole.LANDLORD, UserRole.TENANT)
async checkJobStatus(@Param('jobId') jobId: string) {
  const job = await this.pdfQueueService.getJobStatus(jobId);
  if (!job) throw new NotFoundException('Job not found');
  return job;
}
```

### 5. Deploy Commands

```bash
# Build và run
docker-compose up -d --build

# Check logs
docker-compose logs -f app

# Stop
docker-compose down

# Clean rebuild
docker-compose down -v
docker-compose up -d --build
```

### 6. Tại sao cần Chromium trong Docker?

Puppeteer cần browser để render PDF. Trong Docker Linux, phải cài:
- `chromium` - Browser engine
- `nss` - Network Security Services
- `freetype`, `harfbuzz` - Font rendering
- `ttf-freefont` - Default fonts

Nếu không có → `Error: Could not find Chrome (ENOENT)`

### 7. Volume Mapping (Quan trọng!)

```yaml
volumes:
  - ./storage:/app/storage  # PDFs persist khi restart
  - ./certs:/app/certs      # Certificates persist
```

Không map volume → **mất hết PDF khi restart container**

### 8. Production Checklist

- [ ] Set `P12_PASSWORD` trong .env
- [ ] Configure DATABASE_URL
- [ ] Map volumes cho storage + certs
- [ ] Run migration: `docker-compose exec app npx prisma migrate deploy`
- [ ] Test PDF generation
- [ ] Setup backup cho `/storage` và `/certs`
- [ ] Add HTTPS reverse proxy (nginx)
- [ ] Monitor Puppeteer memory usage

---

**Deploy time:** ~5 phút  
**Image size:** ~450MB (Alpine + Chromium)  
**Memory usage:** ~200MB base + ~100MB per Puppeteer instance
