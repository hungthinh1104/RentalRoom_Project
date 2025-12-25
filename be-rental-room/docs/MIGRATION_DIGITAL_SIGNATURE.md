# Next Steps: Database Migration

## Required: Run Prisma Migration

The digital signature fields have been added to the Contract model in `prisma/schema.prisma`, but the database hasn't been updated yet.

### Step 1: Run the migration

```bash
cd /home/diphungthinh/Desktop/rental-room/be-rental-room
npx prisma migrate dev --name add_digital_signature_fields
```

### Step 2: Verify the migration

The command will:
1. Create a new migration file in `prisma/migrations/`
2. Apply the migration to your database
3. Regenerate the Prisma Client

### Expected Output

```
Environment variables loaded from .env
Prisma schema loaded from prisma/schema.prisma
✔ Your database has been successfully migrated to `20251222...` (migration name based on timestamp)
```

## Database Changes

The migration will add these columns to the `contract` table:

| Column Name | Type | Null | Default |
|------------|------|------|---------|
| pdf_url | TEXT | YES | null |
| pdf_hash | VARCHAR(64) | YES | null |
| signed_url | TEXT | YES | null |
| signature_status | VARCHAR(50) | YES | null |

## Rollback (if needed)

If you need to rollback the migration:

```bash
npx prisma migrate resolve --rolled-back add_digital_signature_fields
```

## Testing the Implementation

After migration, test the complete flow:

```bash
# 1. Build the project
npm run build

# 2. Run tests to verify nothing broke
npm test

# 3. Start the server
npm run start:dev

# 4. Create a test contract via API
curl -X POST http://localhost:3000/contracts \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "applicationId": "test-app-id",
    "roomId": "test-room-id",
    "tenantId": "test-tenant-id",
    "landlordId": "test-landlord-id",
    "contractNumber": "CT-001",
    "startDate": "2025-01-01",
    "endDate": "2025-12-31",
    "monthlyRent": 5000000,
    "depositAmount": 10000000
  }'

# 5. Try the signing endpoints
curl -X POST http://localhost:3000/contracts/{CONTRACT_ID}/generate-pdf \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "templateName": "rental-agreement" }'

curl -X POST http://localhost:3000/contracts/{CONTRACT_ID}/sign \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "reason": "Contract agreement" }'

curl -X GET http://localhost:3000/contracts/{CONTRACT_ID}/verify \
  -H "Authorization: Bearer TOKEN"

curl -X GET http://localhost:3000/contracts/{CONTRACT_ID}/download-signed \
  -H "Authorization: Bearer TOKEN" \
  -o contract_signed.pdf
```

## Environment Setup

Before testing, ensure these variables are set:

```bash
# .env file
P12_PASSWORD="your-secure-password-here"
DATABASE_URL="postgresql://user:password@localhost:5432/rental_db"
```

## Production Checklist

- [ ] Run migration on development database
- [ ] Test signing workflow with real data
- [ ] Verify audit logs are being created
- [ ] Test PDF download and verify signature
- [ ] Update .env.example with P12_PASSWORD
- [ ] Document signing workflow in API docs/Swagger
- [ ] Integrate signing endpoints into frontend UI
- [ ] Plan CA integration (VNPT/Viettel/MISA)
- [ ] Set up database backups for signed contracts
- [ ] Configure S3/Azure Blob for production PDF storage
- [ ] Implement certificate rotation policy
- [ ] Add monitoring/alerting for signing failures

## Troubleshooting

### Migration Already Exists Error

If you get "Migration already exists", check if the migration was already applied:

```bash
npx prisma migrate status
```

If the migration shows as "pending", apply it:

```bash
npx prisma db push
```

### Prisma Client Out of Sync

If you get "The Prisma Client has become out of sync", regenerate it:

```bash
npx prisma generate
npm run build
```

### Database Connection Error

Make sure PostgreSQL is running and `.env` has correct `DATABASE_URL`:

```bash
# Test connection
psql $DATABASE_URL -c "SELECT 1;"
```

## Need Help?

See [DIGITAL_SIGNATURE_GUIDE.md](./DIGITAL_SIGNATURE_GUIDE.md) for:
- Complete API documentation
- Architecture details
- Legal compliance information
- Future enhancements roadmap
