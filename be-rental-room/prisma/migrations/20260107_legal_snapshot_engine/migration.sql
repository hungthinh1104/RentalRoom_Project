-- CreateTable: legal_snapshot
CREATE TABLE "legal_snapshot" (
    "id" UUID NOT NULL,
    "actor_id" UUID NOT NULL,
    "actor_role" "UserRole" NOT NULL,
    "action_type" VARCHAR(50) NOT NULL,
    "entity_type" VARCHAR(50) NOT NULL,
    "entity_id" UUID NOT NULL,
    "timestamp" TIMESTAMPTZ NOT NULL,
    "ip_address" VARCHAR(45),
    "user_agent" VARCHAR(255),
    "city" VARCHAR(100),
    "regulations" JSONB NOT NULL DEFAULT '[]',
    "document_versions" JSONB NOT NULL DEFAULT '[]',
    "data_hash" VARCHAR(64) NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "legal_snapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable: regulation_version
CREATE TABLE "regulation_version" (
    "id" UUID NOT NULL,
    "type" VARCHAR(50) NOT NULL,
    "version" VARCHAR(20) NOT NULL,
    "summary" TEXT NOT NULL,
    "content_hash" VARCHAR(64) NOT NULL,
    "content_url" TEXT,
    "effective_from" TIMESTAMPTZ NOT NULL,
    "effective_to" TIMESTAMPTZ,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "regulation_version_pkey" PRIMARY KEY ("id")
);

-- AlterTable: contract - Add snapshotId
ALTER TABLE "contract" ADD COLUMN "snapshot_id" UUID;

-- AlterTable: payment - Add snapshotId
ALTER TABLE "payment" ADD COLUMN "snapshot_id" UUID;

-- CreateIndex
CREATE INDEX "legal_snapshot_actor_id_action_type_idx" ON "legal_snapshot"("actor_id", "action_type");
CREATE INDEX "legal_snapshot_entity_type_entity_id_idx" ON "legal_snapshot"("entity_type", "entity_id");
CREATE INDEX "legal_snapshot_timestamp_idx" ON "legal_snapshot"("timestamp");
CREATE INDEX "legal_snapshot_action_type_idx" ON "legal_snapshot"("action_type");

-- CreateIndex
CREATE UNIQUE INDEX "regulation_version_type_version_key" ON "regulation_version"("type", "version");
CREATE INDEX "regulation_version_type_effective_from_idx" ON "regulation_version"("type", "effective_from");
CREATE INDEX "regulation_version_deleted_at_idx" ON "regulation_version"("deleted_at");
