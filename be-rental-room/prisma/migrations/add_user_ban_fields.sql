-- Migration: Add user ban fields
-- Created: 2026-01-10
-- Description: Add isBanned, bannedAt, bannedReason, bannedBy fields to user table for admin user management

-- Add ban/unban fields to user table
ALTER TABLE "user" 
ADD COLUMN "is_banned" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "banned_at" TIMESTAMP,
ADD COLUMN "banned_reason" VARCHAR(500),
ADD COLUMN "banned_by" UUID;

-- Add index for banned users (for faster queries)
CREATE INDEX "user_is_banned_idx" ON "user"("is_banned");

-- Add comment for documentation
COMMENT ON COLUMN "user"."is_banned" IS 'Whether the user is banned by admin';
COMMENT ON COLUMN "user"."banned_at" IS 'Timestamp when user was banned';
COMMENT ON COLUMN "user"."banned_reason" IS 'Reason for banning the user';
COMMENT ON COLUMN "user"."banned_by" IS 'Admin user ID who banned this user';
