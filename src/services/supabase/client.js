import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error(
    'Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. Copy .env.example to .env and fill in values.'
  );
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

export function handleSupabaseError(error) {
  if (error?.code === '23505') return 'This record already exists';
  if (error?.code === '23503') return 'Cannot perform this operation due to related records';
  if (error?.code === 'PGRST116') return 'No records found';
  if (error?.message?.includes('JWT')) return 'Authentication error. Please refresh the page';
  return error?.message || 'An unexpected error occurred';
}

export async function checkSupabaseConnection(testTable = 'silos') {
  try {
    const { error } = await supabase.from(testTable).select('count').limit(1);
    return !error;
  } catch {
    return false;
  }
}

export default supabase;
