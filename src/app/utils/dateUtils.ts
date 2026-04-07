/**
 * Date/time utilities that produce locale-safe strings without UTC conversion.
 *
 * Why locale-safe matters
 * ───────────────────────
 * JavaScript's `Date.toISOString()` converts to UTC before formatting. On a
 * US West Coast machine at 11 PM, `new Date().toISOString()` returns the *next
 * day* in UTC, causing due-date comparisons and cache keys to drift by one day.
 * These helpers read the local calendar fields directly to avoid that.
 */

/**
 * Format a Date as a local-timezone ISO 8601 datetime string.
 * Output: "YYYY-MM-DDTHH:mm:ss.SSS" (no Z / timezone offset suffix).
 *
 * @param date - The Date to format
 */
export const toLocalISOString = (date: Date): string => {
  const pad2  = (n: number) => String(n).padStart(2, '0');
  const pad3  = (n: number) => String(n).padStart(3, '0');
  return (
    `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}` +
    `T${pad2(date.getHours())}:${pad2(date.getMinutes())}:${pad2(date.getSeconds())}.${pad3(date.getMilliseconds())}`
  );
};

/**
 * Format a Date or ISO string as a locale-safe YYYY-MM-DD date string.
 * Reads local calendar fields — never converts to UTC.
 *
 * @param d - A Date object or an ISO string (only the first 10 chars are used)
 */
export const toLocalDateStr = (d: string | Date): string => {
  if (typeof d === 'string') return d.slice(0, 10);
  const pad2 = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
};
