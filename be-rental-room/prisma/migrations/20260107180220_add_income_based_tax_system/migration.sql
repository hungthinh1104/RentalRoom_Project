/*
  Warnings:

  - You are about to drop the column `data_hash` on the `legal_snapshot` table. All the data in the column will be lost.
  - Added the required column `dataHash` to the `legal_snapshot` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "FeedbackType" AS ENUM ('BUG_REPORT', 'FEATURE_REQUEST', 'GENERAL_INQUIRY', 'OTHER');

-- CreateEnum
CREATE TYPE "FeedbackStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'RESOLVED', 'CLOSED');

-- CreateEnum
CREATE TYPE "UserAiFeedback" AS ENUM ('HELPFUL', 'NOT_HELPFUL', 'INACCURATE', 'OFFENSIVE');

-- CreateEnum
CREATE TYPE "TaxCategory" AS ENUM ('TAXABLE', 'NON_TAXABLE', 'CONDITIONAL');

-- CreateEnum
CREATE TYPE "IncomeType" AS ENUM ('RENT', 'DEPOSIT_INITIAL', 'DEPOSIT_FORFEIT', 'PENALTY', 'UTILITY_MARKUP', 'UTILITY_PASSTHROUGH', 'OTHER');

-- CreateEnum
CREATE TYPE "ExpenseType" AS ENUM ('ELECTRICITY', 'WATER', 'MAINTENANCE', 'TAX_PAID', 'INSURANCE', 'OTHER');

-- CreateEnum
CREATE TYPE "TaxStatus" AS ENUM ('BELOW_THRESHOLD', 'MUST_DECLARE', 'DECLARED', 'PAID');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ContractStatus" ADD VALUE 'DRAFT';
ALTER TYPE "ContractStatus" ADD VALUE 'PENDING_SIGNATURE';
ALTER TYPE "ContractStatus" ADD VALUE 'DEPOSIT_PENDING';
ALTER TYPE "ContractStatus" ADD VALUE 'CANCELLED';

-- DropIndex
DROP INDEX "contract_signature_status_idx";

-- AlterTable
ALTER TABLE "ai_interaction_log" ADD COLUMN     "feedback_reason" TEXT,
ADD COLUMN     "user_feedback" "UserAiFeedback";

-- AlterTable
ALTER TABLE "contract" ADD COLUMN     "deposit_deadline" TIMESTAMP(3),
ADD COLUMN     "last_negotiation_note" TEXT,
ADD COLUMN     "max_occupants" INTEGER,
ADD COLUMN     "payment_day" INTEGER NOT NULL DEFAULT 5,
ADD COLUMN     "payment_ref" VARCHAR(50),
ADD COLUMN     "terms" TEXT;

-- AlterTable
ALTER TABLE "legal_snapshot" DROP COLUMN "data_hash",
ADD COLUMN     "dataHash" VARCHAR(64) NOT NULL;

-- AlterTable
ALTER TABLE "maintenance_request" ADD COLUMN     "feedback" TEXT,
ADD COLUMN     "feedback_at" TIMESTAMP(3),
ADD COLUMN     "rating" INTEGER;

-- AlterTable
ALTER TABLE "room_review" ADD COLUMN     "is_visible" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "landlord_reply" TEXT,
ADD COLUMN     "replied_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "search_cache" ALTER COLUMN "expires_at" SET DEFAULT now() + INTERVAL '7 DAYS';

-- CreateTable
CREATE TABLE "contract_resident" (
    "id" UUID NOT NULL,
    "contract_id" UUID NOT NULL,
    "full_name" VARCHAR(100) NOT NULL,
    "phone_number" VARCHAR(20),
    "citizen_id" VARCHAR(20),
    "relationship" VARCHAR(50),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contract_resident_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_feedback" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "type" "FeedbackType" NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "description" TEXT NOT NULL,
    "rating" INTEGER,
    "status" "FeedbackStatus" NOT NULL DEFAULT 'PENDING',
    "images" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "resolved_at" TIMESTAMP(3),

    CONSTRAINT "system_feedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_config" (
    "id" UUID NOT NULL,
    "landlord_id" UUID NOT NULL,
    "provider" VARCHAR(20) NOT NULL DEFAULT 'SEPAY',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "api_token" TEXT NOT NULL,
    "account_number" VARCHAR(50) NOT NULL,
    "bank_name" VARCHAR(100) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_config_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "meter_reading" (
    "id" UUID NOT NULL,
    "service_id" UUID NOT NULL,
    "contract_id" UUID NOT NULL,
    "month" VARCHAR(7) NOT NULL,
    "previous_reading" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "current_reading" DECIMAL(12,2) NOT NULL,
    "usage" DECIMAL(12,2) NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "meter_reading_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consent_log" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "document_type" VARCHAR(50) NOT NULL,
    "document_version" VARCHAR(20) NOT NULL,
    "document_hash" VARCHAR(64) NOT NULL,
    "action" VARCHAR(20) NOT NULL,
    "ip_address" VARCHAR(45),
    "user_agent" VARCHAR(255),
    "snapshot_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "consent_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "landlord_revenue_snapshot" (
    "id" UUID NOT NULL,
    "landlord_id" UUID NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER,
    "total_revenue" DECIMAL(16,2) NOT NULL,
    "invoice_count" INTEGER NOT NULL,
    "breakdown" JSONB,
    "snapshot_hash" VARCHAR(64) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "landlord_revenue_snapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rental_unit" (
    "id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "address" TEXT NOT NULL,
    "landlord_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rental_unit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "income" (
    "id" UUID NOT NULL,
    "rental_unit_id" UUID NOT NULL,
    "tenant_id" UUID,
    "amount" DECIMAL(16,2) NOT NULL,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'VND',
    "income_type" "IncomeType" NOT NULL,
    "tax_category" "TaxCategory" NOT NULL DEFAULT 'TAXABLE',
    "period_year" INTEGER NOT NULL,
    "period_month" INTEGER NOT NULL,
    "period_month_str" VARCHAR(7) NOT NULL,
    "received_at" TIMESTAMP(3) NOT NULL,
    "payment_method" "PaymentMethod" NOT NULL,
    "snapshot_id" UUID NOT NULL,
    "receipt_number" VARCHAR(50),
    "note" TEXT,
    "deleted_at" TIMESTAMP(3),
    "deleted_by" UUID,
    "delete_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "income_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expense" (
    "id" UUID NOT NULL,
    "rental_unit_id" UUID NOT NULL,
    "amount" DECIMAL(16,2) NOT NULL,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'VND',
    "expense_type" "ExpenseType" NOT NULL,
    "period_year" INTEGER NOT NULL,
    "period_month" INTEGER NOT NULL,
    "period_month_str" VARCHAR(7) NOT NULL,
    "paid_at" TIMESTAMP(3) NOT NULL,
    "note" TEXT,
    "receipt_number" VARCHAR(50),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "expense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tax_year_summary" (
    "id" UUID NOT NULL,
    "landlord_id" UUID NOT NULL,
    "year" INTEGER NOT NULL,
    "total_income" DECIMAL(16,2) NOT NULL,
    "taxable_income" DECIMAL(16,2) NOT NULL,
    "non_taxable_income" DECIMAL(16,2) NOT NULL,
    "regulation_id" UUID NOT NULL,
    "threshold" DECIMAL(16,2) NOT NULL,
    "tax_rate" DECIMAL(5,2),
    "status" "TaxStatus" NOT NULL,
    "snapshot_id" UUID NOT NULL,
    "is_frozen" BOOLEAN NOT NULL DEFAULT false,
    "closed_at" TIMESTAMP(3),
    "closed_by" UUID,
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tax_year_summary_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "contract_resident_contract_id_idx" ON "contract_resident"("contract_id");

-- CreateIndex
CREATE INDEX "system_feedback_user_id_idx" ON "system_feedback"("user_id");

-- CreateIndex
CREATE INDEX "system_feedback_type_idx" ON "system_feedback"("type");

-- CreateIndex
CREATE INDEX "system_feedback_status_idx" ON "system_feedback"("status");

-- CreateIndex
CREATE UNIQUE INDEX "payment_config_landlord_id_key" ON "payment_config"("landlord_id");

-- CreateIndex
CREATE INDEX "payment_config_landlord_id_idx" ON "payment_config"("landlord_id");

-- CreateIndex
CREATE INDEX "meter_reading_contract_id_idx" ON "meter_reading"("contract_id");

-- CreateIndex
CREATE INDEX "meter_reading_service_id_idx" ON "meter_reading"("service_id");

-- CreateIndex
CREATE INDEX "meter_reading_month_idx" ON "meter_reading"("month");

-- CreateIndex
CREATE UNIQUE INDEX "meter_reading_contract_id_service_id_month_key" ON "meter_reading"("contract_id", "service_id", "month");

-- CreateIndex
CREATE INDEX "consent_log_user_id_document_type_idx" ON "consent_log"("user_id", "document_type");

-- CreateIndex
CREATE INDEX "consent_log_document_type_action_idx" ON "consent_log"("document_type", "action");

-- CreateIndex
CREATE INDEX "consent_log_created_at_idx" ON "consent_log"("created_at");

-- CreateIndex
CREATE INDEX "landlord_revenue_snapshot_landlord_id_year_idx" ON "landlord_revenue_snapshot"("landlord_id", "year");

-- CreateIndex
CREATE INDEX "landlord_revenue_snapshot_year_month_idx" ON "landlord_revenue_snapshot"("year", "month");

-- CreateIndex
CREATE UNIQUE INDEX "landlord_revenue_snapshot_landlord_id_year_month_key" ON "landlord_revenue_snapshot"("landlord_id", "year", "month");

-- CreateIndex
CREATE INDEX "rental_unit_landlord_id_idx" ON "rental_unit"("landlord_id");

-- CreateIndex
CREATE INDEX "income_rental_unit_id_period_year_period_month_idx" ON "income"("rental_unit_id", "period_year", "period_month");

-- CreateIndex
CREATE INDEX "income_received_at_idx" ON "income"("received_at");

-- CreateIndex
CREATE INDEX "income_snapshot_id_idx" ON "income"("snapshot_id");

-- CreateIndex
CREATE INDEX "income_deleted_at_idx" ON "income"("deleted_at");

-- CreateIndex
CREATE INDEX "expense_rental_unit_id_period_year_period_month_idx" ON "expense"("rental_unit_id", "period_year", "period_month");

-- CreateIndex
CREATE UNIQUE INDEX "tax_year_summary_landlord_id_year_key" ON "tax_year_summary"("landlord_id", "year");

-- AddForeignKey
ALTER TABLE "contract_resident" ADD CONSTRAINT "contract_resident_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "contract"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "system_feedback" ADD CONSTRAINT "system_feedback_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_config" ADD CONSTRAINT "payment_config_landlord_id_fkey" FOREIGN KEY ("landlord_id") REFERENCES "landlord"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meter_reading" ADD CONSTRAINT "meter_reading_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "service"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meter_reading" ADD CONSTRAINT "meter_reading_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "contract"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consent_log" ADD CONSTRAINT "consent_log_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "landlord_revenue_snapshot" ADD CONSTRAINT "landlord_revenue_snapshot_landlord_id_fkey" FOREIGN KEY ("landlord_id") REFERENCES "landlord"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rental_unit" ADD CONSTRAINT "rental_unit_landlord_id_fkey" FOREIGN KEY ("landlord_id") REFERENCES "landlord"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "income" ADD CONSTRAINT "income_rental_unit_id_fkey" FOREIGN KEY ("rental_unit_id") REFERENCES "rental_unit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "income" ADD CONSTRAINT "income_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "income" ADD CONSTRAINT "income_snapshot_id_fkey" FOREIGN KEY ("snapshot_id") REFERENCES "legal_snapshot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expense" ADD CONSTRAINT "expense_rental_unit_id_fkey" FOREIGN KEY ("rental_unit_id") REFERENCES "rental_unit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tax_year_summary" ADD CONSTRAINT "tax_year_summary_landlord_id_fkey" FOREIGN KEY ("landlord_id") REFERENCES "landlord"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tax_year_summary" ADD CONSTRAINT "tax_year_summary_regulation_id_fkey" FOREIGN KEY ("regulation_id") REFERENCES "regulation_version"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tax_year_summary" ADD CONSTRAINT "tax_year_summary_snapshot_id_fkey" FOREIGN KEY ("snapshot_id") REFERENCES "legal_snapshot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
