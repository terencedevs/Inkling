import ApperIcon from '@/components/ApperIcon';
import { cn } from '@/lib/utils';

// **bold** inside a line
function renderInline(text) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    return <span key={i}>{part}</span>;
  });
}

// Renders the tiny formatting language the editor writes: **bold**, "- bullet", "- [ ] checklist".
// In full mode with onToggleLine, checklist items can be ticked straight from the page.
export default function NoteBody({ body, compact = false, onToggleLine, className }) {
  const lines = (body ?? '').split('\n');
  const shown = compact ? lines.filter((l) => l.trim()).slice(0, 5) : lines;

  return (
    <div className={cn('space-y-1 text-sm', className)}>
      {shown.map((line, index) => {
        const check = line.match(/^- \[( |x)\] (.*)$/);
        const bullet = line.match(/^- (.*)$/);

        if (check) {
          const done = check[1] === 'x';
          const content = (
            <>
              <ApperIcon name={done ? 'CheckSquare' : 'Square'} size={16} className="mt-0.5 shrink-0 text-muted-foreground" />
              <span className={cn(done && 'text-muted-foreground line-through')}>{renderInline(check[2])}</span>
            </>
          );
          if (onToggleLine && !compact) {
            return (
              <button
                key={index}
                type="button"
                onClick={() => onToggleLine(index)}
                className="flex min-h-10 w-full items-start gap-2 rounded-lg px-1 text-left hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring"
              >
                {content}
              </button>
            );
          }
          return (
            <div key={index} className="flex items-start gap-2">
              {content}
            </div>
          );
        }

        if (bullet) {
          return (
            <div key={index} className="flex items-start gap-2">
              <span aria-hidden="true" className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground" />
              <span>{renderInline(bullet[1])}</span>
            </div>
          );
        }

        if (!line.trim()) {
          return <div key={index} className="h-2" />;
        }

        return <p key={index}>{renderInline(line)}</p>;
      })}
    </div>
  );
}
