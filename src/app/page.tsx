'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './context/AuthContext';
import TaskManager from './TaskManager';

/**
 * Root page — protected route.
 *
 * While the Supabase session is being restored from storage we render a
 * full-screen spinner so there is no flash of the login page for returning
 * users. Once the session is known:
 *   - Authenticated → render TaskManager
 *   - Unauthenticated → redirect to /login
 */
export default function Page() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // Session still loading from localStorage — show a neutral spinner.
  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: 'var(--tm-bg)' }}
      >
        <div
          className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
          style={{ borderColor: 'var(--tm-accent)', borderTopColor: 'transparent' }}
        />
      </div>
    );
  }

  // Not authenticated — redirect to login.
  if (!user) {
    router.replace('/login');
    return null;
  }

  // Authenticated — render the app.
  return <TaskManager />;
}
