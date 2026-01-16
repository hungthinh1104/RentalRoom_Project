-- Add is_verified column for tenant to align with seed data
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'tenant'
          AND column_name = 'is_verified'
    ) THEN
        ALTER TABLE "tenant" ADD COLUMN "is_verified" BOOLEAN NOT NULL DEFAULT false;
    END IF;
END $$;
