-- Create idempotent_operations table for preventing double payment
CREATE TABLE IF NOT EXISTS idempotent_operations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    idempotency_key VARCHAR(255) NOT NULL UNIQUE,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,
    result_data JSONB,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMP NOT NULL DEFAULT (NOW() + INTERVAL '24 hours')
);

CREATE INDEX idx_idempotent_operations_expires_at ON idempotent_operations(expires_at);
CREATE INDEX idx_idempotent_operations_entity ON idempotent_operations(entity_type, entity_id);

COMMENT ON TABLE idempotent_operations IS 'Stores idempotency keys to prevent duplicate operations (payments, invoices)';
