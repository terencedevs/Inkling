import { Link } from 'react-router-dom';
import { APP_CONFIG } from '@/config/app.config';
import ApperIcon from '@/components/ApperIcon';
import { Button } from '@/components/ui/button';

export default function Home() {
  return (
    <div className="min-h-svh flex flex-col items-center justify-center p-8 bg-background">
      <div className="size-14 bg-primary/10 rounded-2xl flex items-center justify-center mb-4">
        <ApperIcon name={APP_CONFIG.icon} size={28} className="text-primary" />
      </div>
      <h1 className="text-3xl font-bold">{APP_CONFIG.name}</h1>
      <p className="text-sm text-muted-foreground mt-2 text-center max-w-md">{APP_CONFIG.tagline}</p>
      <Button asChild className="mt-6">
        <Link to={APP_CONFIG.defaultLoginRoute}>Sign in</Link>
      </Button>
    </div>
  );
}
