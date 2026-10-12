import { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { sdk } from '@/services/sdk';
import { useFetch } from '@/hooks/useFetch';
import ApperIcon from '@/components/ApperIcon';
import Confetti from '@/components/Confetti';
import PageBand from '@/components/PageBand';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { formatLocalDate, formatRelativeTime, DATE_FORMATS } from '@/utils/date';
import { MARK_STYLE, NOTE_FIELDS, calendarLink, donePayload, formatTime, snoozePayload, toArray } from '@/components/noteMeta';

export const route = { path: '/dates', layout: 'owner', access: 'authenticated' };
export const nav = { icon: 'Bell', label: 'Dates', order: 20, profiles: null };

const { eq, and, lt, gte } = window.ApperSDK.CoreSDK;

const TABS = ['Overdue', 'Upcoming', 'Done'];

const EMPTY = {
  Overdue: { emoji: '🎉', title: 'Nothing overdue', text: 'You are all caught up. Enjoy the calm.' },
  Upcoming: { emoji: '📅', title: 'No dates coming up', text: 'Add a date to any note and it will show up here.' },
  Done: { emoji: '🧺', title: 'Nothing finished yet', text: 'Mark a reminder done and it lands here.' },
};

function filtersFor(tab, nowIso) {
  if (tab === 'Overdue') return and(eq('isDated_c', true), eq('isDone_c', false), lt('dueAt_c', nowIso));
  if (tab === 'Upcoming') return and(eq('isDated_c', true), eq('isDone_c', false), gte('dueAt_c', nowIso));
  return and(eq('isDated_c', true), eq('isDone_c', true));
}

async function fetchCounts() {
  const nowIso = new Date().toISOString();
  const count = (id, where) => ({ id, fields: [{ field: 'Id', fn: 'Count', alias: 'count' }], where });
  const res = await sdk
    .table('notes_c')
    .select([{ field: 'Id' }])
    .aggregate(TABS.map((t) => count(t, filtersFor(t, nowIso))))
    .limit(1)
    .fetch();
  if (!res.success) throw new Error(res.message);
  const agg = (id) => {
    const b = res.aggregators?.find((a) => a.id === id);
    return b?.data?.count ?? b?.count ?? b?.value ?? 0;
  };
  return { Overdue: agg('Overdue'), Upcoming: agg('Upcoming'), Done: agg('Done') };
}

export default function Dates() {
  const [tab, setTab] = useState('Upcoming');
  const [burst, setBurst] = useState(0);
  const [busyId, setBusyId] = useState(null);

  const { data: notes, loading, error, run } = useFetch(() => {
    const nowIso = new Date().toISOString();
    const q = sdk.table('notes_c').select(NOTE_FIELDS).where(filtersFor(tab, nowIso));
    const ordered = tab === 'Done' ? q.orderByDesc('dueAt_c') : q.orderBy('dueAt_c');
    return ordered
      .page(1, 50)
      .fetch()
      .then((r) => {
        if (!r.success) throw new Error(r.message);
        return r.data;
      });
  }, [tab]);

  const { data: counts, run: refetchCounts } = useFetch(fetchCounts, []);

  const rows = notes ?? [];
  const firstLoad = loading && notes === undefined;

  function refresh() {
    run();
    refetchCounts();
  }

  async function apply(note, fields, message, celebrate) {
    setBusyId(note.Id);
    try {
      const res = await sdk.table('notes_c').update({ Id: note.Id, ...fields });
      if (res.messages?.length) toast.error(res.messages[0]);
      if (!res.data?.length) return;
      if (celebrate) setBurst((b) => b + 1);
      toast.success(message);
      refresh();
    } finally {
      setBusyId(null);
    }
  }

  function markDone(note) {
    const repeats = note.repeat_c && note.repeat_c !== 'None';
    const fields = donePayload(note);
    const message = repeats ? `Done. Next one is ${formatRelativeTime(fields.dueAt_c)}` : 'Marked done. Nicely done!';
    apply(note, fields, message, true);
  }

  function snooze(note, minutes, label) {
    apply(note, snoozePayload(note, minutes), `Snoozed for ${label}`, false);
  }

  return (
    <div>
      <Confetti burstKey={burst} />
      <PageBand
        emoji="⏰"
        title="Dates & reminders"
        subtitle="Birthdays, exams, bills and trips, nearest first."
        action={
          <Button asChild className="h-11 rounded-full bg-highlight px-5 text-highlight-foreground hover:bg-highlight/90">
            <Link to="/notes/new">
              <ApperIcon name="Plus" size={18} /> Add a date
            </Link>
          </Button>
        }
      >
        <div role="tablist" aria-label="Date filters" className="flex gap-2 overflow-x-auto pb-1">
          {TABS.map((t) => (
            <button
              key={t}
              type="button"
              role="tab"
              aria-selected={tab === t}
              onClick={() => setTab(t)}
              className={cn(
                'flex h-10 shrink-0 items-center gap-2 rounded-full px-4 text-sm font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-ring',
                tab === t ? 'bg-background text-foreground shadow-(--shadow-sm)' : 'bg-background/25 text-primary-foreground hover:bg-background/40'
              )}
            >
              {t}
              <span
                className={cn(
                  'rounded-full px-2 py-0.5 text-xs',
                  t === 'Overdue' && (counts?.Overdue ?? 0) > 0 ? 'bg-destructive text-destructive-foreground' : 'bg-muted text-muted-foreground'
                )}
              >
                {counts?.[t] ?? 0}
              </span>
            </button>
          ))}
        </div>
      </PageBand>

      <div className="mx-auto max-w-3xl px-4 py-6">
        {error ? (
          <div className="rounded-2xl border border-border p-8 text-center">
            <p className="font-heading text-lg">Your dates did not load</p>
            <p className="mt-1 text-sm text-muted-foreground">{error.message ?? 'Something went wrong.'}</p>
            <Button className="mt-4" onClick={refresh}>
              Try again
            </Button>
          </div>
        ) : firstLoad ? (
          <div className="space-y-3">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-28 w-full rounded-2xl" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <div className="mx-auto max-w-sm py-16 text-center">
            <div className="text-6xl" aria-hidden="true">
              {EMPTY[tab].emoji}
            </div>
            <p className="mt-4 font-heading text-xl">{EMPTY[tab].title}</p>
            <p className="mt-1 text-sm text-muted-foreground">{EMPTY[tab].text}</p>
          </div>
        ) : (
          <ul aria-busy={loading} className={cn('space-y-3 transition-opacity', loading && 'pointer-events-none opacity-60')}>
            {rows.map((note) => {
              const due = new Date(note.dueAt_c);
              const overdue = tab === 'Overdue';
              const mark = MARK_STYLE[note.mark_c] ?? MARK_STYLE.Casual;
              return (
                <li key={note.Id} className="flex gap-4 rounded-2xl border border-border bg-card p-4 shadow-(--shadow-xs)">
                  <div
                    className={cn(
                      'flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-2xl',
                      overdue ? 'bg-destructive/15 text-destructive' : tab === 'Done' ? 'bg-success-muted text-success' : 'bg-secondary text-secondary-foreground'
                    )}
                  >
                    <span className="font-heading text-2xl leading-none">{due.getDate()}</span>
                    <span className="text-xs font-semibold uppercase">{due.toLocaleString([], { month: 'short' })}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <Link to={`/notes/${note.Id}`} className="min-w-0 font-heading text-lg leading-snug hover:underline focus-visible:ring-2 focus-visible:ring-ring">
                        <span aria-hidden="true">{note.emoji_c || '📝'} </span>
                        {note.Name}
                      </Link>
                      <span className={cn('inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold', mark.chip)}>
                        <span className={cn('h-2 w-2 rounded-full', mark.dot)} />
                        {note.mark_c}
                      </span>
                    </div>
                    <p className={cn('mt-0.5 text-sm', overdue ? 'font-semibold text-destructive' : 'text-muted-foreground')}>
                      {overdue ? 'Overdue · ' : ''}
                      {formatRelativeTime(note.dueAt_c)} · {formatLocalDate(note.dueAt_c, DATE_FORMATS.SHORT)}, {formatTime(note.dueAt_c)}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {note.repeat_c && note.repeat_c !== 'None' && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs font-semibold">
                          <ApperIcon name="Repeat" size={12} /> {note.repeat_c}
                        </span>
                      )}
                      {toArray(note.reminders_c).map((r) => (
                        <span key={r} className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                          <ApperIcon name="Bell" size={12} /> {r}
                        </span>
                      ))}
                    </div>
                    {tab !== 'Done' && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Button size="sm" className="h-10 rounded-full" disabled={busyId === note.Id} onClick={() => markDone(note)}>
                          <ApperIcon name="Check" size={16} /> {busyId === note.Id ? 'Saving…' : 'Mark done'}
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="sm" variant="outline" className="h-10 rounded-full" disabled={busyId === note.Id}>
                              <ApperIcon name="AlarmClock" size={16} /> Snooze
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start">
                            <DropdownMenuItem onClick={() => snooze(note, 10, '10 minutes')}>10 minutes</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => snooze(note, 60, '1 hour')}>1 hour</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => snooze(note, 1440, 'a day')}>Tomorrow</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                        <Button size="sm" variant="ghost" className="h-10 rounded-full" asChild>
                          <a href={calendarLink(note)} target="_blank" rel="noreferrer">
                            <ApperIcon name="CalendarPlus" size={16} /> Add to calendar
                          </a>
                        </Button>
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
