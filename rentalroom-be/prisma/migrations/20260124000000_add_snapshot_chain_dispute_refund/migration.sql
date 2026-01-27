-- Add RefundStatus enum if missing
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'RefundStatus') THEN
    CREATE TYPE "RefundStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED');
  END IF;
END $$;

-- Add chain hash fields to legal_snapshot
ALTER TABLE "legal_snapshot"
  ADD COLUMN IF NOT EXISTS "previous_hash" VARCHAR(64),
  ADD COLUMN IF NOT EXISTS "chain_hash" VARCHAR(64);

-- Create dispute_refund table if missing
CREATE TABLE IF NOT EXISTS "dispute_refund" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "dispute_id" UUID UNIQUE NOT NULL,
  "amount" DECIMAL(16,2) NOT NULL,
  "status" "RefundStatus" NOT NULL DEFAULT 'PENDING',
  "reason" TEXT,
  "processed_at" TIMESTAMPTZ,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "dispute_refund_dispute_id_fkey"
    FOREIGN KEY ("dispute_id") REFERENCES "dispute"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "dispute_refund_status_idx" ON "dispute_refund"("status");
