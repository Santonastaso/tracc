import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { SupabaseClient, User, Session } from '@supabase/supabase-js';

/**
 * Authentication context type
 */
export interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (email: string, password: string, metadata?: any) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error?: string }>;
}

/**
 * Authentication context
 */
const AuthContext = createContext<AuthContextType | null>(null);

/**
 * Props for AuthProvider
 */
export interface AuthProviderProps {
  children: ReactNode;
  supabaseClient: SupabaseClient;
  onAuthStateChange?: (user: User | null, session: Session | null) => void;
}

/**
 * Unified AuthProvider component
 * Works with any Supabase client and provides consistent auth interface
 */
export const AuthProvider: React.FC<AuthProviderProps> = ({
  children,
  supabaseClient,
  onAuthStateChange
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize authentication state
  useEffect(() => {
    const getInitialSession = async () => {
      try {
        const { data: { session: initialSession }, error } = await supabaseClient.auth.getSession();
        
        if (error) {
          setError('Failed to initialize authentication');
        } else {
          setSession(initialSession);
          setUser(initialSession?.user ?? null);
          onAuthStateChange?.(initialSession?.user ?? null, initialSession);
        }
      } catch (err) {
        setError('Authentication initialization failed');
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabaseClient.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setError(null);
        onAuthStateChange?.(session?.user ?? null, session);
        
        if (event === 'SIGNED_OUT') {
          setLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [supabaseClient, onAuthStateChange]);

  /**
   * Sign in with email and password
   */
  const signIn = async (email: string, password: string) => {
    try {
      setError(null);
      const { error } = await supabaseClient.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError(error.message);
        return { error: error.message };
      }

      return {};
    } catch (err: any) {
      const errorMessage = 'Sign in failed';
      setError(errorMessage);
      return { error: errorMessage };
    }
  };

  /**
   * Sign up with email and password
   */
  const signUp = async (email: string, password: string, metadata?: any) => {
    try {
      setError(null);
      const { error } = await supabaseClient.auth.signUp({
        email,
        password,
        options: {
          data: metadata
        }
      });

      if (error) {
        setError(error.message);
        return { error: error.message };
      }

      return {};
    } catch (err: any) {
      const errorMessage = 'Sign up failed';
      setError(errorMessage);
      return { error: errorMessage };
    }
  };

  /**
   * Sign out
   */
  const signOut = async () => {
    try {
      setError(null);
      await supabaseClient.auth.signOut();
    } catch (err: any) {
      setError('Sign out failed');
    }
  };

  /**
   * Reset password
   */
  const resetPassword = async (email: string) => {
    try {
      setError(null);
      const { error } = await supabaseClient.auth.resetPasswordForEmail(email);

      if (error) {
        setError(error.message);
        return { error: error.message };
      }

      return {};
    } catch (err: any) {
      const errorMessage = 'Password reset failed';
      setError(errorMessage);
      return { error: errorMessage };
    }
  };

  const value: AuthContextType = {
    user,
    session,
    loading,
    error,
    signIn,
    signUp,
    signOut,
    resetPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/**
 * Hook to use authentication context
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
