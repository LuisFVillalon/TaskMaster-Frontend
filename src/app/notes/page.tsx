'use client';

import React, { Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';
import NotesView from '@/app/components/notes/NotesView';

/**
 * /notes route — protected by Supabase JWT via AuthContext.
 *
 * Mirrors the same auth guard used by the root page.tsx: redirect unauthenticated
 * visitors to /login rather than showing the legacy PasswordAuth gate.
 */
export default function NotesPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--tm-bg)' }}>
        <div
          className="w-10 h-10 border-4 border-t-transparent rounded-full animate-spin"
          style={{ borderColor: 'var(--tm-accent)', borderTopColor: 'transparent' }}
        />
      </div>
    );
  }

  if (!user) {
    router.replace('/login');
    return null;
  }

  return (
    <Suspense>
      <NotesView />
    </Suspense>
  );
}
