import { createClient } from '@supabase/supabase-js';

// Get environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials not found. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file');
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
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata
      }
    });
    
    if (error) throw error;
    return data;
  },

  // Sign in with email and password
  async signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) throw error;
    return data;
  },

  // Sign out
  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  // Get current user
  async getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    return user;
  },

  // Get current session
  async getSession() {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) throw error;
    return session;
  },

  // Listen to auth state changes
  onAuthStateChange(callback) {
    return supabase.auth.onAuthStateChange(callback);
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


