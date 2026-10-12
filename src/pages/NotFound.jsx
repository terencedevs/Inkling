import { Link } from 'react-router-dom';
import { FileQuestion, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotFound({ pageName }) {
  return (
    <div className="min-h-svh flex items-center justify-center bg-background px-4">
      <div className="max-w-md w-full text-center">
        <p className="text-8xl font-bold tracking-tighter text-muted-foreground/15 select-none leading-none">
          404
        </p>
        <div className="size-14 bg-primary/10 rounded-xl flex items-center justify-center mx-auto -mt-2 mb-5">
          <FileQuestion className="size-7 text-primary" />
        </div>
        <h1 className="text-2xl font-semibold mb-2">Page not found</h1>
        <p className="text-sm text-muted-foreground mb-8 max-w-xs mx-auto">
          {pageName
            ? `The page "${pageName}" does not exist or has been moved.`
            : 'The page you requested does not exist or may have been moved.'}
        </p>
        <Link to="/">
          <Button size="lg" className="inline-flex items-center gap-2">
            <Home data-icon="inline-start" />
            Return home
          </Button>
        </Link>
      </div>
    </div>
  );
}
