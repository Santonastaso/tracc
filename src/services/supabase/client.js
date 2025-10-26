import { createSupabaseClient, handleSupabaseError as sharedHandleSupabaseError, checkSupabaseConnection as sharedCheckSupabaseConnection } from '@andrea/shared-utils';

// Supabase configuration from environment variables
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate required environment variables
if (!SUPABASE_URL) {
  throw new Error('Missing VITE_SUPABASE_URL environment variable');
}
if (!SUPABASE_ANON_KEY) {
  throw new Error('Missing VITE_SUPABASE_ANON_KEY environment variable');
}

// Create and export the Supabase client using shared utilities
export const supabase = createSupabaseClient({
  url: SUPABASE_URL,
  anonKey: SUPABASE_ANON_KEY
});

// Re-export shared utilities for backward compatibility
export const handleSupabaseError = sharedHandleSupabaseError;

/**
 * Check if Supabase connection is working (tracc-specific)
 */
export const checkSupabaseConnection = async () => {
  return sharedCheckSupabaseConnection(supabase, 'silos');
};

export default supabase;
