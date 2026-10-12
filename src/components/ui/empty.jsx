import { Plus } from 'lucide-react';
import ApperIcon from '@/components/ApperIcon';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

function Empty({ icon = 'Inbox', title = 'Nothing here yet', description = '', action, actionLabel, className = '' }) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-16 px-4 text-center', className)}>
      <div className="size-14 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
        <ApperIcon name={icon} size={28} className="text-primary" />
      </div>
      <h3 className="text-lg font-semibold mb-1">{title}</h3>
      {description && <p className="text-sm text-muted-foreground mb-5 max-w-sm">{description}</p>}
      {action && actionLabel && (
        <Button size="sm" onClick={action}>
          <Plus className="size-4" />
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

export { Empty };
