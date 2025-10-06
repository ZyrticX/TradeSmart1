-- ═══════════════════════════════════════════════════════════════════════════
-- FIX: Update trades table - SIMPLE VERSION
-- ═══════════════════════════════════════════════════════════════════════════
-- This script drops ALL views and recreates the trades table structure

-- ══════════════════════════════════════════════════════════════════════════
-- STEP 1: Drop ALL views to avoid conflicts
-- ══════════════════════════════════════════════════════════════════════════

DO $$ 
DECLARE 
    r RECORD;
BEGIN
    -- Drop all views in public schema
    FOR r IN (SELECT viewname FROM pg_views WHERE schemaname = 'public') LOOP
        EXECUTE 'DROP VIEW IF EXISTS ' || quote_ident(r.viewname) || ' CASCADE';
    END LOOP;
    
    RAISE NOTICE 'All views dropped successfully';
END $$;

-- ══════════════════════════════════════════════════════════════════════════
-- STEP 2: Add missing columns
-- ══════════════════════════════════════════════════════════════════════════

-- Add user_id
ALTER TABLE trades 
ADD COLUMN IF NOT EXISTS user_id UUID;

-- Add missing columns
ALTER TABLE trades 
ADD COLUMN IF NOT EXISTS current_price DECIMAL(15, 2);

ALTER TABLE trades 
ADD COLUMN IF NOT EXISTS profit_loss_percentage TEXT;

ALTER TABLE trades 
ADD COLUMN IF NOT EXISTS is_sample BOOLEAN DEFAULT FALSE;

ALTER TABLE trades 
ADD COLUMN IF NOT EXISTS notes VARCHAR(255);

ALTER TABLE trades 
ADD COLUMN IF NOT EXISTS screenshot_url VARCHAR(255);

ALTER TABLE trades 
ADD COLUMN IF NOT EXISTS exit_price TEXT;

ALTER TABLE trades 
ADD COLUMN IF NOT EXISTS exit_date TEXT;

-- ══════════════════════════════════════════════════════════════════════════
-- STEP 3: Update user_id for existing records
-- ══════════════════════════════════════════════════════════════════════════

UPDATE trades t
SET user_id = a.user_id
FROM accounts a
WHERE t.account_id = a.id AND t.user_id IS NULL;

-- Now add the foreign key constraint
ALTER TABLE trades 
DROP CONSTRAINT IF EXISTS trades_user_id_fkey;

ALTER TABLE trades 
ADD CONSTRAINT trades_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- ══════════════════════════════════════════════════════════════════════════
-- STEP 4: Recreate essential views
-- ══════════════════════════════════════════════════════════════════════════

-- View for active/open trades
CREATE OR REPLACE VIEW active_trades_summary AS
SELECT 
    t.id,
    t.user_id,
    t.account_id,
    t.symbol,
    t.date_time,
    t.direction,
    t.entry_price,
    t.quantity,
    t.total_quantity,
    t.current_price,
    t.status,
    t.profit_loss,
    a.name as account_name,
    a.currency
FROM trades t
JOIN accounts a ON t.account_id = a.id
WHERE t.status = 'open';

-- View for closed trades
CREATE OR REPLACE VIEW closed_trades_summary AS
SELECT 
    t.id,
    t.user_id,
    t.account_id,
    t.symbol,
    t.date_time,
    t.direction,
    t.entry_price,
    t.exit_price,
    t.exit_date,
    t.profit_loss,
    t.profit_loss_percentage,
    t.status,
    a.name as account_name,
    a.currency
FROM trades t
JOIN accounts a ON t.account_id = a.id
WHERE t.status = 'closed';

-- View for performance summary
CREATE OR REPLACE VIEW trade_performance_summary AS
SELECT 
    t.user_id,
    t.account_id,
    a.name as account_name,
    COUNT(*) as total_trades,
    COUNT(CASE WHEN t.status = 'open' THEN 1 END) as open_trades,
    COUNT(CASE WHEN t.status = 'closed' THEN 1 END) as closed_trades
FROM trades t
JOIN accounts a ON t.account_id = a.id
GROUP BY t.user_id, t.account_id, a.name;

-- ══════════════════════════════════════════════════════════════════════════
-- Success Message
-- ══════════════════════════════════════════════════════════════════════════

DO $$
BEGIN
    RAISE NOTICE '═══════════════════════════════════════════════════════════════';
    RAISE NOTICE 'SUCCESS! Trades table updated successfully!';
    RAISE NOTICE '═══════════════════════════════════════════════════════════════';
    RAISE NOTICE 'Changes made:';
    RAISE NOTICE '  ✓ Dropped all old views';
    RAISE NOTICE '  ✓ Added user_id column';
    RAISE NOTICE '  ✓ Added current_price column';
    RAISE NOTICE '  ✓ Added profit_loss_percentage column';
    RAISE NOTICE '  ✓ Added is_sample column';
    RAISE NOTICE '  ✓ Added notes column';
    RAISE NOTICE '  ✓ Added screenshot_url column';
    RAISE NOTICE '  ✓ Added exit_price column';
    RAISE NOTICE '  ✓ Added exit_date column';
    RAISE NOTICE '  ✓ Updated user_id for existing records';
    RAISE NOTICE '  ✓ Recreated essential views';
    RAISE NOTICE '═══════════════════════════════════════════════════════════════';
    RAISE NOTICE 'You can now use your updated trades table!';
    RAISE NOTICE '═══════════════════════════════════════════════════════════════';
END $$;

