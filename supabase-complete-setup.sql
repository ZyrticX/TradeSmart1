-- ═══════════════════════════════════════════════════════════════════════════
-- TradeSmart - Complete Database Setup for Supabase
-- Version: 2.0.0
-- Date: October 2025
-- Description: Complete database schema with tables, functions, triggers, 
--              security policies, and sample data
-- ═══════════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════════
-- SECTION 1: Extensions
-- ═══════════════════════════════════════════════════════════════════════════

-- Enable UUID extension for auto-generated IDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable pgcrypto for password hashing (if needed)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ═══════════════════════════════════════════════════════════════════════════
-- SECTION 2: Tables
-- ═══════════════════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────────────────
-- 2.0 User Profiles Table
-- ───────────────────────────────────────────────────────────────────────────
-- Extends auth.users with additional user information
-- This table is automatically populated when a user signs up

CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin', 'premium')),
    phone TEXT,
    avatar_url TEXT,
    timezone TEXT DEFAULT 'UTC',
    preferred_language TEXT DEFAULT 'he' CHECK (preferred_language IN ('en', 'he')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_phone CHECK (phone IS NULL OR length(phone) >= 10)
);

-- Add comments
COMMENT ON TABLE profiles IS 'Extended user profile information';
COMMENT ON COLUMN profiles.id IS 'References auth.users(id)';
COMMENT ON COLUMN profiles.role IS 'User role: user, admin, or premium';
COMMENT ON COLUMN profiles.preferred_language IS 'Preferred UI language';

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
    ON profiles FOR SELECT
    TO authenticated
    USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
    ON profiles FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Profiles are created on signup"
    ON profiles FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = id);

-- ───────────────────────────────────────────────────────────────────────────
-- 2.1 Accounts Table
-- ───────────────────────────────────────────────────────────────────────────
-- Stores trading accounts for each user
-- A user can have multiple trading accounts

CREATE TABLE IF NOT EXISTS accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    currency VARCHAR(255) DEFAULT 'USD',
    account_size INTEGER DEFAULT 100000 CHECK (account_size >= 0),
    default_risk_percentage DECIMAL(15, 2) DEFAULT 2.0 CHECK (default_risk_percentage >= 0 AND default_risk_percentage <= 100),
    max_account_risk_percentage DECIMAL(15, 2) DEFAULT 10.0 CHECK (max_account_risk_percentage >= 0 AND max_account_risk_percentage <= 100),
    max_position_size_percentage DECIMAL(15, 2) DEFAULT 25.0 CHECK (max_position_size_percentage >= 0 AND max_position_size_percentage <= 100),
    commission_fee DECIMAL(15, 2) DEFAULT 0 CHECK (commission_fee >= 0),
    strategies TEXT, -- JSON string of strategy names
    sentiments TEXT, -- JSON string of sentiments data
    is_sample BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT unique_account_name_per_user UNIQUE(user_id, name)
);

-- Add comments
COMMENT ON TABLE accounts IS 'Trading accounts belonging to users';
COMMENT ON COLUMN accounts.currency IS 'Account currency (USD, EUR, ILS, etc.)';
COMMENT ON COLUMN accounts.account_size IS 'Total account size in account currency';
COMMENT ON COLUMN accounts.default_risk_percentage IS 'Default risk percentage per trade';
COMMENT ON COLUMN accounts.max_account_risk_percentage IS 'Maximum total risk percentage across all trades';
COMMENT ON COLUMN accounts.max_position_size_percentage IS 'Maximum position size as percentage of account';
COMMENT ON COLUMN accounts.commission_fee IS 'Commission fee per trade in account currency';
COMMENT ON COLUMN accounts.strategies IS 'JSON string of trading strategies';
COMMENT ON COLUMN accounts.sentiments IS 'JSON string of market sentiments data';
COMMENT ON COLUMN accounts.is_sample IS 'Whether this is a sample/demo account';

-- ───────────────────────────────────────────────────────────────────────────
-- 2.2 Trades Table
-- ───────────────────────────────────────────────────────────────────────────
-- Stores all trades (open and closed)

