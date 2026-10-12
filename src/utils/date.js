import { parseISO, format, formatDistanceToNow, isValid } from 'date-fns';

/**
 * Parses a UTC ISO-8601 string and formats it to the user's local timezone.
 * @param {string} isoString - e.g., "2026-05-21T09:30:00Z"
 * @param {string} formatStr - date-fns format string (default: "MMM d, yyyy")
 * @returns {string} Formatted local date string
 */
export function formatLocalDate(isoString, formatStr = 'MMM d, yyyy') {
  if (!isoString) return '';
  
  // parseISO converts the UTC string into a local Date object automatically
  const date = parseISO(isoString);
  
  if (!isValid(date)) return 'Invalid Date';
  
  return format(date, formatStr);
}

/**
 * Returns a relative time string (e.g., "2 hours ago", "just now")
 */
export function formatRelativeTime(isoString) {
  if (!isoString) return '';
  
  const date = parseISO(isoString);
  if (!isValid(date)) return 'Invalid Date';
  
  return formatDistanceToNow(date, { addSuffix: true });
}

// Common format presets you can reuse
export const DATE_FORMATS = {
  SHORT: 'MMM d, yyyy',               // "May 21, 2026"
  LONG: 'MMMM d, yyyy',               // "May 21, 2026"
  WITH_TIME: 'MMM d, yyyy h:mm a',    // "May 21, 2026 3:00 PM"
  TIME_ONLY: 'h:mm a',                // "3:00 PM"
  NUMERIC: 'MM/dd/yyyy',              // "05/21/2026"
};
