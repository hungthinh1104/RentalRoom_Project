-- AlterTable: Add fileId column to room_image table
ALTER TABLE "room_image" ADD COLUMN "file_id" VARCHAR(255);

-- CreateIndex: Add index on fileId for faster lookups
CREATE INDEX "room_image_file_id_idx" ON "room_image"("file_id");
