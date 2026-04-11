/**
 * Timezone conversion utilities for recurring weekly availability windows.
 *
 * Strategy: the database always stores times in UTC (HH:MM strings).  The UI
 * always shows and accepts times in the user's browser-local timezone.  These
 * helpers translate between the two representations without introducing an
 * external dependency.
 *
 * Why no library?
 * ─────────────────
 * luxon / date-fns-tz are excellent but add bundle weight.  For the narrow
 * problem of converting a recurring HH:MM window between local and UTC we only
 * need the browser's current UTC offset, which `Date.prototype.getTimezoneOffset`
 * provides natively.  DST is handled correctly for the moment of conversion
 * (i.e. what the offset is right now when the user saves or views a preference).
 *
 * Limitation: if the user saves a preference in winter (PST, UTC-8) and views
 * it in summer (PDT, UTC-7) the displayed time will shift by one hour.  This
 * matches the behaviour of every major calendar app and is the correct
 * interpretation of a wall-clock recurring event.
 *
 * day_of_week convention: 0 = Sunday … 6 = Saturday  (JS Date.getDay()).
 */

// ── Internal helpers ──────────────────────────────────────────────────────────

/** Parse "HH:MM" → total minutes since midnight. */
function parseMins(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

/** Total minutes since midnight → "HH:MM" (always wraps into 00:00–23:59). */
function fmtMins(mins: number): string {
  const safe = ((mins % 1440) + 1440) % 1440;
  return (
    String(Math.floor(safe / 60)).padStart(2, '0') +
    ':' +
    String(safe % 60).padStart(2, '0')
  );
}

/**
 * Window duration in minutes, correctly handling overnight windows where
 * endMins < startMins (e.g. 21:00 → 08:00 = 660 minutes, not -780).
 */
function windowDuration(startMins: number, endMins: number): number {
  return endMins > startMins
    ? endMins - startMins
    : 1440 + endMins - startMins;
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Convert a recurring weekly window from browser-local time to UTC.
 *
 * `localDow` is the day on which the window *starts* in local time.
 * The returned `dow` is the day on which that same moment falls in UTC —
 * it may differ by ±1 day when the local↔UTC offset crosses midnight.
 *
 * The window's exact duration (in minutes) is preserved through the conversion,
 * so overnight windows remain overnight windows (possibly on different UTC days).
 *
 * @example
 * // California (UTC-8) user sets "Friday 21:00 – 08:00"
 * localWindowToUtc(5, '21:00', '08:00')
 * // → { dow: 6, start_time: '05:00', end_time: '16:00' }
 * // (Saturday 05:00 UTC, 11-hour window, ends Saturday 16:00 UTC)
 */
export function localWindowToUtc(
  localDow: number,
  localStart: string,
  localEnd: string,
): { dow: number; start_time: string; end_time: string } {
  const startMins    = parseMins(localStart);
  const durationMins = windowDuration(startMins, parseMins(localEnd));

  // getTimezoneOffset() === UTC − local  (positive for UTC−, negative for UTC+).
  // UTC = local + getTimezoneOffset()
  const offset    = new Date().getTimezoneOffset();
  const utcStart  = startMins + offset;

  let utcDow = localDow;
  let utcStartNorm = utcStart;
  if (utcStart < 0) {
    utcStartNorm = utcStart + 1440;
    utcDow = (localDow + 6) % 7;   // shifted one day earlier
  } else if (utcStart >= 1440) {
    utcStartNorm = utcStart - 1440;
    utcDow = (localDow + 1) % 7;   // shifted one day later
  }

  return {
    dow:        utcDow,
    start_time: fmtMins(utcStartNorm),
    end_time:   fmtMins(utcStartNorm + durationMins),
  };
}

/**
 * Convert a recurring weekly window from UTC back to browser-local time.
 * Exact inverse of `localWindowToUtc`.
 *
 * @example
 * // Same California user reading back the stored UTC values
 * utcWindowToLocal(6, '05:00', '16:00')
 * // → { dow: 5, start_time: '21:00', end_time: '08:00' }
 */
export function utcWindowToLocal(
  utcDow: number,
  utcStart: string,
  utcEnd: string,
): { dow: number; start_time: string; end_time: string } {
  const startMins    = parseMins(utcStart);
  const durationMins = windowDuration(startMins, parseMins(utcEnd));

  // local = UTC − getTimezoneOffset()
  const offset     = new Date().getTimezoneOffset();
  const localStart = startMins - offset;

  let localDow = utcDow;
  let localStartNorm = localStart;
  if (localStart < 0) {
    localStartNorm = localStart + 1440;
    localDow = (utcDow + 6) % 7;
  } else if (localStart >= 1440) {
    localStartNorm = localStart - 1440;
    localDow = (utcDow + 1) % 7;
  }

  return {
    dow:        localDow,
    start_time: fmtMins(localStartNorm),
    end_time:   fmtMins(localStartNorm + durationMins),
  };
}

/**
 * Return a short IANA timezone abbreviation for the user's current locale,
 * e.g. "PST", "PDT", "EST", "GMT+5:30".
 * Falls back to "local time" if the Intl API is unavailable.
 */
export function getTimezoneAbbr(): string {
  try {
    return (
      new Intl.DateTimeFormat('en-US', { timeZoneName: 'short' })
        .formatToParts(new Date())
        .find(p => p.type === 'timeZoneName')?.value ?? 'local time'
    );
  } catch {
    return 'local time';
  }
}
