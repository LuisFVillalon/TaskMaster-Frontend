'use client';

/**
 * OAuth + email-confirmation callback — /auth/callback
 *
 * Supabase redirects here after:
 *   1. Google OAuth completes
 *   2. The user clicks their email-confirmation link
 *
 * After the session is established we call /claim-data before redirecting so
 * any pre-existing orphaned rows (user_id = NULL) are linked to this account.
 * The call is idempotent — already-owned rows are never touched.
 */

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/app/lib/supabase';
import { claimOrphanedData } from '@/app/lib/backend-api';

async function claimAndRedirect(router: ReturnType<typeof useRouter>) {
  await claimOrphanedData();
  router.replace('/');
}

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        claimAndRedirect(router);
      } else {
        // Session not ready yet — wait for the Supabase client to process the
        // callback URL fragment/code and fire onAuthStateChange.
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          (_event, session) => {
            if (session) {
              subscription.unsubscribe();
              claimAndRedirect(router);
            }
          },
        );
      }
    });
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--tm-bg)' }}>
      <div className="text-center">
        <div
          className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin mx-auto mb-3"
          style={{ borderColor: 'var(--tm-accent)', borderTopColor: 'transparent' }}
        />
        <p className="text-sm" style={{ color: 'var(--tm-text-muted)' }}>Signing you in…</p>
      </div>
    </div>
  );
}
