# 🚀 Quick Deploy - Production Ready

## Đã hoàn thành

✅ **Dockerfile.production** - Multi-stage build với Chromium  
✅ **docker-compose.production.yml** - App + Redis  
✅ **PdfQueueService** - Async PDF generation (non-blocking)  
✅ **API endpoints mới:**
   - `POST /contracts/:id/generate-pdf-async` (recommended cho production)
   - `GET /contracts/jobs/:jobId` (check status)
   - `POST /contracts/:id/generate-pdf` (sync, giữ lại cho compatibility)

## Deploy ngay

```bash
# 1. Copy env file
cp .env.production.example .env.production

# 2. Edit DATABASE_URL và P12_PASSWORD trong .env.production

# 3. Build & run
docker-compose -f docker-compose.production.yml up -d --build

# 4. Run migration (lần đầu)
docker-compose -f docker-compose.production.yml exec app npx prisma migrate deploy

# 5. Check logs
docker-compose -f docker-compose.production.yml logs -f app
```

## Test async endpoint

```bash
# Tạo PDF (non-blocking, trả về jobId ngay)
curl -X POST http://localhost:3000/contracts/CONTRACT_ID/generate-pdf-async \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "templateName": "rental-agreement" }'

# Response: { "jobId": "pdf-job:...", "status": "pending" }

# Check status
curl http://localhost:3000/contracts/jobs/pdf-job:CONTRACT_ID:1234567890 \
  -H "Authorization: Bearer TOKEN"

# Response: 
# { 
#   "status": "completed",
#   "result": { "contractId": "...", "pdfHash": "..." }
# }
```

## Tại sao async?

- **Sync** (`/generate-pdf`): Puppeteer block 2-5s → Client phải đợi  
- **Async** (`/generate-pdf-async`): Trả về jobId ngay (<50ms) → Client poll status

Production → Dùng async để tránh timeout.

## Volumes quan trọng

```yaml
volumes:
  - ./storage:/app/storage  # PDFs persisted
  - ./certs:/app/certs      # Certificates persisted
```

Không có volumes → **Mất hết PDFs khi restart!**

## Monitor

```bash
# Check Redis
docker exec -it rental-redis redis-cli KEYS "pdf-job:*"

# Check storage
ls -lh storage/contracts/

# App logs
docker logs -f rental-app
```

Xong! 🎉
