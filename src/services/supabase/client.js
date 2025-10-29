// Standardized Supabase client using shared package
import { createSupabaseClient, handleSupabaseError as sharedHandleSupabaseError, checkSupabaseConnection as sharedCheckSupabaseConnection } from '@santonastaso/shared';

// Real Supabase client with tracc credentials
export const supabase = createSupabaseClient({
  url: 'https://odlymzidujfrvufeocsz.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9kbHltemlkdWpmcnZ1ZmVvY3N6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU4NDIyNzYsImV4cCI6MjA3MTQxODI3Nn0.tfugegm1hUJnaF0QjqlOmGKdTXQshGBxeW7bBf2iQNA'
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
