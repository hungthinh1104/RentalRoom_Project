-- CreateEnum
-- Add review_images column to room_review table

-- AlterTable
ALTER TABLE "room_review" ADD COLUMN IF NOT EXISTS "review_images" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Add comment for documentation
COMMENT ON COLUMN "room_review"."review_images" IS 'Array of image URLs for tenant review photos';
