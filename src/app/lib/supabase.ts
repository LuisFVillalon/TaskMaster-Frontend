import { createClient } from '@supabase/supabase-js';

const supabaseUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * Singleton Supabase browser client.
 *
 * Used for:
 *   - Auth (sign-up, sign-in, sign-out, Google OAuth, session management)
 *   - Retrieving the current session JWT to send to FastAPI
 *
 * NOT used for direct database queries — all data goes through the FastAPI backend.
 *
 * Required env vars (add to .env.local):
 *   NEXT_PUBLIC_SUPABASE_URL       — Supabase project URL
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY  — Supabase anon/public key
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Persist the session in localStorage so it survives page refreshes.
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,   // required for OAuth redirect callback
  },
});
