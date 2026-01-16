-- Ensure pgvector lives outside public schema to appease Supabase
CREATE SCHEMA IF NOT EXISTS extensions;
CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;
ALTER EXTENSION vector SET SCHEMA extensions;

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('TENANT', 'LANDLORD', 'ADMIN');

-- CreateEnum
CREATE TYPE "PropertyType" AS ENUM ('APARTMENT', 'HOUSE', 'STUDIO');

-- CreateEnum
CREATE TYPE "RoomStatus" AS ENUM ('AVAILABLE', 'OCCUPIED', 'MAINTENANCE', 'RESERVED');

-- CreateEnum
CREATE TYPE "AmenityType" AS ENUM ('AC', 'FRIDGE', 'WASHER', 'BED', 'WIFI');

-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "ContractStatus" AS ENUM ('ACTIVE', 'TERMINATED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('PENDING', 'PAID', 'OVERDUE');

-- CreateEnum
CREATE TYPE "ItemType" AS ENUM ('RENT', 'UTILITY', 'SERVICE', 'OTHER');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'BANK_TRANSFER', 'MOMO', 'ZALOPAY');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "ServiceType" AS ENUM ('ELECTRICITY', 'WATER', 'INTERNET', 'PARKING', 'CLEANING');

-- CreateEnum
CREATE TYPE "BillingMethod" AS ENUM ('FIXED', 'METERED');

-- CreateEnum
CREATE TYPE "MaintenancePriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "MaintenanceCategory" AS ENUM ('PLUMBING', 'ELECTRICAL', 'APPLIANCE', 'OTHER');

-- CreateEnum
CREATE TYPE "MaintenanceStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('PAYMENT', 'CONTRACT', 'MAINTENANCE', 'APPLICATION', 'SYSTEM');

