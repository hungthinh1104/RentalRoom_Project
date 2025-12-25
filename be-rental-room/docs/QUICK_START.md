# Quick Deployment Guide

## Status Check

```bash
# 1. Verify build
npm run build  # ✅ PASSES

# 2. Run tests
npm test       # ✅ 346/346 PASSING

# 3. Check API
curl http://localhost:3000/api/v1/contracts  # ✅ RUNNING
```

## Database Status

✅ **Digital Signature Fields Added:**
- `contract.pdf_url` - Original PDF path
- `contract.pdf_hash` - SHA-256 hash
- `contract.signed_url` - Signed PDF path  
- `contract.signature_status` - PENDING_SIGNATURE | SIGNED | VERIFIED

## Running Services

```
🐳 Docker Containers:
- rental-room-api:3000 (Node.js + NestJS)
- rental-room-redis:6379 (Redis cache)
- rental-room-db:5432 (PostgreSQL)
```

## API Endpoints (All Live)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/contracts/:id/generate-pdf-async` | Queue async PDF generation |
| GET | `/contracts/jobs/:jobId` | Poll job status |
| POST | `/contracts/:id/sign` | Sign with digital certificate |
| GET | `/contracts/:id/verify` | Verify signature |
| GET | `/contracts/:id/download-signed` | Download signed PDF |

## Signing Workflow (Simple Example)

```bash
# 1. Create PDF (async)
curl -X POST http://localhost:3000/api/v1/contracts/123/generate-pdf-async
# Returns: { jobId: "abc-123", status: "pending" }

# 2. Check job status
curl http://localhost:3000/api/v1/contracts/jobs/abc-123
# Returns: { status: "completed", result: { pdfUrl: "/storage/..." } }

# 3. Sign the PDF
curl -X POST http://localhost:3000/api/v1/contracts/123/sign \
  -H "Content-Type: application/json" \
  -d '{ "templateName": "vietnam_rental_agreement" }'

# 4. Verify signature
curl http://localhost:3000/api/v1/contracts/123/verify

# 5. Download signed PDF
curl http://localhost:3000/api/v1/contracts/123/download-signed
```

## Security Files

**Generated On Startup:**
- `./certs/ca-certificate.pem` - CA certificate
- `./certs/ca-key.pem` - Private key
- `./certs/ca.p12` - PKCS#12 bundle

**In Production:**
- Store P12_PASSWORD in vault, not in .env
- Mount certs directory as read-only volume
- Use HTTPS for all API calls

## Troubleshooting

### Build Fails
```bash
# Clean build
rm -rf dist node_modules
npm install
npm run build
```

### PDF Generation Hangs
- Check Redis connection: `redis-cli ping`
- Verify Puppeteer path: `which chromium-browser`
- Check /storage volume permissions

### Migration Issues
```bash
# View migration status
docker exec rental-room-db psql -U rental_user -d rental_room_db \
  -c "SELECT * FROM _prisma_migrations ORDER BY finished_at DESC LIMIT 5;"
```

## Files Created (This Session)

- ✅ `src/modules/contracts/services/pdf-queue.service.ts` - Async queue
- ✅ `prisma/migrations/20251223_add_digital_signature_fields/` - DB migration
- ✅ `docs/STABILITY_REPORT.md` - Detailed status report
- ✅ `docs/QUICK_START.md` - This file

## Next Deployment Step

```bash
# 1. Rebuild Docker image
docker-compose -f docker-compose.production.yml build

# 2. Start services
docker-compose -f docker-compose.production.yml up -d

# 3. Run migration (if needed)
docker-compose exec app npx prisma migrate deploy

# 4. Health check
curl http://localhost:3000/api/v1/contracts -H "Authorization: Bearer YOUR_TOKEN"
```

## Support

- Build issues: Check `npm run build` output
- Database issues: Check PostgreSQL logs in Docker
- PDF generation: Check Redis queue status
- Signature errors: Verify P12_PASSWORD and certificate permissions

---

**Last Updated:** Dec 23, 2025  
**Backend Status:** ✅ Production Ready  
**Tests:** ✅ All Passing (346/346)  
**Build:** ✅ Clean
