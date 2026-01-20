# QUICK START: Integration & Deployment

## Critical Path (Next 24 Hours)

### Step 1: Update Prisma Schema
**File**: `rentalroom-be/prisma/schema.prisma`

Add to User model:
```prisma
ekycVerified Boolean? @default(false)
ekycVerifiedAt DateTime?
ekycProvider String?
ekycVerificationId String?
ekycRiskLevel String?
```

Add to Contract model:
```prisma
version Int @default(1)
updatedAt DateTime @updatedAt
contractHash String?
```

Add to Room model:
```prisma
version Int @default(1)
updatedAt DateTime @updatedAt
```

Add new models:
```prisma
model PaymentTransaction {
  id Int @id @default(autoincrement())
  transactionId String @unique
  status String
  amount BigInt
  paymentMethod String?
  referenceCode String @unique
  responseData Json?
  errorDetails String?
  processedAt DateTime?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  @@index([transactionId])
  @@index([referenceCode])
}

model Dispute {
  id String @id @default(cuid())
  contractId String
  contract Contract @relation(fields: [contractId], references: [id])
  claimantId String
  claimantRole String
  claimAmount BigInt
  description String
  status String
  approvedAmount BigInt?
  deadline DateTime
  evidence DisputeEvidence[]
  resolvedAt DateTime?
  resolvedBy String?
  resolutionReason String?
  escalatedAt DateTime?
  escalatedBy String?
  escalationReason String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  @@index([contractId])
  @@index([claimantId])
  @@index([status])
}

model DisputeEvidence {
  id String @id @default(cuid())
  disputeId String
  dispute Dispute @relation(fields: [disputeId], references: [id])
  url String
  submittedBy String
  type String
  order Int?
  createdAt DateTime @default(now())
  @@index([disputeId])
}

model BadDebtInvoice {
  id Int @id @default(autoincrement())
  tenantId String
  tenant User @relation(fields: [tenantId], references: [id], name: "badDebtInvoices")
  contractId String
  contract Contract @relation(fields: [contractId], references: [id], name: "badDebtInvoices")
  amount BigInt
  reason String
  status String
  dueDate DateTime?
  paidAt DateTime?
  paidAmount BigInt?
  collectionAttempts Int @default(0)
  collectionNotes String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  @@index([tenantId])
  @@index([contractId])
  @@index([status])
}
```

Update RoomStatus enum:
```prisma
enum RoomStatus {
  DRAFT
  PENDING
  REJECTED
  AVAILABLE
  PENDING_HANDOVER  // ← ADD THIS
  OCCUPIED
  UNAVAILABLE
}
```

Add relations to User model:
```prisma
badDebtInvoices BadDebtInvoice[] @relation("badDebtInvoices")
```

Add relations to Contract model:
```prisma
badDebtInvoices BadDebtInvoice[] @relation("badDebtInvoices")
```

### Step 2: Generate Migrations
```bash
cd rentalroom-be
npx prisma migrate dev --name add_security_and_ekyc_fields
npx prisma generate
```

### Step 3: Wire Modules to App

**File**: `rentalroom-be/src/app.module.ts`

```typescript
import { DisputeModule } from '@/modules/dispute/dispute.module';
import { eKycModule } from '@/shared/integration/ekyc/ekyc.module';

@Module({
  imports: [
    // ... existing modules
    DisputeModule,
    eKycModule,
  ],
  // ... rest
})
export class AppModule {}
```

**File**: `rentalroom-be/src/main.ts`

```typescript
import { PaymentIdempotencyMiddleware } from '@/common/middleware/payment-idempotency.middleware';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Register middleware
  app.use(new PaymentIdempotencyMiddleware(app.get(PrismaService)));
  
  // ... rest of bootstrap
}
```

### Step 4: Add eKYC to AuthService

**File**: `rentalroom-be/src/modules/auth/auth.service.ts`

```typescript
import { Inject } from '@nestjs/common';
import { IeKycService } from '@/shared/integration/ekyc/ekyc.service.interface';

export class AuthService {
  constructor(
    private prisma: PrismaService,
    @Inject('EKYC_SERVICE') private eKycService: IeKycService,
    // ... existing
  ) {}

  async register(dto: RegisterDto) {
    // ... existing validation

    // Check eKYC (if provided during registration)
    let ekycVerified = false;
    let ekycVerificationId: string | undefined;
    let ekycProvider: string | undefined;

    if (dto.ekycVerified && dto.ekycVerificationId) {
      ekycVerified = true;
      ekycVerificationId = dto.ekycVerificationId;
      ekycProvider = dto.ekycProvider;
    }

    // Create user
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        password: hashedPassword,
        role: dto.role,
        profile: { create: { /* ... */ } },
        ekycVerified,
        ekycVerificationId,
        ekycProvider,
        ekycVerifiedAt: ekycVerified ? new Date() : null,
      },
    });

    return user;
  }
}
```

