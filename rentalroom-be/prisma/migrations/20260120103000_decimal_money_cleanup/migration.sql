-- Switch monetary columns from BIGINT to DECIMAL for 2dp precision

-- Payment transactions
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'payment_transaction'
  ) THEN
    ALTER TABLE "payment_transaction"
      ALTER COLUMN "amount" TYPE NUMERIC(16,2) USING "amount"::NUMERIC(16,2);
  END IF;
END $$;

-- Disputes
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'dispute'
  ) THEN
    ALTER TABLE "dispute"
      ALTER COLUMN "claim_amount" TYPE NUMERIC(16,2) USING "claim_amount"::NUMERIC(16,2),
      ALTER COLUMN "approved_amount" TYPE NUMERIC(16,2) USING "approved_amount"::NUMERIC(16,2);
  END IF;
END $$;

-- Bad debt invoices
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'bad_debt_invoice'
  ) THEN
    ALTER TABLE "bad_debt_invoice"
      ALTER COLUMN "amount" TYPE NUMERIC(16,2) USING "amount"::NUMERIC(16,2),
      ALTER COLUMN "paid_amount" TYPE NUMERIC(16,2) USING "paid_amount"::NUMERIC(16,2);
  END IF;
END $$;
