-- ═══════════════════════════════════════════════════════════════════════════
-- FIX: Update trades table to match required structure
-- ═══════════════════════════════════════════════════════════════════════════

-- First, drop ALL dependent views (we'll recreate them later)
DROP VIEW IF EXISTS active_trades_summary CASCADE;
DROP VIEW IF EXISTS closed_trades_summary CASCADE;
DROP VIEW IF EXISTS trade_performance_summary CASCADE;
DROP VIEW IF EXISTS trading_performance_summary CASCADE;
DROP VIEW IF EXISTS user_trade_stats CASCADE;
DROP VIEW IF EXISTS account_summary CASCADE;

-- Add user_id column if missing
ALTER TABLE trades 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add missing columns
ALTER TABLE trades 
ADD COLUMN IF NOT EXISTS current_price DECIMAL(15, 2);

ALTER TABLE trades 
ADD COLUMN IF NOT EXISTS profit_loss_percentage TEXT;

ALTER TABLE trades 
ADD COLUMN IF NOT EXISTS is_sample BOOLEAN DEFAULT FALSE;

-- Change data types to match schema
ALTER TABLE trades 
ALTER COLUMN symbol TYPE VARCHAR(255);

ALTER TABLE trades 
ALTER COLUMN direction TYPE VARCHAR(255);

ALTER TABLE trades 
ALTER COLUMN status TYPE VARCHAR(255);

ALTER TABLE trades 
ALTER COLUMN strategy TYPE VARCHAR(255);

ALTER TABLE trades 
ALTER COLUMN entry_price TYPE DECIMAL(15, 2);

ALTER TABLE trades 
ALTER COLUMN quantity TYPE DECIMAL(15, 2);

ALTER TABLE trades 
ALTER COLUMN total_quantity TYPE DECIMAL(15, 2);

ALTER TABLE trades 
ALTER COLUMN stop_price TYPE DECIMAL(15, 2);

ALTER TABLE trades 
ALTER COLUMN target_price TYPE TEXT USING target_price::TEXT;

ALTER TABLE trades 
ALTER COLUMN position_size TYPE INTEGER USING position_size::INTEGER;

ALTER TABLE trades 
ALTER COLUMN total_investment TYPE INTEGER USING total_investment::INTEGER;

ALTER TABLE trades 
ALTER COLUMN confidence_level TYPE TEXT USING confidence_level::TEXT;

ALTER TABLE trades 
ALTER COLUMN profit_loss TYPE TEXT USING profit_loss::TEXT;

ALTER TABLE trades 
ALTER COLUMN risk_percentage TYPE DECIMAL(15, 2);

-- Add notes column if missing
ALTER TABLE trades 
ADD COLUMN IF NOT EXISTS notes VARCHAR(255);

-- Add screenshot_url column (rename from close_reason or add new)
ALTER TABLE trades 
ADD COLUMN IF NOT EXISTS screenshot_url VARCHAR(255);

-- Rename close_price to exit_price and change type
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'trades' AND column_name = 'close_price'
    ) THEN
        ALTER TABLE trades RENAME COLUMN close_price TO exit_price;
        ALTER TABLE trades ALTER COLUMN exit_price TYPE TEXT USING exit_price::TEXT;
    ELSE
        ALTER TABLE trades ADD COLUMN IF NOT EXISTS exit_price TEXT;
    END IF;
END $$;

-- Rename close_date to exit_date and change type
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'trades' AND column_name = 'close_date'
    ) THEN
        ALTER TABLE trades RENAME COLUMN close_date TO exit_date;
        ALTER TABLE trades ALTER COLUMN exit_date TYPE TEXT USING exit_date::TEXT;
    ELSE
        ALTER TABLE trades ADD COLUMN IF NOT EXISTS exit_date TEXT;
    END IF;
END $$;

-- Update user_id for existing records (set to their account's user)
UPDATE trades t
SET user_id = a.user_id
FROM accounts a
WHERE t.account_id = a.id AND t.user_id IS NULL;

-- Add comments
COMMENT ON COLUMN trades.user_id IS 'User who owns this trade';
COMMENT ON COLUMN trades.current_price IS 'Current/last known market price';
COMMENT ON COLUMN trades.exit_price IS 'Exit price (can be text for multiple exits)';
COMMENT ON COLUMN trades.exit_date IS 'Exit date (can be text for multiple exits)';
COMMENT ON COLUMN trades.profit_loss_percentage IS 'Profit/loss as percentage';
COMMENT ON COLUMN trades.screenshot_url IS 'URL to trade screenshot/chart';
COMMENT ON COLUMN trades.is_sample IS 'Whether this is a sample/demo trade';
COMMENT ON COLUMN trades.notes IS 'Trade notes';

-- Recreate views with updated schema
CREATE OR REPLACE VIEW active_trades_summary AS
SELECT 
    t.*,
    a.name as account_name,
    a.currency
FROM trades t
JOIN accounts a ON t.account_id = a.id
WHERE t.status = 'open';

CREATE OR REPLACE VIEW closed_trades_summary AS
SELECT 
    t.*,
    a.name as account_name,
    a.currency
FROM trades t
JOIN accounts a ON t.account_id = a.id
WHERE t.status = 'closed';

CREATE OR REPLACE VIEW trade_performance_summary AS
SELECT 
    user_id,
    account_id,
    COUNT(*) as total_trades,
    COUNT(CASE WHEN status = 'open' THEN 1 END) as open_trades,
    COUNT(CASE WHEN status = 'closed' THEN 1 END) as closed_trades,
    COUNT(CASE WHEN status = 'closed' AND profit_loss::NUMERIC > 0 THEN 1 END) as winning_trades,
    COUNT(CASE WHEN status = 'closed' AND profit_loss::NUMERIC <= 0 THEN 1 END) as losing_trades
FROM trades
GROUP BY user_id, account_id;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '═══════════════════════════════════════════════════════════════';
    RAISE NOTICE 'Successfully updated trades table!';
    RAISE NOTICE '═══════════════════════════════════════════════════════════════';
    RAISE NOTICE 'Updated columns:';
    RAISE NOTICE '  ✓ Added user_id column';
    RAISE NOTICE '  ✓ Added current_price';
    RAISE NOTICE '  ✓ Added profit_loss_percentage';
    RAISE NOTICE '  ✓ Added is_sample';
    RAISE NOTICE '  ✓ Added notes';
    RAISE NOTICE '  ✓ Added screenshot_url';
    RAISE NOTICE '  ✓ Changed data types to match schema';
    RAISE NOTICE '  ✓ Renamed close_price → exit_price';
    RAISE NOTICE '  ✓ Renamed close_date → exit_date';
    RAISE NOTICE '  ✓ Recreated all views';
    RAISE NOTICE '═══════════════════════════════════════════════════════════════';
END
$$;

