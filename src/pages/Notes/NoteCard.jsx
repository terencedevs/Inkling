import { Link, useNavigate } from 'react-router-dom';
import ApperIcon from '@/components/ApperIcon';
import NoteBody from '@/components/NoteBody';
import { cn } from '@/lib/utils';
import { formatLocalDate, DATE_FORMATS } from '@/utils/date';
import { COLOR_CLASS, MARK_STYLE, isOverdue } from '@/components/noteMeta';

// A note card: emoji, title, preview, date chip and mark chip, with quick actions.
export default function NoteCard({ record, hidePreviews, onToggleFavourite, onTogglePin, onDelete }) {
  const navigate = useNavigate();
  const mark = MARK_STYLE[record.mark_c] ?? MARK_STYLE.Casual;
  const overdue = isOverdue(record);

  return (
    <div
      onClick={() => navigate(`/notes/${record.Id}`)}
      className={cn(
        'cursor-pointer rounded-2xl border border-border p-4 shadow-(--shadow-sm) transition duration-(--transition-normal) hover:-translate-y-0.5 hover:shadow-(--shadow-md) active:scale-[0.98] motion-reduce:transition-none',
        COLOR_CLASS[record.color_c] ?? 'bg-card'
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-3xl leading-none" aria-hidden="true">
          {record.emoji_c || '📝'}
        </span>
        {record.isPinned_c && (
          <span className="flex items-center gap-1 text-xs font-semibold text-muted-foreground">
            <ApperIcon name="Pin" size={14} />
            Pinned
          </span>
        )}
      </div>

      <h3 className="mt-3 font-heading text-lg leading-snug">
        <Link to={`/notes/${record.Id}`} onClick={(e) => e.stopPropagation()} className="hover:underline focus-visible:ring-2 focus-visible:ring-ring">
          {record.Name}
        </Link>
      </h3>

      <div className="mt-2 text-muted-foreground">
        {hidePreviews ? (
          <p className="text-sm italic">Preview hidden</p>
        ) : (
          <NoteBody body={record.body_c} compact />
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold', mark.chip)}>
          <span className={cn('h-2 w-2 rounded-full', mark.dot)} />
          {record.mark_c}
        </span>
        {record.isDated_c && record.dueAt_c && (
          <span
            className={cn(
              'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold',
              record.isDone_c && 'bg-success-muted text-success',
              overdue && 'bg-destructive/15 text-destructive',
              !record.isDone_c && !overdue && 'bg-background/70 text-foreground'
            )}
          >
            <ApperIcon name={record.isDone_c ? 'Check' : 'Calendar'} size={12} />
            {record.isDone_c ? 'Done' : overdue ? 'Overdue · ' : ''}
            {!record.isDone_c && formatLocalDate(record.dueAt_c, DATE_FORMATS.SHORT)}
          </span>
        )}
      </div>

      <div className="mt-2 flex items-center justify-end gap-1">
        <button
          type="button"
          aria-label={record.mark_c === 'Favourite' ? 'Remove from favourites' : 'Mark as favourite'}
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavourite(record);
          }}
          className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-background/70 focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ApperIcon name="Star" size={18} className={cn(record.mark_c === 'Favourite' && 'fill-chart-3 text-chart-3')} />
        </button>
        <button
          type="button"
          aria-label={record.isPinned_c ? 'Unpin note' : 'Pin note'}
          onClick={(e) => {
            e.stopPropagation();
            onTogglePin(record);
          }}
          className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-background/70 focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ApperIcon name="Pin" size={18} className={cn(record.isPinned_c && 'text-primary')} />
        </button>
        <button
          type="button"
          aria-label={`Delete ${record.Name}`}
          onClick={(e) => {
            e.stopPropagation();
            onDelete(record);
          }}
          className="flex h-10 w-10 items-center justify-center rounded-full text-destructive hover:bg-destructive/10 focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ApperIcon name="Trash2" size={18} />
        </button>
      </div>
    </div>
  );
}
