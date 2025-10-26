import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Unified Supabase client factory
 * Supports both environment variables and direct configuration
 */
export interface SupabaseConfig {
  url: string;
  anonKey: string;
  options?: {
    auth?: {
      persistSession?: boolean;
      autoRefreshToken?: boolean;
    };
    realtime?: {
      params?: {
        eventsPerSecond?: number;
      };
    };
  };
}

/**
 * Create a Supabase client with unified configuration
 */
export const createSupabaseClient = (config: SupabaseConfig): SupabaseClient => {
  const defaultOptions = {
    auth: {
      persistSession: true,
      autoRefreshToken: true
    },
    realtime: {
      params: {
        eventsPerSecond: 10
      }
    }
  };

  return createClient(config.url, config.anonKey, {
    ...defaultOptions,
    ...config.options
  });
};

/**
 * Create Supabase client from environment variables
 * Note: This function should be used in the consuming application, not in the package
 */
export const createSupabaseFromEnv = (): SupabaseClient => {
  // Use globalThis to access import.meta in a way that works across environments
  const env = (globalThis as any).importMeta?.env || (typeof window !== 'undefined' ? (window as any).env : {});
  const url = env.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const anonKey = env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

  if (!url) {
    throw new Error('Missing VITE_SUPABASE_URL environment variable');
  }
  if (!anonKey) {
    throw new Error('Missing VITE_SUPABASE_ANON_KEY environment variable');
  }

  return createSupabaseClient({ url, anonKey });
};

/**
 * Handle Supabase errors with user-friendly messages
 */
export const handleSupabaseError = (error: any, context = ''): string => {
  // User-friendly error messages
  if (error.code === '23505') {
    return 'This record already exists';
  } else if (error.code === '23503') {
    return 'Cannot perform this operation due to related records';
  } else if (error.code === 'PGRST116') {
    return 'No records found';
  } else if (error.message?.includes('JWT')) {
    return 'Authentication error. Please refresh the page';
  }
  
  return error.message || 'An unexpected error occurred';
};

/**
 * Check if Supabase connection is working
 */
export const checkSupabaseConnection = async (
  client: SupabaseClient, 
  testTable = 'users'
): Promise<boolean> => {
  try {
    const { error } = await client
      .from(testTable)
      .select('count')
      .limit(1);
      
    return !error;
  } catch (error) {
    return false;
  }
};
