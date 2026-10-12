import { addDays, addWeeks, addMonths, addYears, addMinutes } from 'date-fns';

// Shared constants and helpers for notes. Picklist values are exact strings.
export const MARKS = ['Important', 'Casual', 'Favourite'];
export const COLORS = ['Default', 'Rose', 'Mint', 'Lavender', 'Peach', 'Sky'];
export const REPEATS = ['None', 'Daily', 'Weekly', 'Monthly', 'Yearly'];
export const REMINDER_OPTIONS = ['At the time', '1 hour before', '1 day before', '1 week before'];

export const NOTE_FIELDS = [
  'Name',
  'body_c',
  'mark_c',
  'emoji_c',
  'color_c',
  'isPinned_c',
  'isDated_c',
  'dueAt_c',
  'repeat_c',
  'reminders_c',
  'isDone_c',
  'ModifiedOn',
  'CreatedOn',
];

// One style map per status field, used everywhere the mark appears.
export const MARK_STYLE = {
  Important: { chip: 'bg-chart-1/25 text-foreground', dot: 'bg-chart-1', icon: 'Flame' },
  Casual: { chip: 'bg-chart-2/25 text-foreground', dot: 'bg-chart-2', icon: 'Coffee' },
  Favourite: { chip: 'bg-chart-3/30 text-foreground', dot: 'bg-chart-3', icon: 'Star' },
};

export const COLOR_CLASS = {
  Default: 'bg-card',
  Rose: 'bg-chart-1/15',
  Mint: 'bg-chart-4/20',
  Lavender: 'bg-chart-5/20',
  Peach: 'bg-highlight/15',
  Sky: 'bg-chart-2/20',
};

export const SWATCH_CLASS = {
  Default: 'bg-card border border-input',
  Rose: 'bg-chart-1',
  Mint: 'bg-chart-4',
  Lavender: 'bg-chart-5',
  Peach: 'bg-highlight',
  Sky: 'bg-chart-2',
};

export const toArray = (v) => (Array.isArray(v) ? v : typeof v === 'string' && v ? v.split(',') : []);

// ISO (UTC) -> value for <input type="datetime-local">
export function toLocalInput(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function fromLocalInput(value) {
  if (!value) return null;
  return new Date(value).toISOString();
}

export function formatTime(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

export function isOverdue(note) {
  return Boolean(note.isDated_c && !note.isDone_c && note.dueAt_c && new Date(note.dueAt_c).getTime() < Date.now());
}

export function advanceDue(iso, repeat) {
  const d = new Date(iso);
  const now = Date.now();
  let next = d;
  const step = { Daily: addDays, Weekly: addWeeks, Monthly: addMonths, Yearly: addYears }[repeat];
  if (!step) return iso;
  // Move forward at least once, and keep going until the date is in the future.
  do {
    next = step(next, 1);
  } while (next.getTime() < now);
  return next.toISOString();
}

// Fields to write when the user taps Mark done. Repeating notes roll forward instead of closing.
export function donePayload(note) {
  if (note.repeat_c && note.repeat_c !== 'None') {
    return { dueAt_c: advanceDue(note.dueAt_c, note.repeat_c) };
  }
  return { isDone_c: true };
}

export function snoozePayload(note, minutes) {
  const base = Math.max(new Date(note.dueAt_c).getTime(), Date.now());
  return { dueAt_c: addMinutes(new Date(base), minutes).toISOString() };
}

// Everything needed to re-create a note (used by Undo after delete).
export function toCreatePayload(note) {
  return {
    Name: note.Name,
    body_c: note.body_c ?? '',
    mark_c: note.mark_c,
    emoji_c: note.emoji_c ?? '',
    color_c: note.color_c ?? 'Default',
    isPinned_c: Boolean(note.isPinned_c),
    isDated_c: Boolean(note.isDated_c),
    dueAt_c: note.dueAt_c ?? null,
    repeat_c: note.repeat_c ?? 'None',
    reminders_c: note.reminders_c ?? '',
    isDone_c: Boolean(note.isDone_c),
  };
}

// Link that opens the phone or web calendar with the event pre-filled.
export function calendarLink(note) {
  const start = new Date(note.dueAt_c);
  const end = addMinutes(start, 30);
  const fmt = (d) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: note.Name,
    details: note.body_c ?? '',
    dates: `${fmt(start)}/${fmt(end)}`,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
