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
  const [loading, setLoading] = useState(false); // Start with false - don't block the app!
  const [session, setSession] = useState(null);

  useEffect(() => {
    console.log('🔐 Initializing AuthContext...');
    
    // Check active sessions in the background (doesn't block UI)
    const initializeAuth = async () => {
      try {
        console.log('📍 Checking for existing session...');
        const currentSession = await User.getSession();
        
        if (currentSession) {
          console.log('✅ Session found:', currentSession.user?.email);
          setSession(currentSession);
          try {
            const currentUser = await User.getCurrentUser();
            setUser(currentUser);
          } catch (error) {
            console.warn('⚠️ Failed to get current user during init:', error);
            setUser(currentSession.user ?? null);
          }
        } else {
          console.log('ℹ️ No existing session');
          setUser(null);
        }
      } catch (error) {
        console.error('❌ Auth initialization error:', error);
      }
    };

    initializeAuth();

    // Listen for changes on auth state (sign in, sign out, etc.)
    console.log('👂 Setting up auth state listener...');
    const { data: { subscription } } = User.onAuthStateChange(async (event, currentSession) => {
      console.log('🔥 Auth event:', event, 'Session:', currentSession?.user?.email || 'none');
      
      if (event === 'SIGNED_IN') {
        console.log('✅ User signed in:', currentSession?.user?.email);
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
      } else if (event === 'INITIAL_SESSION') {
        console.log('🔷 Initial session loaded:', currentSession?.user?.email);
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
      } else if (event === 'SIGNED_OUT') {
        console.warn('⚠️ User signed out - Stack trace:');
        console.trace(); // Shows where this was called from
        setSession(null);
        setUser(null);
        localStorage.removeItem('currentAccountId');
      } else if (event === 'TOKEN_REFRESHED') {
        console.log('🔄 Token refreshed for:', currentSession?.user?.email);
        setSession(currentSession);
        // Keep existing user - just refresh session
      } else if (event === 'USER_UPDATED') {
        console.log('👤 User updated:', currentSession?.user?.email);
        setSession(currentSession);
        try {
          const currentUser = await User.getCurrentUser();
          setUser(currentUser);
        } catch (error) {
          console.warn('⚠️ Failed to get current user after update:', error);
          setUser(currentSession?.user ?? null);
        }
      } else if (event === 'PASSWORD_RECOVERY') {
        console.log('🔑 Password recovery');
        setSession(currentSession);
      } else {
        console.log('❓ Unknown auth event:', event);
        // For any other event, only update session if it exists
        if (currentSession) {
          setSession(currentSession);
          const currentUser = await User.getCurrentUser();
          setUser(currentUser);
        }
      }
      
      setLoading(false);
    });

    return () => {
      console.log('🧹 Cleaning up auth listener');
      subscription?.unsubscribe();
    };
  }, []);

  const signUp = async (email, password, metadata = {}) => {
    try {
      // User.signUp already returns { data, error }
      const response = await User.signUp(email, password, metadata);
      return response;
    } catch (error) {
      return { data: null, error };
    }
  };

  const signIn = async (email, password) => {
    try {
      // User.signIn already returns { data, error }
      const response = await User.signIn(email, password);
      return response;
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

