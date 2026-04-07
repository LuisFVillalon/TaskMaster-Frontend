'use client';

import React from 'react';
import { SCORE_LABELS, SCORE_COLORS, MIN_LENGTH } from '@/app/lib/passwordValidation';
import type { PasswordCheck } from '@/app/lib/passwordValidation';

interface Props {
  password: string;
  check: PasswordCheck | null; // null while the field is empty
}

export default function PasswordStrengthMeter({ password, check }: Props) {
  if (!password) return null;

  const score  = check?.score ?? 0;
  const label  = SCORE_LABELS[score];
  const color  = SCORE_COLORS[score];
  // Show all 4 segments; fill up to score+1 (score is 0-indexed but we want 1-5 bars)
  const filled = check ? score + 1 : 0;

  return (
    <div className="space-y-1.5 mt-1">
      {/* Bar */}
      <div className="flex gap-1">
        {[0, 1, 2, 3, 4].map(i => (
          <div
            key={i}
            className="h-1.5 flex-1 rounded-full transition-all duration-300"
            style={{
              backgroundColor: i < filled ? color : 'var(--tm-border)',
            }}
          />
        ))}
      </div>

      {/* Label row */}
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-semibold" style={{ color }}>
          {label}
        </p>
        {check && check.errors.length > 0 && (
          <p className="text-xs text-right" style={{ color: 'var(--tm-text-muted)' }}>
            {check.errors[0]}
          </p>
        )}
      </div>

      {/* Suggestions (non-blocking tips) */}
      {check && check.suggestions.length > 0 && check.ok && (
        <p className="text-xs" style={{ color: 'var(--tm-text-muted)' }}>
          Tip: {check.suggestions[0]}
        </p>
      )}

      {/* Hint shown only while password is too short */}
      {password.length < MIN_LENGTH && (
        <p className="text-xs" style={{ color: 'var(--tm-text-muted)' }}>
          Use at least {MIN_LENGTH} characters. A long passphrase is easier to
          remember and harder to crack.
        </p>
      )}
    </div>
  );
}
