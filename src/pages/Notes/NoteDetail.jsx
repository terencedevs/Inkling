import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { sdk } from '@/services/sdk';
import { useFetch } from '@/hooks/useFetch';
import ApperIcon from '@/components/ApperIcon';
import NoteBody from '@/components/NoteBody';
import PageBand from '@/components/PageBand';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import { formatLocalDate, DATE_FORMATS } from '@/utils/date';
import {
  COLOR_CLASS,
  MARKS,
  MARK_STYLE,
  NOTE_FIELDS,
  calendarLink,
  formatTime,
  isOverdue,
  toArray,
} from '@/components/noteMeta';

export const route = { path: '/notes/:id', layout: 'owner', access: 'authenticated' };

export default function NoteDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const { data: note, loading, error, run, setData } = useFetch(async () => {
    const res = await sdk.table('notes_c').select(NOTE_FIELDS).get(id);
    return res.data;
  }, [id]);

  async function patch(fields, message) {
    setData((prev) => (prev ? { ...prev, ...fields } : prev));
    const res = await sdk.table('notes_c').update({ Id: id, ...fields });
    if (res.messages?.length || !res.data?.length) {
      toast.error(res.messages?.[0] ?? 'Could not save that change');
      run();
      return;
    }
    if (message) toast.success(message);
  }

  function toggleLine(index) {
    const lines = (note.body_c ?? '').split('\n');
    const line = lines[index];
    lines[index] = line.startsWith('- [ ] ') ? line.replace('- [ ] ', '- [x] ') : line.replace('- [x] ', '- [ ] ');
    patch({ body_c: lines.join('\n') });
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await sdk.table('notes_c').remove([id]);
      if (!res.success) {
        toast.error(res.messages?.[0] ?? 'Could not delete that note');
        return;
      }
      toast.success('Note deleted');
      setConfirmOpen(false);
      navigate('/');
    } finally {
      setDeleting(false);
    }
  }

  const back = { to: '/', label: 'Back to Notes' };
  const firstLoad = loading && note === undefined;

  if (firstLoad) {
    return (
      <div>
        <PageBand title="Loading…" back={back} />
        <div className="mx-auto max-w-3xl space-y-4 px-4 py-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-48 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error || !note) {
    return (
      <div>
        <PageBand title="Note not found" back={back} />
        <div className="mx-auto max-w-3xl px-4 py-16 text-center">
          <p className="font-heading text-xl">We could not find that note</p>
          <p className="mt-1 text-sm text-muted-foreground">It may have been deleted. Your other notes are safe.</p>
        </div>
      </div>
    );
  }

  const overdue = isOverdue(note);

  return (
    <div>
      <PageBand
        emoji={note.emoji_c || '📝'}
        title={note.Name}
        back={back}
        action={
          <Button asChild className="h-11 rounded-full bg-highlight px-5 text-highlight-foreground hover:bg-highlight/90">
            <Link to={`/notes/${id}/edit`}>
              <ApperIcon name="Pencil" size={16} /> Edit note
            </Link>
          </Button>
        }
      />

      <div className="mx-auto max-w-3xl space-y-6 px-4 py-6">
        <div className="flex flex-wrap items-center gap-2">
          <div role="radiogroup" aria-label="Mark" className="flex flex-wrap gap-2">
            {MARKS.map((m) => (
              <button
                key={m}
                type="button"
                role="radio"
                aria-checked={note.mark_c === m}
                onClick={() => patch({ mark_c: m }, `Marked ${m}`)}
                className={cn(
                  'inline-flex h-10 items-center gap-2 rounded-full border px-4 text-sm font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-ring',
                  note.mark_c === m ? cn(MARK_STYLE[m].chip, 'border-foreground/30') : 'border-input bg-background hover:bg-accent'
                )}
              >
                <span className={cn('h-2.5 w-2.5 rounded-full', MARK_STYLE[m].dot)} />
                {m}
              </button>
            ))}
          </div>
          <Button
            variant="outline"
            className="h-10 rounded-full"
            onClick={() => patch({ isPinned_c: !note.isPinned_c }, note.isPinned_c ? 'Unpinned' : 'Pinned to the top')}
          >
            <ApperIcon name="Pin" size={16} /> {note.isPinned_c ? 'Unpin' : 'Pin'}
          </Button>
        </div>

        <article className={cn('rounded-2xl border border-border p-5 shadow-(--shadow-sm)', COLOR_CLASS[note.color_c] ?? 'bg-card')}>
          {(note.body_c ?? '').trim() ? (
            <NoteBody body={note.body_c} onToggleLine={toggleLine} className="text-base" />
          ) : (
            <p className="text-muted-foreground">This note is empty. Tap Edit note to add something.</p>
          )}
        </article>

        {note.isDated_c && note.dueAt_c && (
          <section className="space-y-3 rounded-2xl border border-border p-5">
            <h2 className="font-heading text-lg">Date and reminders</h2>
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className={cn('inline-flex items-center gap-1 rounded-full px-3 py-1 font-semibold', overdue ? 'bg-destructive/15 text-destructive' : note.isDone_c ? 'bg-success-muted text-success' : 'bg-muted')}>
                <ApperIcon name={note.isDone_c ? 'Check' : 'Calendar'} size={14} />
                {note.isDone_c ? 'Done' : overdue ? 'Overdue' : 'Coming up'}
              </span>
              <span>
                {formatLocalDate(note.dueAt_c, DATE_FORMATS.SHORT)} at {formatTime(note.dueAt_c)}
              </span>
              {note.repeat_c && note.repeat_c !== 'None' && (
                <span className="rounded-full bg-muted px-3 py-1 font-semibold">Repeats {note.repeat_c.toLowerCase()}</span>
              )}
            </div>
            {toArray(note.reminders_c).length > 0 && (
              <div className="flex flex-wrap gap-2">
                {toArray(note.reminders_c).map((r) => (
                  <span key={r} className="inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-secondary-foreground">
                    <ApperIcon name="Bell" size={12} /> {r}
                  </span>
                ))}
              </div>
            )}
            <Button asChild variant="outline" className="rounded-full">
              <a href={calendarLink(note)} target="_blank" rel="noreferrer">
                <ApperIcon name="CalendarPlus" size={16} /> Add to calendar
              </a>
            </Button>
          </section>
        )}

        <div className="flex justify-end border-t border-border pt-4">
          <Button variant="ghost" className="text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => setConfirmOpen(true)}>
            <ApperIcon name="Trash2" size={16} /> Delete note
          </Button>
        </div>
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{note.Name}"?</AlertDialogTitle>
            <AlertDialogDescription>This removes the note and its reminders. This cannot be undone from here.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep it</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleting}
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? 'Deleting…' : 'Delete note'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
