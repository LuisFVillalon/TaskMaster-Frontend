'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/app/context/AuthContext';
import { claimOrphanedData } from '@/app/lib/backend-api';
import GoogleLogo from '@/app/components/GoogleLogo';

export default function LoginPage() {
  const { signInWithEmail, signInWithGoogle } = useAuth();
  const router = useRouter();

  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState<string | null>(null);
  const [loading, setLoading]   = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await signInWithEmail(email, password);
    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      // Fire claim-data on every login. Idempotent — already-owned rows are
      // never touched; this is the safety net for accounts that signed up
      // before the claim flow was wired correctly.
      await claimOrphanedData();
      router.replace('/');
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    setGoogleLoading(true);
    const { error } = await signInWithGoogle();
    // On success, the browser navigates away to Google — no need to set loading=false.
    if (error) {
      setGoogleLoading(false);
      setError(error.message);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ backgroundColor: 'var(--tm-bg)' }}
    >
      <div
        className="w-full max-w-sm rounded-2xl border p-8 shadow-sm"
        style={{ backgroundColor: 'var(--tm-surface)', borderColor: 'var(--tm-border)' }}
      >
        {/* Logo / title */}
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-text-primary">Welcome back</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--tm-text-muted)' }}>
            Sign in to your Promptly account
          </p>
        </div>

        {/* Google Sign-In — official branding: white button, Google logo, "Sign in with Google" */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={googleLoading}
          className="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all hover:shadow-sm active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed mb-5"
          style={{
            backgroundColor: '#ffffff',
            borderColor: '#dadce0',
            color: '#3c4043',
            fontFamily: "'Roboto', sans-serif",
          }}
        >
          {googleLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" style={{ color: '#4285F4' }} />
          ) : (
            <GoogleLogo />
          )}
          Sign in with Google
        </button>

        {/* Divider */}
        <div className="flex items-center gap-3 mb-5">
          <div className="flex-1 h-px" style={{ backgroundColor: 'var(--tm-border)' }} />
          <span className="text-xs" style={{ color: 'var(--tm-text-muted)' }}>or</span>
          <div className="flex-1 h-px" style={{ backgroundColor: 'var(--tm-border)' }} />
        </div>

        {/* Email / password form */}
        <form onSubmit={handleEmailLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-xl border px-3 py-2.5 text-sm bg-transparent text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 transition-all"
              style={{
                borderColor: 'var(--tm-border)',
                '--tw-ring-color': 'var(--tm-accent)',
              } as React.CSSProperties}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-medium text-text-primary" htmlFor="password">
                Password
              </label>
            </div>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-xl border px-3 py-2.5 text-sm bg-transparent text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 transition-all"
              style={{
                borderColor: 'var(--tm-border)',
                '--tw-ring-color': 'var(--tm-accent)',
              } as React.CSSProperties}
            />
          </div>

          {error && (
            <p className="text-sm rounded-xl px-3 py-2" style={{ color: 'var(--tm-danger)', backgroundColor: 'var(--tm-danger-subtle, #fee2e2)' }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            style={{ backgroundColor: 'var(--tm-accent)', color: 'var(--tm-accent-text)' }}
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Sign in
          </button>
        </form>

        {/* Footer */}
        <p className="text-sm text-center mt-6" style={{ color: 'var(--tm-text-muted)' }}>
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="font-medium hover:underline" style={{ color: 'var(--tm-accent)' }}>
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