CREATE TABLE IF NOT EXISTS trades (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    symbol VARCHAR(255) NOT NULL,
    date_time TIMESTAMP WITH TIME ZONE NOT NULL,
    direction VARCHAR(255) NOT NULL CHECK (direction IN ('long', 'short')),
    entry_price DECIMAL(15, 2) NOT NULL CHECK (entry_price > 0),
    quantity DECIMAL(15, 2) NOT NULL CHECK (quantity > 0),
    total_quantity DECIMAL(15, 2) NOT NULL CHECK (total_quantity > 0),
    stop_price DECIMAL(15, 2) NOT NULL CHECK (stop_price > 0),
    target_price TEXT, -- Can be null or empty string
    risk_percentage DECIMAL(15, 2) NOT NULL CHECK (risk_percentage >= 0 AND risk_percentage <= 100),
    risk_amount DECIMAL(15, 2) NOT NULL CHECK (risk_amount >= 0),
    position_size INTEGER NOT NULL CHECK (position_size >= 0),
    total_investment INTEGER NOT NULL CHECK (total_investment >= 0),
    current_price DECIMAL(15, 2), -- Current/last known price
    exit_price TEXT, -- Can be null or empty string
    exit_date TEXT, -- Can be null or empty string
    status VARCHAR(255) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
    strategy VARCHAR(255),
    notes VARCHAR(255),
    screenshot_url VARCHAR(255), -- Single screenshot URL
    confidence_level TEXT, -- Stored as text for flexibility
    is_partially_closed BOOLEAN DEFAULT FALSE,
    profit_loss TEXT, -- Can be calculated value or text
    profit_loss_percentage TEXT, -- Percentage as text
    total_commission DECIMAL(15, 2) DEFAULT 0 CHECK (total_commission >= 0),
    is_sample BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add comments
COMMENT ON TABLE trades IS 'All trading positions (open and closed)';
COMMENT ON COLUMN trades.user_id IS 'User who owns this trade';
COMMENT ON COLUMN trades.account_id IS 'Trading account this trade belongs to';
COMMENT ON COLUMN trades.symbol IS 'Trading symbol/ticker';
COMMENT ON COLUMN trades.direction IS 'Trade direction: long or short';
COMMENT ON COLUMN trades.quantity IS 'Number of units/shares';
COMMENT ON COLUMN trades.total_quantity IS 'Total quantity across all entries';
COMMENT ON COLUMN trades.position_size IS 'Position size in account currency';
COMMENT ON COLUMN trades.total_investment IS 'Total invested amount';
COMMENT ON COLUMN trades.current_price IS 'Current/last known market price';
COMMENT ON COLUMN trades.exit_price IS 'Exit price (can be text for multiple exits)';
COMMENT ON COLUMN trades.exit_date IS 'Exit date (can be text for multiple exits)';
COMMENT ON COLUMN trades.confidence_level IS 'Confidence rating (stored as text for flexibility)';
COMMENT ON COLUMN trades.is_partially_closed IS 'True if some quantity was sold but position still open';
COMMENT ON COLUMN trades.profit_loss IS 'Realized profit/loss (can be text or number)';
COMMENT ON COLUMN trades.profit_loss_percentage IS 'Profit/loss as percentage';
COMMENT ON COLUMN trades.screenshot_url IS 'URL to trade screenshot/chart';
COMMENT ON COLUMN trades.is_sample IS 'Whether this is a sample/demo trade';

-- ───────────────────────────────────────────────────────────────────────────
-- 2.3 Trade Events Table
-- ───────────────────────────────────────────────────────────────────────────
-- Stores all events related to a trade (buy, sell, adjustments, notes)

CREATE TABLE IF NOT EXISTS trade_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trade_id UUID NOT NULL REFERENCES trades(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('buy', 'sell', 'add_quantity', 'partial_close', 'full_close', 'stop_adjustment', 'note')),
    date TIMESTAMP WITH TIME ZONE NOT NULL,
    quantity INTEGER CHECK (quantity IS NULL OR quantity > 0),
    price DECIMAL(15, 4) CHECK (price IS NULL OR price > 0),
    stop_loss_at_event DECIMAL(15, 4) CHECK (stop_loss_at_event IS NULL OR stop_loss_at_event > 0),
    notes TEXT,
    screenshot_url TEXT,
    profit_loss DECIMAL(15, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add comments
COMMENT ON TABLE trade_events IS 'Timeline of events for each trade';
COMMENT ON COLUMN trade_events.type IS 'Event type: buy, sell, add_quantity, partial_close, full_close, stop_adjustment, note';
COMMENT ON COLUMN trade_events.screenshot_url IS 'URL to chart screenshot stored in Supabase Storage';

-- ───────────────────────────────────────────────────────────────────────────
-- 2.4 Journal Entries Table
-- ───────────────────────────────────────────────────────────────────────────
-- Stores trading journal entries

CREATE TABLE IF NOT EXISTS journal_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    title TEXT,
    content TEXT NOT NULL,
    mood TEXT CHECK (mood IN ('excellent', 'good', 'neutral', 'poor', 'terrible')),
    lessons_learned TEXT,
    screenshot_urls TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add comments
COMMENT ON TABLE journal_entries IS 'Trading journal for documenting thoughts and lessons';
COMMENT ON COLUMN journal_entries.mood IS 'Trader mood/emotion for the day';
COMMENT ON COLUMN journal_entries.screenshot_urls IS 'Array of screenshot URLs';

-- ───────────────────────────────────────────────────────────────────────────
-- 2.5 Watchlist Notes Table
-- ───────────────────────────────────────────────────────────────────────────
-- Stores stocks/symbols on watchlist

CREATE TABLE IF NOT EXISTS watchlist_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    symbol TEXT NOT NULL,
    notes TEXT,
    target_price DECIMAL(15, 4) CHECK (target_price IS NULL OR target_price > 0),
    alert_price DECIMAL(15, 4) CHECK (alert_price IS NULL OR alert_price > 0),
    status TEXT DEFAULT 'watching' CHECK (status IN ('watching', 'entered', 'passed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT unique_symbol_per_user UNIQUE(user_id, symbol)
);

-- Add comments
COMMENT ON TABLE watchlist_notes IS 'Watchlist for tracking potential trades';
COMMENT ON COLUMN watchlist_notes.status IS 'watching = still monitoring, entered = traded, passed = opportunity missed';

-- ───────────────────────────────────────────────────────────────────────────
-- 2.6 Learning Materials Table
-- ───────────────────────────────────────────────────────────────────────────
-- Stores educational resources

CREATE TABLE IF NOT EXISTS learning_materials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    type TEXT CHECK (type IN ('video', 'article', 'book', 'course', 'other')),
    url TEXT,
    status TEXT DEFAULT 'to_learn' CHECK (status IN ('to_learn', 'in_progress', 'completed')),
    rating INTEGER CHECK (rating IS NULL OR (rating >= 0 AND rating <= 5)),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add comments
COMMENT ON TABLE learning_materials IS 'Educational resources and learning materials';
COMMENT ON COLUMN learning_materials.rating IS 'User rating from 0-5 stars';

-- ───────────────────────────────────────────────────────────────────────────
-- 2.7 User Preferences Table
-- ───────────────────────────────────────────────────────────────────────────
-- Stores user preferences and settings

CREATE TABLE IF NOT EXISTS user_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    language TEXT DEFAULT 'en' CHECK (language IN ('en', 'he')),
    theme TEXT DEFAULT 'light' CHECK (theme IN ('light', 'dark')),
    currency TEXT DEFAULT 'USD',
    timezone TEXT DEFAULT 'UTC',
    notifications_enabled BOOLEAN DEFAULT TRUE,
    email_notifications BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add comments
COMMENT ON TABLE user_preferences IS 'User preferences and application settings';

-- ═══════════════════════════════════════════════════════════════════════════
-- SECTION 3: Indexes for Performance
-- ═══════════════════════════════════════════════════════════════════════════

-- Accounts indexes
CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON accounts(user_id);

-- Trades indexes
CREATE INDEX IF NOT EXISTS idx_trades_account_id ON trades(account_id);
CREATE INDEX IF NOT EXISTS idx_trades_symbol ON trades(symbol);
CREATE INDEX IF NOT EXISTS idx_trades_status ON trades(status);
CREATE INDEX IF NOT EXISTS idx_trades_date_time ON trades(date_time DESC);
CREATE INDEX IF NOT EXISTS idx_trades_account_status ON trades(account_id, status);

-- Trade events indexes
CREATE INDEX IF NOT EXISTS idx_trade_events_trade_id ON trade_events(trade_id);
CREATE INDEX IF NOT EXISTS idx_trade_events_date ON trade_events(date DESC);
CREATE INDEX IF NOT EXISTS idx_trade_events_type ON trade_events(type);

-- Journal entries indexes
CREATE INDEX IF NOT EXISTS idx_journal_entries_user_id ON journal_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_journal_entries_date ON journal_entries(date DESC);

-- Watchlist notes indexes
CREATE INDEX IF NOT EXISTS idx_watchlist_notes_user_id ON watchlist_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_watchlist_notes_symbol ON watchlist_notes(symbol);
CREATE INDEX IF NOT EXISTS idx_watchlist_notes_status ON watchlist_notes(status);

-- Learning materials indexes
CREATE INDEX IF NOT EXISTS idx_learning_materials_user_id ON learning_materials(user_id);
CREATE INDEX IF NOT EXISTS idx_learning_materials_status ON learning_materials(status);
CREATE INDEX IF NOT EXISTS idx_learning_materials_type ON learning_materials(type);

-- User preferences indexes
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);

-- ═══════════════════════════════════════════════════════════════════════════
-- SECTION 4: Functions and Triggers
-- ═══════════════════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────────────────
-- 4.1 Function: Update updated_at timestamp
-- ───────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_updated_at_column() IS 'Automatically update updated_at column on row update';

-- ───────────────────────────────────────────────────────────────────────────
-- 4.2 Function: Auto-set user_id for journal entries
-- ───────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION set_user_id_journal_entries()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.user_id IS NULL THEN
        NEW.user_id := auth.uid();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION set_user_id_journal_entries() IS 'Auto-set user_id from auth context if not provided';

-- ───────────────────────────────────────────────────────────────────────────
-- 4.3 Function: Auto-set user_id for watchlist notes
-- ───────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION set_user_id_watchlist_notes()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.user_id IS NULL THEN
        NEW.user_id := auth.uid();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ───────────────────────────────────────────────────────────────────────────
-- 4.4 Function: Auto-set user_id for learning materials
-- ───────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION set_user_id_learning_materials()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.user_id IS NULL THEN
        NEW.user_id := auth.uid();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ───────────────────────────────────────────────────────────────────────────
-- 4.5 Function: Auto-set user_id for accounts
-- ───────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION set_user_id_accounts()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.user_id IS NULL THEN
        NEW.user_id := auth.uid();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ═══════════════════════════════════════════════════════════════════════════
-- SECTION 5: Triggers
-- ═══════════════════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────────────────
-- 5.1 Updated_at triggers
-- ───────────────────────────────────────────────────────────────────────────

DROP TRIGGER IF EXISTS update_accounts_updated_at ON accounts;
CREATE TRIGGER update_accounts_updated_at 
    BEFORE UPDATE ON accounts
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_trades_updated_at ON trades;
CREATE TRIGGER update_trades_updated_at 
    BEFORE UPDATE ON trades
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_trade_events_updated_at ON trade_events;
CREATE TRIGGER update_trade_events_updated_at 
    BEFORE UPDATE ON trade_events
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_journal_entries_updated_at ON journal_entries;
CREATE TRIGGER update_journal_entries_updated_at 
    BEFORE UPDATE ON journal_entries
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_watchlist_notes_updated_at ON watchlist_notes;
CREATE TRIGGER update_watchlist_notes_updated_at 
    BEFORE UPDATE ON watchlist_notes
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_learning_materials_updated_at ON learning_materials;
CREATE TRIGGER update_learning_materials_updated_at 
    BEFORE UPDATE ON learning_materials
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_preferences_updated_at ON user_preferences;
CREATE TRIGGER update_user_preferences_updated_at 
    BEFORE UPDATE ON user_preferences
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- ───────────────────────────────────────────────────────────────────────────
-- 5.2 Auto user_id triggers
-- ───────────────────────────────────────────────────────────────────────────

DROP TRIGGER IF EXISTS set_user_id_journal_entries_trigger ON journal_entries;
CREATE TRIGGER set_user_id_journal_entries_trigger
    BEFORE INSERT ON journal_entries
    FOR EACH ROW
    EXECUTE FUNCTION set_user_id_journal_entries();

DROP TRIGGER IF EXISTS set_user_id_watchlist_notes_trigger ON watchlist_notes;
CREATE TRIGGER set_user_id_watchlist_notes_trigger
    BEFORE INSERT ON watchlist_notes
    FOR EACH ROW
    EXECUTE FUNCTION set_user_id_watchlist_notes();

DROP TRIGGER IF EXISTS set_user_id_learning_materials_trigger ON learning_materials;
CREATE TRIGGER set_user_id_learning_materials_trigger
    BEFORE INSERT ON learning_materials
    FOR EACH ROW
    EXECUTE FUNCTION set_user_id_learning_materials();

DROP TRIGGER IF EXISTS set_user_id_accounts_trigger ON accounts;
CREATE TRIGGER set_user_id_accounts_trigger
    BEFORE INSERT ON accounts
    FOR EACH ROW
    EXECUTE FUNCTION set_user_id_accounts();

-- ═══════════════════════════════════════════════════════════════════════════
-- SECTION 6: Row Level Security (RLS) Policies
-- ═══════════════════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────────────────
-- 6.1 Enable RLS on all tables
-- ───────────────────────────────────────────────────────────────────────────

ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE trade_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE watchlist_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- ───────────────────────────────────────────────────────────────────────────
-- 6.2 Accounts policies
-- ───────────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Users can view their own accounts" ON accounts;
CREATE POLICY "Users can view their own accounts"
    ON accounts FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own accounts" ON accounts;
CREATE POLICY "Users can insert their own accounts"
    ON accounts FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own accounts" ON accounts;
CREATE POLICY "Users can update their own accounts"
    ON accounts FOR UPDATE
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own accounts" ON accounts;
CREATE POLICY "Users can delete their own accounts"
    ON accounts FOR DELETE
    USING (auth.uid() = user_id);

-- ───────────────────────────────────────────────────────────────────────────
-- 6.3 Trades policies
-- ───────────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Users can view trades from their accounts" ON trades;
CREATE POLICY "Users can view trades from their accounts"
    ON trades FOR SELECT
    USING (account_id IN (SELECT id FROM accounts WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can insert trades to their accounts" ON trades;
CREATE POLICY "Users can insert trades to their accounts"
    ON trades FOR INSERT
    WITH CHECK (account_id IN (SELECT id FROM accounts WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can update trades from their accounts" ON trades;
CREATE POLICY "Users can update trades from their accounts"
    ON trades FOR UPDATE
    USING (account_id IN (SELECT id FROM accounts WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can delete trades from their accounts" ON trades;
CREATE POLICY "Users can delete trades from their accounts"
    ON trades FOR DELETE
    USING (account_id IN (SELECT id FROM accounts WHERE user_id = auth.uid()));

-- ───────────────────────────────────────────────────────────────────────────
-- 6.4 Trade events policies
-- ───────────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Users can view trade events from their trades" ON trade_events;
CREATE POLICY "Users can view trade events from their trades"
    ON trade_events FOR SELECT
    USING (trade_id IN (
        SELECT t.id FROM trades t
        INNER JOIN accounts a ON t.account_id = a.id
        WHERE a.user_id = auth.uid()
    ));

DROP POLICY IF EXISTS "Users can insert trade events to their trades" ON trade_events;
CREATE POLICY "Users can insert trade events to their trades"
    ON trade_events FOR INSERT
    WITH CHECK (trade_id IN (
        SELECT t.id FROM trades t
        INNER JOIN accounts a ON t.account_id = a.id
        WHERE a.user_id = auth.uid()
    ));

DROP POLICY IF EXISTS "Users can update trade events from their trades" ON trade_events;
CREATE POLICY "Users can update trade events from their trades"
    ON trade_events FOR UPDATE
    USING (trade_id IN (
        SELECT t.id FROM trades t
        INNER JOIN accounts a ON t.account_id = a.id
        WHERE a.user_id = auth.uid()
    ));

DROP POLICY IF EXISTS "Users can delete trade events from their trades" ON trade_events;
CREATE POLICY "Users can delete trade events from their trades"
    ON trade_events FOR DELETE
    USING (trade_id IN (
        SELECT t.id FROM trades t
        INNER JOIN accounts a ON t.account_id = a.id
        WHERE a.user_id = auth.uid()
    ));

-- ───────────────────────────────────────────────────────────────────────────
-- 6.5 Journal entries policies
-- ───────────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Users can view their own journal entries" ON journal_entries;
CREATE POLICY "Users can view their own journal entries"
    ON journal_entries FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own journal entries" ON journal_entries;
CREATE POLICY "Users can insert their own journal entries"
    ON journal_entries FOR INSERT
    WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

DROP POLICY IF EXISTS "Users can update their own journal entries" ON journal_entries;
CREATE POLICY "Users can update their own journal entries"
    ON journal_entries FOR UPDATE
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own journal entries" ON journal_entries;
CREATE POLICY "Users can delete their own journal entries"
    ON journal_entries FOR DELETE
    USING (auth.uid() = user_id);

-- ───────────────────────────────────────────────────────────────────────────
-- 6.6 Watchlist notes policies
-- ───────────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Users can view their own watchlist notes" ON watchlist_notes;
CREATE POLICY "Users can view their own watchlist notes"
    ON watchlist_notes FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own watchlist notes" ON watchlist_notes;
CREATE POLICY "Users can insert their own watchlist notes"
    ON watchlist_notes FOR INSERT
    WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

DROP POLICY IF EXISTS "Users can update their own watchlist notes" ON watchlist_notes;
CREATE POLICY "Users can update their own watchlist notes"
    ON watchlist_notes FOR UPDATE
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own watchlist notes" ON watchlist_notes;
CREATE POLICY "Users can delete their own watchlist notes"
    ON watchlist_notes FOR DELETE
    USING (auth.uid() = user_id);

-- ───────────────────────────────────────────────────────────────────────────
-- 6.7 Learning materials policies
-- ───────────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Users can view their own learning materials" ON learning_materials;
CREATE POLICY "Users can view their own learning materials"
    ON learning_materials FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own learning materials" ON learning_materials;
CREATE POLICY "Users can insert their own learning materials"
    ON learning_materials FOR INSERT
    WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

DROP POLICY IF EXISTS "Users can update their own learning materials" ON learning_materials;
CREATE POLICY "Users can update their own learning materials"
    ON learning_materials FOR UPDATE
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own learning materials" ON learning_materials;
CREATE POLICY "Users can delete their own learning materials"
    ON learning_materials FOR DELETE
    USING (auth.uid() = user_id);

-- ───────────────────────────────────────────────────────────────────────────
-- 6.8 User preferences policies
-- ───────────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Users can view their own preferences" ON user_preferences;
CREATE POLICY "Users can view their own preferences"
    ON user_preferences FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own preferences" ON user_preferences;
CREATE POLICY "Users can insert their own preferences"
    ON user_preferences FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own preferences" ON user_preferences;
CREATE POLICY "Users can update their own preferences"
    ON user_preferences FOR UPDATE
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own preferences" ON user_preferences;
CREATE POLICY "Users can delete their own preferences"
    ON user_preferences FOR DELETE
    USING (auth.uid() = user_id);

-- ═══════════════════════════════════════════════════════════════════════════
-- SECTION 7: Storage Setup
-- ═══════════════════════════════════════════════════════════════════════════

-- NOTE: Storage buckets and policies MUST be created through the Supabase UI
-- SQL Editor doesn't have permissions to create storage buckets
--
-- MANUAL STEPS (Do this AFTER running this SQL):
--
-- 1. Go to Supabase Dashboard > Storage
-- 2. Click "Create a new bucket"
-- 3. Bucket name: trade-files
-- 4. Public bucket: ✓ (checked)
-- 5. Click "Create bucket"
-- 6. Click on the bucket > Policies tab
-- 7. Click "New Policy" and add these 4 policies:
--
--    Policy 1: Upload files
--    - Allowed operation: INSERT
--    - Policy definition: bucket_id = 'trade-files' AND auth.uid() IS NOT NULL
--
--    Policy 2: View files
--    - Allowed operation: SELECT
--    - Policy definition: bucket_id = 'trade-files'
--
--    Policy 3: Update files
--    - Allowed operation: UPDATE
--    - Policy definition: bucket_id = 'trade-files' AND auth.uid() IS NOT NULL
--
--    Policy 4: Delete files
--    - Allowed operation: DELETE
--    - Policy definition: bucket_id = 'trade-files' AND auth.uid() IS NOT NULL
--
-- OR use this simpler approach:
-- - Enable "Public" access on the bucket (already done in step 4)
-- - The default policies will work fine for most cases

-- ═══════════════════════════════════════════════════════════════════════════
-- SECTION 8: Useful Views (Optional but Recommended)
-- ═══════════════════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────────────────
-- 8.1 View: Active Trades Summary
-- ───────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE VIEW active_trades_summary AS
SELECT 
    a.user_id,
    a.id AS account_id,
    a.name AS account_name,
    COUNT(t.id) AS open_trades_count,
    SUM(t.position_size) AS total_position_value,
    SUM(t.risk_amount) AS total_risk_amount,
    AVG(t.confidence_level) AS avg_confidence_level
FROM accounts a
LEFT JOIN trades t ON a.id = t.account_id AND t.status = 'open'
GROUP BY a.user_id, a.id, a.name;

COMMENT ON VIEW active_trades_summary IS 'Summary of active trades per account';

-- ───────────────────────────────────────────────────────────────────────────
-- 8.2 View: Trading Performance Summary
-- ───────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE VIEW trading_performance_summary AS
SELECT 
    a.user_id,
    a.id AS account_id,
    a.name AS account_name,
    COUNT(t.id) AS total_trades,
    COUNT(CASE WHEN t.status = 'closed' AND t.profit_loss > 0 THEN 1 END) AS winning_trades,
    COUNT(CASE WHEN t.status = 'closed' AND t.profit_loss < 0 THEN 1 END) AS losing_trades,
    SUM(CASE WHEN t.status = 'closed' THEN t.profit_loss ELSE 0 END) AS total_pnl,
    ROUND(
        (COUNT(CASE WHEN t.status = 'closed' AND t.profit_loss > 0 THEN 1 END)::DECIMAL / 
        NULLIF(COUNT(CASE WHEN t.status = 'closed' THEN 1 END), 0) * 100), 2
    ) AS win_rate_percentage
FROM accounts a
LEFT JOIN trades t ON a.id = t.account_id
GROUP BY a.user_id, a.id, a.name;

COMMENT ON VIEW trading_performance_summary IS 'Overall trading performance metrics per account';

-- ═══════════════════════════════════════════════════════════════════════════
-- SECTION 9: Helper Functions for Application
-- ═══════════════════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────────────────
-- 9.1 Function: Get User's Default Account
-- ───────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION get_user_default_account()
RETURNS UUID AS $$
DECLARE
    default_account_id UUID;
BEGIN
    SELECT id INTO default_account_id
    FROM accounts
    WHERE user_id = auth.uid()
    ORDER BY created_at ASC
    LIMIT 1;
    
    RETURN default_account_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_user_default_account() IS 'Returns the first (oldest) account for the current user';

-- ═══════════════════════════════════════════════════════════════════════════
-- SECTION 10: Sample Data (Optional - for testing)
-- ═══════════════════════════════════════════════════════════════════════════

-- Note: This section is commented out by default
-- Uncomment and run only after creating your first user via the application

/*
-- Insert sample account (replace 'YOUR-USER-UUID' with actual user ID)
INSERT INTO accounts (user_id, name, account_size, default_risk_percentage, max_position_size_percentage, commission_fee, strategies)
VALUES (
    'YOUR-USER-UUID',
    'Main Trading Account',
    50000.00,
    2.0,
    25.0,
    3.00,
    ARRAY['Breakout', 'Support/Resistance', 'Trend Following']
)
ON CONFLICT DO NOTHING;

-- Insert sample trade
INSERT INTO trades (
    account_id,
    symbol,
    date_time,
    direction,
    entry_price,
    quantity,
    total_quantity,
    stop_price,
    target_price,
    risk_percentage,
    risk_amount,
    position_size,
    total_investment,
    strategy,
    confidence_level,
    status
) VALUES (
    (SELECT id FROM accounts WHERE user_id = 'YOUR-USER-UUID' LIMIT 1),
    'AAPL',
    NOW(),
    'long',
    150.00,
    100,
    100,
    147.00,
    156.00,
    2.0,
    300.00,
    15000.00,
    15000.00,
    'Breakout',
    4,
    'open'
);

-- Insert sample journal entry
INSERT INTO journal_entries (user_id, date, title, content, mood, lessons_learned)
VALUES (
    'YOUR-USER-UUID',
    CURRENT_DATE,
    'First Day of Trading',
    'Started my trading journey today. Feeling excited and ready to learn.',
    'excellent',
    'Always stick to your trading plan. Risk management is key.'
);

-- Insert sample watchlist note
INSERT INTO watchlist_notes (user_id, symbol, notes, target_price, alert_price, status)
VALUES (
    'YOUR-USER-UUID',
    'TSLA',
    'Watching for breakout above resistance at $250',
    260.00,
    250.00,
    'watching'
);

-- Insert sample learning material
INSERT INTO learning_materials (user_id, title, description, type, url, status, rating, notes)
VALUES (
    'YOUR-USER-UUID',
    'Technical Analysis Basics',
    'Introduction to chart patterns and indicators',
    'video',
    'https://youtube.com/example',
    'completed',
    5,
    'Excellent resource for beginners'
);
*/

-- ═══════════════════════════════════════════════════════════════════════════
-- SECTION 10.5: Auto-create Profile on User Signup
-- ═══════════════════════════════════════════════════════════════════════════

-- Function to automatically create a profile when a user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, preferred_language)
    VALUES (
        NEW.id,
        NEW.raw_user_meta_data->>'full_name',
        COALESCE(NEW.raw_user_meta_data->>'preferred_language', 'he')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the function when a new user is created
CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

COMMENT ON FUNCTION public.handle_new_user() IS 'Automatically creates a profile entry when a new user signs up';

-- ═══════════════════════════════════════════════════════════════════════════
-- SECTION 11: Completion Message
-- ═══════════════════════════════════════════════════════════════════════════

DO $$
BEGIN
    RAISE NOTICE '═══════════════════════════════════════════════════════════════';
    RAISE NOTICE 'TradeSmart Database Setup Complete!';
    RAISE NOTICE '═══════════════════════════════════════════════════════════════';
    RAISE NOTICE 'Created Tables:';
    RAISE NOTICE '  ✓ accounts';
    RAISE NOTICE '  ✓ trades';
    RAISE NOTICE '  ✓ trade_events';
    RAISE NOTICE '  ✓ journal_entries';
    RAISE NOTICE '  ✓ watchlist_notes';
    RAISE NOTICE '  ✓ learning_materials';
    RAISE NOTICE '  ✓ user_preferences';
    RAISE NOTICE '';
    RAISE NOTICE 'Created Security:';
    RAISE NOTICE '  ✓ Row Level Security (RLS) policies';
    RAISE NOTICE '  ✓ Auto user_id triggers';
    RAISE NOTICE '  ⚠ Storage bucket - CREATE MANUALLY (see Section 7)';
    RAISE NOTICE '';
    RAISE NOTICE 'Created Performance Features:';
    RAISE NOTICE '  ✓ Indexes on all tables';
    RAISE NOTICE '  ✓ Auto updated_at triggers';
    RAISE NOTICE '  ✓ Useful views for reporting';
    RAISE NOTICE '';
    RAISE NOTICE 'Next Steps:';
    RAISE NOTICE '  1. Verify all tables exist in Table Editor';
    RAISE NOTICE '  2. CREATE Storage bucket "trade-files" manually (see Section 7)';
    RAISE NOTICE '  3. Test by creating a user in your app';
    RAISE NOTICE '  4. Create an account and start trading!';
    RAISE NOTICE '═══════════════════════════════════════════════════════════════';
END $$;

