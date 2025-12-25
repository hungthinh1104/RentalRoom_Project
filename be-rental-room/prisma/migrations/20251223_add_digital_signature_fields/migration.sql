-- Add digital signature fields to contract table
ALTER TABLE "contract" ADD COLUMN "pdf_url" TEXT;
ALTER TABLE "contract" ADD COLUMN "pdf_hash" VARCHAR(64);
ALTER TABLE "contract" ADD COLUMN "signed_url" TEXT;
ALTER TABLE "contract" ADD COLUMN "signature_status" VARCHAR(50);

-- Create indexes for better query performance
CREATE INDEX "contract_signature_status_idx" ON "contract"("signature_status");
