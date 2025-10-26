import { createSupabaseClient, handleSupabaseError as sharedHandleSupabaseError, checkSupabaseConnection as sharedCheckSupabaseConnection } from '@andrea/shared-utils';

// Supabase configuration for tracc project
const SUPABASE_URL = 'https://odlymzidujfrvufeocsz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9kbHltemlkdWpmcnZ1ZmVvY3N6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU4NDIyNzYsImV4cCI6MjA3MTQxODI3Nn0.tfugegm1hUJnaF0QjqlOmGKdTXQshGBxeW7bBf2iQNA';

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
