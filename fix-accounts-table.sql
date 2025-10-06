-- ═══════════════════════════════════════════════════════════════════════════
-- FIX: Add missing 'currency' column to accounts table
-- ═══════════════════════════════════════════════════════════════════════════
-- Run this script in Supabase SQL Editor if you already created the accounts table
-- without the currency column

-- Add currency column to accounts table
ALTER TABLE accounts 
ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'USD';

-- Add comment for the new column
COMMENT ON COLUMN accounts.currency IS 'Account currency (USD, EUR, ILS, etc.)';

-- Update comment for account_size
COMMENT ON COLUMN accounts.account_size IS 'Total account size in account currency';

-- Update comment for commission_fee  
COMMENT ON COLUMN accounts.commission_fee IS 'Commission fee per trade in account currency';

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Successfully added currency column to accounts table!';
END
$$;

