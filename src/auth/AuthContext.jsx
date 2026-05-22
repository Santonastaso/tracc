import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const getInitialSession = async () => {
      try {
        const { data: { session: initialSession }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) {
          setError('Failed to initialize authentication');
        } else {
          setSession(initialSession);
          setUser(initialSession?.user ?? null);
        }
      } catch {
        setError('Authentication initialization failed');
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      setError(null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email, password) => {
    try {
      setError(null);
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) {
        setError(signInError.message);
        return { error: signInError.message };
      }
      return {};
    } catch {
      const msg = 'Sign in failed';
      setError(msg);
      return { error: msg };
    }
  };

  const signUp = async (email, password, metadata) => {
    try {
      setError(null);
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: metadata },
      });
      if (signUpError) {
        setError(signUpError.message);
        return { error: signUpError.message };
      }
      return {};
    } catch {
      const msg = 'Sign up failed';
      setError(msg);
      return { error: msg };
    }
  };

  const signOut = async () => {
    try {
      setError(null);
      await supabase.auth.signOut();
    } catch {
      setError('Sign out failed');
    }
  };

  const resetPassword = async (email) => {
    try {
      setError(null);
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email);
      if (resetError) {
        setError(resetError.message);
        return { error: resetError.message };
      }
      return {};
    } catch {
      const msg = 'Password reset failed';
      setError(msg);
      return { error: msg };
    }
  };

  const value = {
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
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
