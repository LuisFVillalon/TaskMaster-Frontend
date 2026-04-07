'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CheckCircle, Loader2 } from 'lucide-react';
import { useAuth } from '@/app/context/AuthContext';
import { claimOrphanedData } from '@/app/lib/backend-api';
import { validatePassword, MIN_LENGTH } from '@/app/lib/passwordValidation';
import PasswordStrengthMeter from '@/app/components/PasswordStrengthMeter';
import GoogleLogo from '@/app/components/GoogleLogo';

export default function SignupPage() {
  const { signUpWithEmail, signInWithGoogle, getAccessToken } = useAuth();
  const router = useRouter();

  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm]   = useState('');
  const [error, setError]       = useState<string | null>(null);
  const [loading, setLoading]   = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(false); // email-confirm flow

  // Real-time password strength — recalculated whenever the password changes.
  const pwCheck = useMemo(
    () => (password ? validatePassword(password, email) : null),
    [password, email],
  );

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    if (!pwCheck?.ok) {
      setError(pwCheck?.errors[0] ?? `Password must be at least ${MIN_LENGTH} characters.`);
      return;
    }

    setLoading(true);
    const { error } = await signUpWithEmail(email, password);
    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    // Supabase sends a confirmation email by default.
    // If auto-confirm is enabled in Supabase the user is immediately signed in
    // — claim data and redirect. Otherwise show the "check your inbox" state;
    // claim will fire in /auth/callback when the user clicks the confirm link.
    const token = await getAccessToken();
    if (token) {
      await claimOrphanedData();
      router.replace('/');
    } else {
      setConfirmed(true);
    }
  };

  const handleGoogleSignup = async () => {
    setError(null);
    setGoogleLoading(true);
    const { error } = await signInWithGoogle();
    if (error) {
      setGoogleLoading(false);
      setError(error.message);
    }
    // On success the browser navigates to Google — /auth/callback handles the rest.
  };

  // ── Email confirmation pending ─────────────────────────────────────────────
  if (confirmed) {
    return (
      <div
        className="min-h-screen flex items-center justify-center px-4"
        style={{ backgroundColor: 'var(--tm-bg)' }}
      >
        <div
          className="w-full max-w-sm rounded-2xl border p-8 shadow-sm text-center"
          style={{ backgroundColor: 'var(--tm-surface)', borderColor: 'var(--tm-border)' }}
        >
          <CheckCircle className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--tm-success)' }} />
          <h2 className="text-xl font-bold text-text-primary mb-2">Check your email</h2>
          <p className="text-sm" style={{ color: 'var(--tm-text-muted)' }}>
            We sent a confirmation link to <strong>{email}</strong>.
            Click it to activate your account, then{' '}
            <Link href="/login" className="font-medium hover:underline" style={{ color: 'var(--tm-accent)' }}>
              sign in
            </Link>.
          </p>
        </div>
      </div>
    );
  }

  // ── Sign-up form ───────────────────────────────────────────────────────────
  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ backgroundColor: 'var(--tm-bg)' }}
    >
      <div
        className="w-full max-w-sm rounded-2xl border p-8 shadow-sm"
        style={{ backgroundColor: 'var(--tm-surface)', borderColor: 'var(--tm-border)' }}
      >
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-text-primary">Create an account</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--tm-text-muted)' }}>
            Start managing your tasks with Promptly
          </p>
        </div>

        {/* Google */}
        <button
          type="button"
          onClick={handleGoogleSignup}
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
          Sign up with Google
        </button>

        {/* Divider */}
        <div className="flex items-center gap-3 mb-5">
          <div className="flex-1 h-px" style={{ backgroundColor: 'var(--tm-border)' }} />
          <span className="text-xs" style={{ color: 'var(--tm-text-muted)' }}>or</span>
          <div className="flex-1 h-px" style={{ backgroundColor: 'var(--tm-border)' }} />
        </div>

        {/* Email form */}
        <form onSubmit={handleEmailSignup} className="space-y-4">
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
              style={{ borderColor: 'var(--tm-border)', '--tw-ring-color': 'var(--tm-accent)' } as React.CSSProperties}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder={`Min. ${MIN_LENGTH} characters — try a passphrase`}
              className="w-full rounded-xl border px-3 py-2.5 text-sm bg-transparent text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 transition-all"
              style={{ borderColor: 'var(--tm-border)', '--tw-ring-color': 'var(--tm-accent)' } as React.CSSProperties}
            />
            <PasswordStrengthMeter password={password} check={pwCheck} />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5" htmlFor="confirm">
              Confirm password
            </label>
            <input
              id="confirm"
              type="password"
              autoComplete="new-password"
              required
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-xl border px-3 py-2.5 text-sm bg-transparent text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 transition-all"
              style={{ borderColor: 'var(--tm-border)', '--tw-ring-color': 'var(--tm-accent)' } as React.CSSProperties}
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
            Create account
          </button>
        </form>

        <p className="text-sm text-center mt-6" style={{ color: 'var(--tm-text-muted)' }}>
          Already have an account?{' '}
          <Link href="/login" className="font-medium hover:underline" style={{ color: 'var(--tm-accent)' }}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
