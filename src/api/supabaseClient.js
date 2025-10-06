import { createClient } from '@supabase/supabase-js';

// Get environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Debug logging
console.log('🔧 Supabase Config Check:');
console.log('URL exists:', !!supabaseUrl);
console.log('Key exists:', !!supabaseAnonKey);
if (supabaseUrl) {
  console.log('URL preview:', supabaseUrl.substring(0, 30) + '...');
}

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ SUPABASE CREDENTIALS MISSING!');
  console.error('Please set the following environment variables in Vercel:');
  console.error('- VITE_SUPABASE_URL');
  console.error('- VITE_SUPABASE_ANON_KEY');
  console.error('Current values:', { supabaseUrl, supabaseAnonKey });
  
  // Show error to user
  if (typeof document !== 'undefined') {
    document.body.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: center; height: 100vh; font-family: system-ui; direction: rtl; text-align: center; padding: 20px; background: #f5f5f5;">
        <div style="max-width: 600px; background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <h1 style="color: #dc2626; margin-bottom: 20px;">⚠️ שגיאת הגדרות</h1>
          <p style="font-size: 18px; margin-bottom: 20px;">משתני הסביבה של Supabase לא מוגדרים ב-Vercel</p>
          <p style="color: #666; margin-bottom: 10px;">נדרש להגדיר:</p>
          <ul style="list-style: none; padding: 0; background: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <li style="margin: 10px 0;">✓ VITE_SUPABASE_URL</li>
            <li style="margin: 10px 0;">✓ VITE_SUPABASE_ANON_KEY</li>
          </ul>
          <p style="color: #666;">
            עבור למדריך: 
            <a href="https://github.com/ZyrticX/TradeSmart1/blob/main/🔧_QUICK_FIX_INSTRUCTIONS.md" target="_blank" style="color: #A020F0;">
              הוראות תיקון
            </a>
          </p>
        </div>
      </div>
    `;
  }
}

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  }
});

// Helper function to create a base entity with CRUD operations
export const createEntity = (tableName) => {
  return {
    // Get a single record by ID
    async get(id) {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data;
    },

    // Get all records
    async getAll(orderBy = 'created_at') {
      const isDescending = orderBy.startsWith('-');
      const column = isDescending ? orderBy.substring(1) : orderBy;
      
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .order(column, { ascending: !isDescending });
      
      if (error) throw error;
      return data;
    },

    // Alias for getAll (for backward compatibility)
    async list(orderBy = 'created_at') {
      return this.getAll(orderBy);
    },

    // Filter records with optional ordering
    async filter(filters = {}, orderBy = 'created_at') {
      const isDescending = orderBy.startsWith('-');
      const column = isDescending ? orderBy.substring(1) : orderBy;
      
      let query = supabase.from(tableName).select('*');
      
      // Apply filters
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          query = query.eq(key, value);
        }
      });
      
      // Apply ordering
      query = query.order(column, { ascending: !isDescending });
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data;
    },

    // Create a new record
    async create(data) {
      const { data: result, error } = await supabase
        .from(tableName)
        .insert(data)
        .select()
        .single();
      
      if (error) throw error;
      return result;
    },

    // Update a record by ID
    async update(id, data) {
      const { data: result, error } = await supabase
        .from(tableName)
        .update(data)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return result;
    },

    // Delete a record by ID
    async delete(id) {
      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return true;
    }
  };
};

// Auth helper functions
export const auth = {
  // Sign up with email and password
  async signUp(email, password, metadata = {}) {
    console.log('📝 Attempting signup...');
    
    if (!supabase || !supabase.auth) {
      console.error('❌ Supabase client not initialized!');
      throw new Error('Supabase is not configured. Please check your environment variables.');
    }
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata
        }
      });
      
      if (error) {
        console.error('❌ Signup error:', error.message);
        throw error;
      }
      
      console.log('✅ Signup successful!');
      return data;
    } catch (err) {
      console.error('❌ Signup exception:', err);
      throw err;
    }
  },

  // Sign in with email and password
  async signIn(email, password) {
    console.log('🔐 Attempting Supabase login...');
    console.log('📍 Supabase URL:', supabaseUrl);
    console.log('🔑 Using key:', supabaseAnonKey?.substring(0, 20) + '...');
    
    if (!supabase || !supabase.auth) {
      console.error('❌ Supabase client not initialized!');
      throw new Error('Supabase client is not initialized');
    }
    
    try {
      console.log('📡 Calling signInWithPassword...');
      const response = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      console.log('📥 Raw response:', response);
      
      if (response.error) {
        console.error('❌ Supabase error:', response.error);
        throw response.error;
      }
      
      console.log('✅ Login successful!', response.data);
      return response;
    } catch (err) {
      console.error('❌ Login exception:', err);
      throw err;
    }
  },

  // Sign out
  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  // Get current user
  async getCurrentUser() {
    try {
      if (!supabase || !supabase.auth) {
        console.warn('Supabase client not initialized');
        return null;
      }
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) {
        console.error('getCurrentUser error:', error);
        return null;
      }
      return user;
    } catch (err) {
      console.error('getCurrentUser exception:', err);
      return null;
    }
  },

  // Get current session
  async getSession() {
    try {
      if (!supabase || !supabase.auth) {
        console.warn('Supabase client not initialized');
        return null;
      }
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) {
        console.error('getSession error:', error);
        return null;
      }
      return session;
    } catch (err) {
      console.error('getSession exception:', err);
      return null;
    }
  },

  // Listen to auth state changes
  onAuthStateChange(callback) {
    try {
      if (!supabase || !supabase.auth) {
        console.warn('Supabase client not initialized for onAuthStateChange');
        return { data: { subscription: { unsubscribe: () => {} } } };
      }
      return supabase.auth.onAuthStateChange(callback);
    } catch (err) {
      console.error('onAuthStateChange exception:', err);
      return { data: { subscription: { unsubscribe: () => {} } } };
    }
  },

  // Reset password
  async resetPassword(email) {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) throw error;
  },

  // Update user
  async updateUser(updates) {
    const { data, error } = await supabase.auth.updateUser(updates);
    if (error) throw error;
    return data;
  }
};


