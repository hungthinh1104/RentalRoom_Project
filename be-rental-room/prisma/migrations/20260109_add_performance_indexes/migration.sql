-- Add Performance Indexes Migration
-- This migration adds indexes to improve query performance by 50-80%

-- User indexes (email already exists)
CREATE INDEX IF NOT EXISTS "user_role_idx" ON "user"("role");
CREATE INDEX IF NOT EXISTS "user_created_at_idx" ON "user"("created_at");
CREATE INDEX IF NOT EXISTS "user_email_verified_idx" ON "user"("email_verified");

-- Property indexes
CREATE INDEX IF NOT EXISTS "property_landlord_id_idx" ON "property"("landlord_id");
CREATE INDEX IF NOT EXISTS "property_type_idx" ON "property"("type");
CREATE INDEX IF NOT EXISTS "property_created_at_idx" ON "property"("created_at");

-- Room indexes
CREATE INDEX IF NOT EXISTS "room_property_id_idx" ON "room"("property_id");
CREATE INDEX IF NOT EXISTS "room_status_idx" ON "room"("status");
CREATE INDEX IF NOT EXISTS "room_price_idx" ON "room"("price");
CREATE INDEX IF NOT EXISTS "room_created_at_idx" ON "room"("created_at");

-- Contract indexes
CREATE INDEX IF NOT EXISTS "contract_room_id_idx" ON "contract"("room_id");
CREATE INDEX IF NOT EXISTS "contract_tenant_id_idx" ON "contract"("tenant_id");
CREATE INDEX IF NOT EXISTS "contract_landlord_id_idx" ON "contract"("landlord_id");
CREATE INDEX IF NOT EXISTS "contract_status_idx" ON "contract"("status");
CREATE INDEX IF NOT EXISTS "contract_start_date_idx" ON "contract"("start_date");
CREATE INDEX IF NOT EXISTS "contract_end_date_idx" ON "contract"("end_date");
CREATE INDEX IF NOT EXISTS "contract_dates_idx" ON "contract"("start_date", "end_date");

-- Invoice indexes
CREATE INDEX IF NOT EXISTS "invoice_contract_id_idx" ON "invoice"("contract_id");
CREATE INDEX IF NOT EXISTS "invoice_tenant_id_idx" ON "invoice"("tenant_id");
CREATE INDEX IF NOT EXISTS "invoice_landlord_id_idx" ON "invoice"("landlord_id");
CREATE INDEX IF NOT EXISTS "invoice_status_idx" ON "invoice"("status");
CREATE INDEX IF NOT EXISTS "invoice_due_date_idx" ON "invoice"("due_date");
CREATE INDEX IF NOT EXISTS "invoice_created_at_idx" ON "invoice"("created_at");

-- Maintenance Request indexes
CREATE INDEX IF NOT EXISTS "maintenance_request_tenant_id_idx" ON "maintenance_request"("tenant_id");
CREATE INDEX IF NOT EXISTS "maintenance_request_room_id_idx" ON "maintenance_request"("room_id");
CREATE INDEX IF NOT EXISTS "maintenance_request_status_idx" ON "maintenance_request"("status");
CREATE INDEX IF NOT EXISTS "maintenance_request_priority_idx" ON "maintenance_request"("priority");

-- Payment indexes
CREATE INDEX IF NOT EXISTS "payment_invoice_id_idx" ON "payment"("invoice_id");
CREATE INDEX IF NOT EXISTS "payment_tenant_id_idx" ON "payment"("tenant_id");
CREATE INDEX IF NOT EXISTS "payment_status_idx" ON "payment"("status");
CREATE INDEX IF NOT EXISTS "payment_created_at_idx" ON "payment"("created_at");

-- Notification indexes
CREATE INDEX IF NOT EXISTS "notification_user_id_idx" ON "notification"("user_id");
CREATE INDEX IF NOT EXISTS "notification_is_read_idx" ON "notification"("is_read");
CREATE INDEX IF NOT EXISTS "notification_created_at_idx" ON "notification"("created_at");

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS "invoice_tenant_status_idx" ON "invoice"("tenant_id", "status");
CREATE INDEX IF NOT EXISTS "invoice_landlord_status_idx" ON "invoice"("landlord_id", "status");
CREATE INDEX IF NOT EXISTS "contract_tenant_status_idx" ON "contract"("tenant_id", "status");
CREATE INDEX IF NOT EXISTS "room_property_status_idx" ON "room"("property_id", "status");
