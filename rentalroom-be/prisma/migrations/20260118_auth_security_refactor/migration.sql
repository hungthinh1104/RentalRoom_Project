-- Separate email verification from password reset tokens
-- This prevents token collision and improves security

-- 1. Add new columns for email verification (separate from reset)
ALTER TABLE "user" ADD COLUMN "email_verification_code" VARCHAR(32);
ALTER TABLE "user" ADD COLUMN "email_verification_expiry" TIMESTAMP(3);

-- 2. Add password reset token fields
ALTER TABLE "user" ADD COLUMN "password_reset_token" VARCHAR(128) UNIQUE;
ALTER TABLE "user" ADD COLUMN "password_reset_expiry" TIMESTAMP(3);

-- 3. Add refresh token tracking for rotation/revocation
ALTER TABLE "user" ADD COLUMN "last_refresh_token_family" VARCHAR(128);
ALTER TABLE "user" ADD COLUMN "last_refresh_issued_at" TIMESTAMP(3);

-- 4. Migrate old verification codes to new column
UPDATE "user" 
SET "email_verification_code" = "verification_code"
WHERE "verification_code" IS NOT NULL AND "email_verified" = false;

-- 5. Create indexes for faster lookups
CREATE INDEX "idx_email_verification_code" ON "user"("email_verification_code");
CREATE INDEX "idx_password_reset_token" ON "user"("password_reset_token");
