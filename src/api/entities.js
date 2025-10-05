import { createEntity, auth as supabaseAuth } from './supabaseClient';

// Define all entities using the Supabase client
export const Trade = createEntity('trades');
export const JournalEntry = createEntity('journal_entries');
export const WatchlistNote = createEntity('watchlist_notes');
export const Account = createEntity('accounts');
export const TradeEvent = createEntity('trade_events');
export const LearningMaterial = createEntity('learning_materials');
export const UserPreferences = createEntity('user_preferences');

// Export auth
export const User = supabaseAuth;
