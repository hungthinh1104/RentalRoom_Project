-- Switch monetary columns from BIGINT to DECIMAL for 2dp precision

-- Payment transactions
ALTER TABLE "payment_transaction"
  ALTER COLUMN "amount" TYPE NUMERIC(16,2) USING "amount"::NUMERIC(16,2);

-- Disputes
ALTER TABLE "dispute"
  ALTER COLUMN "claim_amount" TYPE NUMERIC(16,2) USING "claim_amount"::NUMERIC(16,2),
  ALTER COLUMN "approved_amount" TYPE NUMERIC(16,2) USING "approved_amount"::NUMERIC(16,2);

-- Bad debt invoices
ALTER TABLE "bad_debt_invoice"
  ALTER COLUMN "amount" TYPE NUMERIC(16,2) USING "amount"::NUMERIC(16,2),
  ALTER COLUMN "paid_amount" TYPE NUMERIC(16,2) USING "paid_amount"::NUMERIC(16,2);