-- CreateTable
CREATE TABLE "user" (
    "id" UUID NOT NULL,
    "full_name" VARCHAR(100) NOT NULL,
    "email" VARCHAR(100) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "phone_number" VARCHAR(20),
    "role" "UserRole" NOT NULL,
    "email_verified" BOOLEAN NOT NULL DEFAULT false,
    "verification_code" VARCHAR(6),
    "verification_expiry" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenant" (
    "user_id" UUID NOT NULL,
    "date_of_birth" DATE,
    "citizen_id" VARCHAR(20),
    "emergency_contact" VARCHAR(100),
    "budget_min" DECIMAL(10,2),
    "budget_max" DECIMAL(10,2),
    "preferred_location" VARCHAR(100),
    "employment_status" VARCHAR(50),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenant_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "landlord" (
    "user_id" UUID NOT NULL,
    "citizen_id" VARCHAR(20),
    "bank_account" VARCHAR(50),
    "bank_name" VARCHAR(100),
    "address" TEXT,
    "property_count" INTEGER NOT NULL DEFAULT 0,
    "rating" DOUBLE PRECISION,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "landlord_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "property" (
    "id" UUID NOT NULL,
    "landlord_id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "address" TEXT NOT NULL,
    "city" VARCHAR(50) NOT NULL,
    "city_code" VARCHAR(20),
    "ward" VARCHAR(50) NOT NULL,
    "ward_code" VARCHAR(20),
    "property_type" "PropertyType" NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "property_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "room" (
    "id" UUID NOT NULL,
    "property_id" UUID NOT NULL,
    "room_number" VARCHAR(20) NOT NULL,
    "area" DOUBLE PRECISION NOT NULL,
    "price_per_month" DECIMAL(10,2) NOT NULL,
    "deposit" DECIMAL(10,2) NOT NULL,
    "status" "RoomStatus" NOT NULL,
    "description" TEXT,
    "max_occupants" INTEGER,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "room_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "room_image" (
    "id" UUID NOT NULL,
    "room_id" UUID NOT NULL,
    "image_url" TEXT NOT NULL,
    "display_order" INTEGER NOT NULL,

    CONSTRAINT "room_image_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "room_amenity" (
    "id" UUID NOT NULL,
    "room_id" UUID NOT NULL,
    "amenity_type" "AmenityType" NOT NULL,
    "quantity" INTEGER NOT NULL,

    CONSTRAINT "room_amenity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rental_application" (
    "id" UUID NOT NULL,
    "room_id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "landlord_id" UUID NOT NULL,
    "application_date" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'PENDING',
    "requested_move_in_date" DATE,
    "message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "reviewed_at" TIMESTAMP(3),

    CONSTRAINT "rental_application_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contract" (
    "id" UUID NOT NULL,
    "application_id" UUID NOT NULL,
    "room_id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "landlord_id" UUID NOT NULL,
    "contract_number" VARCHAR(50) NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "monthly_rent" DECIMAL(10,2) NOT NULL,
    "deposit_amount" DECIMAL(10,2) NOT NULL,
    "status" "ContractStatus" NOT NULL DEFAULT 'ACTIVE',
    "e_signature_url" TEXT,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "signed_at" TIMESTAMP(3),
    "terminated_at" TIMESTAMP(3),

    CONSTRAINT "contract_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoice" (
    "id" UUID NOT NULL,
    "contract_id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "invoice_number" VARCHAR(50) NOT NULL,
    "issue_date" DATE NOT NULL,
    "due_date" DATE NOT NULL,
    "total_amount" DECIMAL(10,2) NOT NULL,
    "status" "InvoiceStatus" NOT NULL DEFAULT 'PENDING',
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "paid_at" TIMESTAMP(3),

    CONSTRAINT "invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoice_line_item" (
    "id" UUID NOT NULL,
    "invoice_id" UUID NOT NULL,
    "service_id" UUID,
    "item_type" "ItemType" NOT NULL,
    "description" TEXT,
    "quantity" DECIMAL(10,2) NOT NULL,
    "unit_price" DECIMAL(10,2) NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "invoice_line_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment" (
    "id" UUID NOT NULL,
    "invoice_id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "payment_method" "PaymentMethod" NOT NULL,
    "payment_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "transaction_id" VARCHAR(100),
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "paid_at" TIMESTAMP(3),

    CONSTRAINT "payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service" (
    "id" UUID NOT NULL,
    "property_id" UUID NOT NULL,
    "service_name" VARCHAR(50) NOT NULL,
    "service_type" "ServiceType" NOT NULL,
    "billing_method" "BillingMethod" NOT NULL,
    "unit_price" DECIMAL(10,2) NOT NULL,
    "unit" VARCHAR(20),
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "maintenance_request" (
    "id" UUID NOT NULL,
    "room_id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "description" TEXT NOT NULL,
    "priority" "MaintenancePriority" NOT NULL DEFAULT 'MEDIUM',
    "category" "MaintenanceCategory" NOT NULL,
    "status" "MaintenanceStatus" NOT NULL DEFAULT 'PENDING',
    "request_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assigned_to" UUID,
    "cost" DECIMAL(10,2),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "maintenance_request_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "room_review" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "room_id" UUID NOT NULL,
    "contract_id" UUID NOT NULL,
    "rating" INTEGER NOT NULL,
    "cleanliness_rating" INTEGER NOT NULL,
    "location_rating" INTEGER NOT NULL,
    "value_rating" INTEGER NOT NULL,
    "comment" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "room_review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "title" VARCHAR(100) NOT NULL,
    "content" TEXT NOT NULL,
    "notification_type" "NotificationType" NOT NULL,
    "related_entity_id" UUID,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "sent_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "read_at" TIMESTAMP(3),

    CONSTRAINT "notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "room_embedding" (
    "id" UUID NOT NULL,
    "room_id" UUID NOT NULL,
    "raw_text" TEXT NOT NULL,
    "embedding" vector(768),
    "embedding_model" VARCHAR(50) NOT NULL DEFAULT 'gemini-text-embedding-004',
    "last_updated" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "room_embedding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenant_ai_profile" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "search_history" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "preference_vector" vector(768),
    "search_count" INTEGER NOT NULL DEFAULT 0,
    "last_searched" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenant_ai_profile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "search_cache" (
    "id" UUID NOT NULL,
    "query" VARCHAR(500) NOT NULL,
    "query_vector" vector(768),
    "hit_count" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_used" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL DEFAULT now() + INTERVAL '7 DAYS',

    CONSTRAINT "search_cache_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_interaction_log" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "action" VARCHAR(50) NOT NULL,
    "input_data" JSONB,
    "ai_response" JSONB,
    "search_type" VARCHAR(20),
    "result_count" INTEGER,
    "response_time_ms" INTEGER,
    "clicked_room_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_interaction_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "popular_search" (
    "id" UUID NOT NULL,
    "query" VARCHAR(500) NOT NULL,
    "search_count" INTEGER NOT NULL DEFAULT 1,
    "last_searched" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cached_results" JSONB,
    "cache_expiry" TIMESTAMP(3),

    CONSTRAINT "popular_search_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE INDEX "user_email_idx" ON "user"("email");

-- CreateIndex
CREATE INDEX "tenant_user_id_idx" ON "tenant"("user_id");

-- CreateIndex
CREATE INDEX "landlord_user_id_idx" ON "landlord"("user_id");

-- CreateIndex
CREATE INDEX "landlord_verified_idx" ON "landlord"("verified");

-- CreateIndex
CREATE INDEX "property_landlord_id_idx" ON "property"("landlord_id");

-- CreateIndex
CREATE INDEX "property_city_ward_idx" ON "property"("city", "ward");

-- CreateIndex
CREATE INDEX "property_deleted_at_idx" ON "property"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "property_landlord_id_name_key" ON "property"("landlord_id", "name");

-- CreateIndex
CREATE INDEX "room_property_id_status_idx" ON "room"("property_id", "status");

-- CreateIndex
CREATE INDEX "room_price_per_month_idx" ON "room"("price_per_month");

-- CreateIndex
CREATE INDEX "room_status_idx" ON "room"("status");

-- CreateIndex
CREATE INDEX "room_deleted_at_idx" ON "room"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "room_property_id_room_number_key" ON "room"("property_id", "room_number");

-- CreateIndex
CREATE INDEX "room_image_room_id_idx" ON "room_image"("room_id");

-- CreateIndex
CREATE UNIQUE INDEX "room_image_room_id_display_order_key" ON "room_image"("room_id", "display_order");

-- CreateIndex
CREATE INDEX "room_amenity_room_id_idx" ON "room_amenity"("room_id");

-- CreateIndex
CREATE INDEX "rental_application_room_id_idx" ON "rental_application"("room_id");

-- CreateIndex
CREATE INDEX "rental_application_tenant_id_idx" ON "rental_application"("tenant_id");

-- CreateIndex
CREATE INDEX "rental_application_landlord_id_idx" ON "rental_application"("landlord_id");

-- CreateIndex
CREATE INDEX "rental_application_status_idx" ON "rental_application"("status");

-- CreateIndex
CREATE UNIQUE INDEX "contract_application_id_key" ON "contract"("application_id");

-- CreateIndex
CREATE UNIQUE INDEX "contract_contract_number_key" ON "contract"("contract_number");

-- CreateIndex
CREATE INDEX "contract_room_id_idx" ON "contract"("room_id");

-- CreateIndex
CREATE INDEX "contract_tenant_id_idx" ON "contract"("tenant_id");

-- CreateIndex
CREATE INDEX "contract_landlord_id_idx" ON "contract"("landlord_id");

-- CreateIndex
CREATE INDEX "contract_status_idx" ON "contract"("status");

-- CreateIndex
CREATE INDEX "contract_deleted_at_idx" ON "contract"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "invoice_invoice_number_key" ON "invoice"("invoice_number");

-- CreateIndex
CREATE INDEX "invoice_contract_id_idx" ON "invoice"("contract_id");

-- CreateIndex
CREATE INDEX "invoice_tenant_id_idx" ON "invoice"("tenant_id");

-- CreateIndex
CREATE INDEX "invoice_status_idx" ON "invoice"("status");

-- CreateIndex
CREATE INDEX "invoice_due_date_idx" ON "invoice"("due_date");

-- CreateIndex
CREATE INDEX "invoice_deleted_at_idx" ON "invoice"("deleted_at");

-- CreateIndex
CREATE INDEX "invoice_line_item_invoice_id_idx" ON "invoice_line_item"("invoice_id");

-- CreateIndex
CREATE INDEX "invoice_line_item_service_id_idx" ON "invoice_line_item"("service_id");

-- CreateIndex
CREATE UNIQUE INDEX "payment_transaction_id_key" ON "payment"("transaction_id");

-- CreateIndex
CREATE INDEX "payment_invoice_id_idx" ON "payment"("invoice_id");

-- CreateIndex
CREATE INDEX "payment_tenant_id_idx" ON "payment"("tenant_id");

-- CreateIndex
CREATE INDEX "payment_status_idx" ON "payment"("status");

-- CreateIndex
CREATE INDEX "payment_deleted_at_idx" ON "payment"("deleted_at");

-- CreateIndex
CREATE INDEX "service_property_id_idx" ON "service"("property_id");

-- CreateIndex
CREATE INDEX "maintenance_request_room_id_idx" ON "maintenance_request"("room_id");

-- CreateIndex
CREATE INDEX "maintenance_request_tenant_id_idx" ON "maintenance_request"("tenant_id");

-- CreateIndex
CREATE INDEX "maintenance_request_assigned_to_idx" ON "maintenance_request"("assigned_to");

-- CreateIndex
CREATE INDEX "maintenance_request_status_idx" ON "maintenance_request"("status");

-- CreateIndex
CREATE INDEX "maintenance_request_priority_idx" ON "maintenance_request"("priority");

-- CreateIndex
CREATE INDEX "room_review_room_id_idx" ON "room_review"("room_id");

-- CreateIndex
CREATE INDEX "room_review_tenant_id_idx" ON "room_review"("tenant_id");

-- CreateIndex
CREATE INDEX "notification_user_id_is_read_idx" ON "notification"("user_id", "is_read");

-- CreateIndex
CREATE INDEX "notification_notification_type_idx" ON "notification"("notification_type");

-- CreateIndex
CREATE UNIQUE INDEX "room_embedding_room_id_key" ON "room_embedding"("room_id");

-- CreateIndex
CREATE INDEX "room_embedding_room_id_idx" ON "room_embedding"("room_id");

-- CreateIndex
CREATE UNIQUE INDEX "tenant_ai_profile_tenant_id_key" ON "tenant_ai_profile"("tenant_id");

-- CreateIndex
CREATE INDEX "tenant_ai_profile_tenant_id_idx" ON "tenant_ai_profile"("tenant_id");

-- CreateIndex
CREATE INDEX "tenant_ai_profile_last_searched_idx" ON "tenant_ai_profile"("last_searched");

-- CreateIndex
CREATE UNIQUE INDEX "search_cache_query_key" ON "search_cache"("query");

-- CreateIndex
CREATE INDEX "search_cache_query_idx" ON "search_cache"("query");

-- CreateIndex
CREATE INDEX "search_cache_last_used_idx" ON "search_cache"("last_used");

-- CreateIndex
CREATE INDEX "search_cache_hit_count_idx" ON "search_cache"("hit_count" DESC);

-- CreateIndex
CREATE INDEX "ai_interaction_log_user_id_idx" ON "ai_interaction_log"("user_id");

-- CreateIndex
CREATE INDEX "ai_interaction_log_action_idx" ON "ai_interaction_log"("action");

-- CreateIndex
CREATE INDEX "ai_interaction_log_search_type_idx" ON "ai_interaction_log"("search_type");

-- CreateIndex
CREATE INDEX "ai_interaction_log_created_at_idx" ON "ai_interaction_log"("created_at");

-- CreateIndex
CREATE INDEX "ai_interaction_log_clicked_room_id_idx" ON "ai_interaction_log"("clicked_room_id");

-- CreateIndex
CREATE UNIQUE INDEX "popular_search_query_key" ON "popular_search"("query");

-- CreateIndex
CREATE INDEX "popular_search_search_count_idx" ON "popular_search"("search_count" DESC);

-- CreateIndex
CREATE INDEX "popular_search_last_searched_idx" ON "popular_search"("last_searched" DESC);

-- AddForeignKey
ALTER TABLE "tenant" ADD CONSTRAINT "tenant_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "landlord" ADD CONSTRAINT "landlord_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "property" ADD CONSTRAINT "property_landlord_id_fkey" FOREIGN KEY ("landlord_id") REFERENCES "landlord"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "room" ADD CONSTRAINT "room_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "room_image" ADD CONSTRAINT "room_image_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "room"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "room_amenity" ADD CONSTRAINT "room_amenity_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "room"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rental_application" ADD CONSTRAINT "rental_application_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "room"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rental_application" ADD CONSTRAINT "rental_application_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rental_application" ADD CONSTRAINT "rental_application_landlord_id_fkey" FOREIGN KEY ("landlord_id") REFERENCES "landlord"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contract" ADD CONSTRAINT "contract_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "rental_application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contract" ADD CONSTRAINT "contract_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "room"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contract" ADD CONSTRAINT "contract_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contract" ADD CONSTRAINT "contract_landlord_id_fkey" FOREIGN KEY ("landlord_id") REFERENCES "landlord"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice" ADD CONSTRAINT "invoice_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "contract"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice" ADD CONSTRAINT "invoice_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_line_item" ADD CONSTRAINT "invoice_line_item_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_line_item" ADD CONSTRAINT "invoice_line_item_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "service"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment" ADD CONSTRAINT "payment_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment" ADD CONSTRAINT "payment_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service" ADD CONSTRAINT "service_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_request" ADD CONSTRAINT "maintenance_request_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "room"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_request" ADD CONSTRAINT "maintenance_request_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_request" ADD CONSTRAINT "maintenance_request_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "room_review" ADD CONSTRAINT "room_review_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "room_review" ADD CONSTRAINT "room_review_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "room"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "room_review" ADD CONSTRAINT "room_review_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "contract"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification" ADD CONSTRAINT "notification_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "room_embedding" ADD CONSTRAINT "room_embedding_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "room"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant_ai_profile" ADD CONSTRAINT "tenant_ai_profile_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_interaction_log" ADD CONSTRAINT "ai_interaction_log_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_interaction_log" ADD CONSTRAINT "ai_interaction_log_clicked_room_id_fkey" FOREIGN KEY ("clicked_room_id") REFERENCES "room"("id") ON DELETE SET NULL ON UPDATE CASCADE;
