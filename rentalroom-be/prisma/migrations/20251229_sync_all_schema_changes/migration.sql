-- Manual migration to sync schema changes applied via prisma db push
-- This migration captures all missing columns and tables

-- AlterEnum: Add COMPLETED to ApplicationStatus
ALTER TYPE "ApplicationStatus" ADD VALUE IF NOT EXISTS 'COMPLETED';

-- AlterTable: Add missing columns to rental_application
ALTER TABLE "rental_application" 
  ADD COLUMN IF NOT EXISTS "contract_id" UUID,
  ADD COLUMN IF NOT EXISTS "rejection_reason" TEXT;

-- CreateTable: favorite_room (if not exists)
CREATE TABLE IF NOT EXISTS "favorite_room" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "room_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "favorite_room_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "favorite_room_tenant_id_idx" ON "favorite_room"("tenant_id");
CREATE INDEX IF NOT EXISTS "favorite_room_room_id_idx" ON "favorite_room"("room_id");
CREATE UNIQUE INDEX IF NOT EXISTS "favorite_room_tenant_id_room_id_key" ON "favorite_room"("tenant_id", "room_id");

-- AddForeignKey
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'favorite_room_tenant_id_fkey') THEN
    ALTER TABLE "favorite_room" ADD CONSTRAINT "favorite_room_tenant_id_fkey" 
      FOREIGN KEY ("tenant_id") REFERENCES "tenant"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'favorite_room_room_id_fkey') THEN
    ALTER TABLE "favorite_room" ADD CONSTRAINT "favorite_room_room_id_fkey" 
      FOREIGN KEY ("room_id") REFERENCES "room"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
