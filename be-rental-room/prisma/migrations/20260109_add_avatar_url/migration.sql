-- Add avatar_url column to user table if missing
ALTER TABLE "user"
ADD COLUMN IF NOT EXISTS "avatar_url" VARCHAR(500);
