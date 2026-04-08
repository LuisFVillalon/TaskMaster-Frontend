'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import type { Session, User, AuthError } from '@supabase/supabase-js';
import { supabase } from '@/app/lib/supabase';

// ── Types ─────────────────────────────────────────────────────────────────────

interface AuthContextValue {
  /** The currently authenticated user, or null when logged out. */
  user: User | null;
  /** The full session object — contains the access_token (JWT) for API calls. */
  session: Session | null;
  /** True while the initial session is being restored from storage. */
  loading: boolean;

  signUpWithEmail: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signInWithEmail: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signInWithGoogle: () => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;

  /**
   * Returns the current JWT access token (refreshed automatically by the
   * Supabase client). Pass this as the Bearer token to FastAPI.
   */
  getAccessToken: () => Promise<string | null>;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Returns the canonical base URL for OAuth redirect URIs, always with a
 * trailing slash so callers can safely append path segments.
 *
 * Resolution order:
 *  1. NEXT_PUBLIC_SITE_URL       — explicit canonical URL set in Vercel env
 *                                   vars (e.g. https://task-master-mvp.vercel.app).
 *                                   Set this once in Vercel → Settings → Environment
 *                                   Variables for the Production environment.
 *  2. NEXT_PUBLIC_VERCEL_URL     — automatically injected by Vercel for every
 *                                   deployment. Does NOT include the protocol,
 *                                   so we prepend https://.
 *  3. window.location.origin     — correct for localhost in development and
 *                                   for any other environment not covered above.
 */
function getURL(): string {
  let url: string =
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.NEXT_PUBLIC_VERCEL_URL ??
    window.location.origin;

  // NEXT_PUBLIC_VERCEL_URL is protocol-less (e.g. "abc-123.vercel.app").
  if (!url.includes('http')) url = `https://${url}`;

  // Normalise to always have a trailing slash.
  if (!url.endsWith('/')) url = `${url}/`;

  return url;
}

// ── Context ───────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null);

// ── Provider ──────────────────────────────────────────────────────────────────

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser]       = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Restore session on mount (handles OAuth redirect callbacks too).
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // 2. Subscribe to auth state changes (login, logout, token refresh).
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      },
    );

    return () => subscription.unsubscribe();
  }, []);

  const signUpWithEmail = useCallback(
    async (email: string, password: string) => {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          // Supabase embeds this URL in the confirmation email.
          // Without it the dashboard's "Site URL" is used, which may point to
          // production even when running locally.
          emailRedirectTo: `${getURL()}auth/callback`,
        },
      });
      return { error };
    },
    [],
  );

  const signInWithEmail = useCallback(
    async (email: string, password: string) => {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      return { error };
    },
    [],
  );

  const signInWithGoogle = useCallback(async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        // After Google redirects back, Supabase handles the token exchange
        // and then forwards the user to this URL.
        redirectTo: `${getURL()}auth/callback`,
        queryParams: {
          // Request a refresh token so the session survives page reloads.
          // 'consent' forces the Google screen to always appear — this is
          // what produces a clean PKCE ?code= redirect instead of the
          // implicit #access_token= hash that can confuse the callback page.
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });
    return { error };
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const getAccessToken = useCallback(async (): Promise<string | null> => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token ?? null;
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        signUpWithEmail,
        signInWithEmail,
        signInWithGoogle,
        signOut,
        getAccessToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside <AuthProvider>');
  }
  return ctx;
}
