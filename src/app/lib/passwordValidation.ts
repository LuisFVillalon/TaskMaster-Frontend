/**
 * Shared password validation — NIST SP 800-63B (2024 update) compliant.
 *
 * Rules enforced:
 *   1. Minimum 12 characters (no maximum, all Unicode accepted)
 *   2. Not in the common-breached-password blacklist
 *   3. Does not contain the user's own email local-part (≥ 4 chars)
 *   4. zxcvbn entropy score ≥ 2 ("Fair") once length is met
 *
 * Intentionally NOT enforced (per NIST):
 *   - Mandatory uppercase / lowercase / digit / symbol counts
 *   - Periodic forced resets
 *   - Composition complexity hints
 *
 * The same minimum length (MIN_LENGTH) is re-validated by the backend
 * (user_router.py) so client-side bypass does not help an attacker.
 */

import { zxcvbn, zxcvbnOptions } from '@zxcvbn-ts/core';
import * as languageCommon from '@zxcvbn-ts/language-common';

// Configure zxcvbn once (idempotent — safe to call multiple times).
zxcvbnOptions.setOptions({
  graphs: languageCommon.adjacencyGraphs,
  dictionary: { ...languageCommon.dictionary },
});

export const MIN_LENGTH = 12;
export const STRONG_SCORE = 2; // minimum zxcvbn score (0-4) to pass

/**
 * Top 50 most common / breached passwords, normalised to lowercase + no spaces.
 * This is NOT a substitute for a full HIBP check — it catches the most obvious
 * entries to guide users toward better choices during signup / password change.
 */
const BLACKLIST = new Set([
  'password', 'password1', 'password12', 'password123', 'password1234',
  'password12345', 'password123456',
  'qwerty', 'qwerty123', 'qwertyuiop', 'qwertyuiop123',
  '123456789012', '12345678901234', '1234567890',
  'iloveyou1234', 'iloveyouforever',
  'welcome1234', 'welcome123456',
  'sunshine1234', 'princess1234',
  'monkey123456', 'dragon123456',
  'letmein12345', 'letmeinnow',
  'football1234', 'baseball1234',
  'superman1234', 'batman12345',
  'trustno11234', 'master123456',
  'admin12345678', 'administrator',
  'passphrase123', 'correcthorse',
  'mustang12345', 'shadow123456',
  'michael12345', 'jessica12345',
  'abc123456789', 'abcdefghijkl',
  'hunter12345', 'ranger12345',
  'starwars1234', 'starwars12345',
  'liverpool1234', 'chelsea12345',
  'harley12345', 'maverick1234',
]);

export interface PasswordCheck {
  /** All rules pass and the password may be submitted. */
  ok: boolean;
  /** zxcvbn score 0–4. Used to drive the strength meter. */
  score: number;
  /** Blocking errors — must all be empty before the form can submit. */
  errors: string[];
  /** Non-blocking tips from zxcvbn. */
  suggestions: string[];
}

/**
 * Validate a candidate password against all rules.
 *
 * @param password   The raw password string (may contain spaces / Unicode).
 * @param email      Optional — used to detect email-based passwords.
 */
export function validatePassword(password: string, email?: string): PasswordCheck {
  const errors: string[] = [];
  const suggestions: string[] = [];

  // 1. Length gate (must come first — zxcvbn is slow on very short strings)
  if (password.length < MIN_LENGTH) {
    const remaining = MIN_LENGTH - password.length;
    errors.push(
      `Too short — add ${remaining} more character${remaining === 1 ? '' : 's'} (minimum ${MIN_LENGTH}).`,
    );
    // Return early: below-minimum passwords give noisy entropy feedback.
    return { ok: false, score: 0, errors, suggestions };
  }

  // 2. Blacklist — strip spaces and lowercase for normalised comparison
  const normalised = password.toLowerCase().replace(/\s/g, '');
  if (BLACKLIST.has(normalised)) {
    errors.push('This password is too common — please choose something more unique.');
  }

  // 3. Email-based check
  if (email) {
    const localPart = email.split('@')[0].toLowerCase();
    if (localPart.length >= 4 && normalised.includes(localPart)) {
      errors.push("Don't use your email address in your password.");
    }
  }

  // 4. Entropy score (only penalise once length is satisfied)
  const result = zxcvbn(password);
  const score = result.score as number;

  if (score < STRONG_SCORE) {
    errors.push('Too predictable — try a longer phrase or mix in unrelated words.');
  }

  // Non-blocking zxcvbn feedback
  if (result.feedback.warning) {
    suggestions.push(result.feedback.warning);
  }
  for (const s of result.feedback.suggestions) {
    suggestions.push(s);
  }

  return { ok: errors.length === 0, score, errors, suggestions };
}

/** Human-readable label for each zxcvbn score level. */
export const SCORE_LABELS: Record<number, string> = {
  0: 'Very weak',
  1: 'Weak',
  2: 'Fair',
  3: 'Strong',
  4: 'Very strong',
};

/** Tailwind-compatible colour class for each score level. */
export const SCORE_COLORS: Record<number, string> = {
  0: '#ef4444', // red-500
  1: '#f97316', // orange-500
  2: '#eab308', // yellow-500
  3: '#22c55e', // green-500
  4: '#16a34a', // green-600
};
