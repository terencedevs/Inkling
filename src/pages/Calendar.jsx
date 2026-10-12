import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
  subMonths,
} from 'date-fns';
import { sdk } from '@/services/sdk';
import { useFetch } from '@/hooks/useFetch';
import ApperIcon from '@/components/ApperIcon';
import PageBand from '@/components/PageBand';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { MARK_STYLE, NOTE_FIELDS, formatTime } from '@/components/noteMeta';

export const route = { path: '/calendar', layout: 'owner', access: 'authenticated' };
export const nav = { icon: 'Calendar', label: 'Calendar', order: 30, profiles: null };

const { eq, and, gte, lte } = window.ApperSDK.CoreSDK;

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const dayKey = (d) => format(d, 'yyyy-MM-dd');

export default function Calendar() {
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [selected, setSelected] = useState(() => new Date());

  const gridStart = startOfWeek(startOfMonth(month));
  const gridEnd = endOfWeek(endOfMonth(month));
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });

  const { data: notes, loading, error, run } = useFetch(
    () =>
      sdk
        .table('notes_c')
        .select(NOTE_FIELDS)
        .where(and(eq('isDated_c', true), gte('dueAt_c', gridStart.toISOString()), lte('dueAt_c', gridEnd.toISOString())))
        .orderBy('dueAt_c')
        .page(1, 100)
        .fetch()
        .then((r) => {
          if (!r.success) throw new Error(r.message);
          return r.data;
        }),
    [dayKey(month)]
  );

  const rows = notes ?? [];
  const firstLoad = loading && notes === undefined;
  const byDay = {};
  rows.forEach((n) => {
    const key = dayKey(new Date(n.dueAt_c));
    byDay[key] = [...(byDay[key] ?? []), n];
  });
  const selectedNotes = byDay[dayKey(selected)] ?? [];

  return (
    <div>
      <PageBand
        emoji="🗓️"
        title="Calendar"
        subtitle="Dots show the days that have something on them."
        action={
          <Button asChild className="h-11 rounded-full bg-highlight px-5 text-highlight-foreground hover:bg-highlight/90">
            <Link to="/notes/new">
              <ApperIcon name="Plus" size={18} /> Add a date
            </Link>
          </Button>
        }
      />

      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-6 lg:grid-cols-[1fr_20rem]">
        <section aria-label="Month view" className="rounded-2xl border border-border bg-card p-4 shadow-(--shadow-sm)">
          <div className="mb-3 flex items-center justify-between">
            <Button variant="outline" className="h-10 w-10 rounded-full p-0" aria-label="Previous month" onClick={() => setMonth(subMonths(month, 1))}>
              <ApperIcon name="ChevronLeft" size={18} />
            </Button>
            <div className="text-center">
              <h2 className="font-heading text-xl">{format(month, 'MMMM yyyy')}</h2>
              <button
                type="button"
                className="text-xs font-semibold text-muted-foreground hover:underline"
                onClick={() => {
                  setMonth(startOfMonth(new Date()));
                  setSelected(new Date());
                }}
              >
                Jump to today
              </button>
            </div>
            <Button variant="outline" className="h-10 w-10 rounded-full p-0" aria-label="Next month" onClick={() => setMonth(addMonths(month, 1))}>
              <ApperIcon name="ChevronRight" size={18} />
            </Button>
          </div>

          {error ? (
            <div className="py-10 text-center">
              <p className="font-heading text-lg">The calendar did not load</p>
              <Button className="mt-3" onClick={run}>
                Try again
              </Button>
            </div>
          ) : (
            <div aria-busy={loading} className={cn('transition-opacity', loading && 'opacity-60')}>
              <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-muted-foreground">
                {WEEKDAYS.map((d) => (
                  <div key={d} className="py-1">
                    {d}
                  </div>
                ))}
              </div>
              {firstLoad ? (
                <div className="mt-1 grid grid-cols-7 gap-1">
                  {Array.from({ length: 35 }, (_, i) => (
                    <Skeleton key={i} className="h-14 rounded-xl" />
                  ))}
                </div>
              ) : (
                <div className="mt-1 grid grid-cols-7 gap-1">
                  {days.map((day) => {
                    const items = byDay[dayKey(day)] ?? [];
                    const isSelected = isSameDay(day, selected);
                    const isToday = isSameDay(day, new Date());
                    return (
                      <button
                        key={dayKey(day)}
                        type="button"
                        onClick={() => setSelected(day)}
                        aria-label={`${format(day, 'EEEE d MMMM')}${items.length ? `, ${items.length} notes` : ''}`}
                        aria-pressed={isSelected}
                        className={cn(
                          'flex h-14 flex-col items-center justify-start gap-1 rounded-xl pt-1.5 text-sm transition-colors focus-visible:ring-2 focus-visible:ring-ring',
                          !isSameMonth(day, month) && 'text-muted-foreground/50',
                          isSelected ? 'bg-primary text-primary-foreground' : 'hover:bg-accent',
                          isToday && !isSelected && 'ring-2 ring-highlight'
                        )}
                      >
                        <span className="font-semibold">{format(day, 'd')}</span>
                        <span className="flex gap-0.5">
                          {items.slice(0, 3).map((n) => (
                            <span key={n.Id} className={cn('h-1.5 w-1.5 rounded-full', MARK_STYLE[n.mark_c]?.dot ?? 'bg-muted-foreground')} />
                          ))}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </section>

        <section aria-label="Selected day" className="space-y-3">
          <h2 className="font-heading text-lg">{format(selected, 'EEEE, d MMMM')}</h2>
          {selectedNotes.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border p-6 text-center">
              <p className="text-3xl" aria-hidden="true">
                🌤️
              </p>
              <p className="mt-2 font-semibold">A free day</p>
              <p className="text-sm text-muted-foreground">Nothing is tied to this date yet.</p>
            </div>
          ) : (
            <ul className="space-y-2">
              {selectedNotes.map((n) => (
                <li key={n.Id}>
                  <Link
                    to={`/notes/${n.Id}`}
                    className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3 transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <span className="text-2xl" aria-hidden="true">
                      {n.emoji_c || '📝'}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className={cn('block truncate font-semibold', n.isDone_c && 'text-muted-foreground line-through')}>{n.Name}</span>
                      <span className="text-xs text-muted-foreground">{formatTime(n.dueAt_c)}</span>
                    </span>
                    <span className={cn('h-2.5 w-2.5 shrink-0 rounded-full', MARK_STYLE[n.mark_c]?.dot)} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
