import { createSupabaseClient, handleSupabaseError as sharedHandleSupabaseError, checkSupabaseConnection as sharedCheckSupabaseConnection } from '@santonastaso/shared';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error(
    'Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. Copy .env.example to .env and fill in values.'
  );
}

export const supabase = createSupabaseClient({
  url: SUPABASE_URL,
  anonKey: SUPABASE_ANON_KEY
});

// Re-export shared utilities with local aliases
export const handleSupabaseError = sharedHandleSupabaseError;

/**
 * Check if Supabase connection is working (tracc-specific)
 */
export const checkSupabaseConnection = async () => {
  return sharedCheckSupabaseConnection(supabase, 'silos');
};

export default supabase;
