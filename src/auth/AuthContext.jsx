import { AuthProvider as SharedAuthProvider, useAuth as useSharedAuth } from '@santonastaso/shared';
import { supabase } from '../services/supabase/client';

/**
 * Tracc-specific AuthProvider wrapper
 * Uses the shared AuthProvider with tracc's Supabase client
 */
export const AuthProvider = ({ children }) => {
  return (
    <SharedAuthProvider supabaseClient={supabase}>
      {children}
    </SharedAuthProvider>
  );
};

/**
 * Re-export the shared useAuth hook
 */
export const useAuth = useSharedAuth;