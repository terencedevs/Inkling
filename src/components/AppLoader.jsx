import { APP_CONFIG } from '@/config/app.config';
import { cn } from '@/lib/utils';

/**
 * The one loading screen. Same look as the pre-React loader in index.html,
 * so boot → session → route chunk reads as a single continuous state.
 *   fullScreen — covers the viewport (RootLayout, before the session resolves)
 *   default    — fills the content area inside a layout (route chunks)
 * Pages do not use this for data: lists and records use the default (inline) variant with a label on first load.
 */
export default function AppLoader({ fullScreen = false, label, className }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'flex flex-col items-center justify-center gap-3.5 bg-background text-muted-foreground',
        fullScreen ? 'fixed inset-0' : 'min-h-[50vh] w-full',
        className,
      )}
    >
      <div className="size-7 rounded-full border-[3px] border-border border-t-primary animate-spin" />
      <span className="text-sm">{label ?? APP_CONFIG.name}</span>
    </div>
  );
}
