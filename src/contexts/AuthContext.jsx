import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '@/api/entities';
import { supabase } from '@/api/supabaseClient';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);

  useEffect(() => {
    // Check active sessions and sets the user
    const initializeAuth = async () => {
      try {
        console.log('🔐 Initializing auth...');
        
        // Add timeout to prevent hanging
        const timeout = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Auth timeout')), 5000)
        );
        
        const sessionPromise = User.getSession();
        const currentSession = await Promise.race([sessionPromise, timeout]).catch(err => {
          console.warn('⚠️ Session check timeout, continuing without session');
          return null;
        });
        
        console.log('📋 Session:', currentSession ? 'Found' : 'None');
        setSession(currentSession);
        
        if (currentSession) {
          const currentUser = await User.getCurrentUser();
          console.log('👤 User:', currentUser?.email || 'None');
          setUser(currentUser);
        }
      } catch (error) {
        console.error('❌ Error initializing auth:', error);
      } finally {
        console.log('✅ Auth initialization complete');
        setLoading(false);
      }
    };

    initializeAuth();

    // Listen for changes on auth state (sign in, sign out, etc.)
    const { data: { subscription } } = User.onAuthStateChange(async (event, currentSession) => {
      setSession(currentSession);
      
      if (currentSession) {
        const currentUser = await User.getCurrentUser();
        setUser(currentUser);
      } else {
        setUser(null);
      }
      
      setLoading(false);
    });

    return () => subscription?.unsubscribe();
  }, []);

  const signUp = async (email, password, metadata = {}) => {
    try {
      const data = await User.signUp(email, password, metadata);
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  };

  const signIn = async (email, password) => {
    try {
      const data = await User.signIn(email, password);
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  };

  const signOut = async () => {
    try {
      await User.signOut();
      setUser(null);
      setSession(null);
      localStorage.removeItem('currentAccountId');
      return { error: null };
    } catch (error) {
      return { error };
    }
  };

  const resetPassword = async (email) => {
    try {
      await User.resetPassword(email);
      return { error: null };
    } catch (error) {
      return { error };
    }
  };

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    resetPassword,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

