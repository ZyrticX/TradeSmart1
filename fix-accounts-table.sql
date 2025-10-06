-- ═══════════════════════════════════════════════════════════════════════════
-- FIX: Add missing columns to accounts table
-- ═══════════════════════════════════════════════════════════════════════════
-- Run this script in Supabase SQL Editor if you already created the accounts table
-- without all the necessary columns

-- Add missing columns to accounts table
ALTER TABLE accounts 
ADD COLUMN IF NOT EXISTS currency VARCHAR(255) DEFAULT 'USD';

ALTER TABLE accounts 
ADD COLUMN IF NOT EXISTS max_account_risk_percentage DECIMAL(15, 2) DEFAULT 10.0 
CHECK (max_account_risk_percentage >= 0 AND max_account_risk_percentage <= 100);

ALTER TABLE accounts 
ADD COLUMN IF NOT EXISTS sentiments TEXT;

ALTER TABLE accounts 
ADD COLUMN IF NOT EXISTS is_sample BOOLEAN DEFAULT FALSE;

-- Change account_size type if needed
ALTER TABLE accounts 
ALTER COLUMN account_size TYPE INTEGER USING account_size::INTEGER;

-- Change strategies type if it was array
ALTER TABLE accounts 
ALTER COLUMN strategies TYPE TEXT;

-- Add comments for the new columns
COMMENT ON COLUMN accounts.currency IS 'Account currency (USD, EUR, ILS, etc.)';
COMMENT ON COLUMN accounts.max_account_risk_percentage IS 'Maximum total risk percentage across all trades';
COMMENT ON COLUMN accounts.sentiments IS 'JSON string of market sentiments data';
COMMENT ON COLUMN accounts.is_sample IS 'Whether this is a sample/demo account';

-- Update other comments
COMMENT ON COLUMN accounts.account_size IS 'Total account size in account currency';
COMMENT ON COLUMN accounts.commission_fee IS 'Commission fee per trade in account currency';
COMMENT ON COLUMN accounts.strategies IS 'JSON string of trading strategies';

-- Success message
DO $$
BEGIN
    RAISE NOTICE '═══════════════════════════════════════════════════════════════';
    RAISE NOTICE 'Successfully updated accounts table with all columns!';
    RAISE NOTICE '═══════════════════════════════════════════════════════════════';
    RAISE NOTICE 'Added/Updated columns:';
    RAISE NOTICE '  ✓ currency (VARCHAR)';
    RAISE NOTICE '  ✓ max_account_risk_percentage (DECIMAL)';
    RAISE NOTICE '  ✓ sentiments (TEXT)';
    RAISE NOTICE '  ✓ is_sample (BOOLEAN)';
    RAISE NOTICE '  ✓ account_size changed to INTEGER';
    RAISE NOTICE '  ✓ strategies changed to TEXT';
    RAISE NOTICE '═══════════════════════════════════════════════════════════════';
END
$$;