### Step 5: Add eKYC Endpoint

**File**: `rentalroom-be/src/modules/auth/auth.controller.ts`

```typescript
import { Inject } from '@nestjs/common';

export class AuthController {
  constructor(
    @Inject('EKYC_SERVICE') private eKycService: IeKycService,
  ) {}

  @Post('verify-identity')
  async verifyIdentity(@Body() dto: VerifyIdentityDto) {
    const result = await this.eKycService.verifyIdentity(
      dto.documentImage,
      dto.backImage,
      dto.livenessVideo,
    );
    return result;
  }
}
```

### Step 6: Add Contract Hash Integration

**File**: `rentalroom-be/src/modules/contract/contract-lifecycle.service.ts`

```typescript
import { ContractHashService } from '@/shared/utilities/contract-hash.service';

export class ContractLifecycleService {
  constructor(
    private contractHashService: ContractHashService,
    // ... existing
  ) {}

  async createContract(dto: CreateContractDto) {
    // Generate contract hash
    const contractData = {
      id: uuid(),
      version: 1,
      tenantId: dto.tenantId,
      landlordId: dto.landlordId,
      pdfContent: dto.pdfBuffer,
      startDate: dto.startDate,
      endDate: dto.endDate,
      monthlyRent: dto.monthlyRent,
      deposit: dto.deposit,
      terms: JSON.stringify(dto.terms),
    };

    const contractHash = this.contractHashService.generateContractHash(contractData);

    // Create contract with hash
    const contract = await this.prisma.contract.create({
      data: {
        ...contractData,
        contractHash,
      },
    });

    return contract;
  }

  async validateSignatures(contractId: string, newSignature: Signature) {
    const contract = await this.prisma.contract.findUnique({
      where: { id: contractId },
    });

    // Verify hash hasn't changed
    this.contractHashService.verifyContractHash(
      contract.contractHash,
      newSignature.contractHash,
    );

    return true;
  }
}
```

### Step 7: Environment Variables

**File**: `.env` or `.env.local`

```env
# eKYC Configuration
EKYC_PROVIDER=FPT_AI
EKYC_FPT_API_KEY=your_fpt_api_key_here
EKYC_VNPT_API_KEY=your_vnpt_api_key_here
EKYC_VNPT_CLIENT_ID=your_vnpt_client_id_here
```

### Step 8: Test Integration

```bash
cd rentalroom-be

# Build
npm run build

# Test
npm run test

# Run
npm run start:dev
```

### Step 9: Verify Endpoints

Test endpoints now available:
- `POST /auth/verify-identity` - eKYC verification
- `POST /disputes` - Create dispute
- `PATCH /disputes/{id}/resolve` - Resolve dispute
- `POST /payments/process` - Process payment (with idempotency)

---

## Common Issues & Troubleshooting

### Issue: `Cannot find module eKycModule`
**Solution**: Ensure eKycModule is exported in ekyc.module.ts before importing

### Issue: `PaymentTransaction table not found`
**Solution**: Run `npx prisma migrate dev` to apply migrations

### Issue: `Dispute foreign key error`
**Solution**: Ensure Contract and User models exist and DisputeEvidence properly references Dispute

### Issue: `eKYC provider not initialized`
**Solution**: Check EKYC_FPT_API_KEY or EKYC_VNPT credentials in .env

### Issue: `PaymentIdempotencyMiddleware not working`
**Solution**: Ensure middleware registered BEFORE routes in main.ts

---

## Validation Commands

```bash
# Verify Prisma schema
npx prisma validate

# Generate Prisma client
npx prisma generate

# Check migrations
npx prisma migrate status

# Run migrations
npx prisma migrate deploy

# Seed test data (if needed)
npx prisma db seed

# Check database
npx prisma studio
```

---

## Deployment Commands (Staging)

```bash
# Build Docker image
docker build -f rentalroom-be/Dockerfile -t rental-room-api:staging .

# Run with migrations
docker run -e DATABASE_URL=... rental-room-api:staging npx prisma migrate deploy

# Start service
docker compose -f docker-compose.yml up
```

---

## Success Criteria

✅ All modules compile without errors  
✅ `npm run build` completes successfully  
✅ eKYC endpoint responds with test data  
✅ Dispute endpoint creates records in database  
✅ Payment idempotency deduplicates transactions  
✅ Contract hash verification works  
✅ All 4 migrations applied successfully  

Once all ✅, system is **READY FOR STAGING DEPLOYMENT**

---

## Timeline

- **Now → 30 min**: Update schema + generate migrations
- **30 min → 1 hr**: Wire modules to app
- **1 hr → 1.5 hrs**: Test endpoints
- **1.5 hrs → 2 hrs**: Fix any integration issues
- **2 hrs → Deploy**: Ready for staging

**Total**: ~2-3 hours to full staging deployment
