import { useSearchParams, Link } from 'react-router-dom';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import ApperIcon from '@/components/ApperIcon';
import AuthLayout from './AuthLayout';

const ERROR_MESSAGES = {
  'invalid-redirectUri': 'The redirect URL is not configured correctly. Please check your OAuth provider settings.',
  'access-denied': 'Access was denied. You may have cancelled the login or lack permission.',
  'invalid-state': 'The authentication session expired. Please try again.',
  'provider-error': 'The login provider encountered an error. Please try again later.',
};

export default function ErrorPage() {
  const [params] = useSearchParams();
  const errorCode = params.get('error');
  const message = params.get('message')
    || ERROR_MESSAGES[errorCode]
    || 'An authentication error occurred. Please try again.';

  return (
    <AuthLayout title="Something went wrong" icon="AlertCircle">
      <div className="text-center space-y-4">
        <p className="text-sm text-muted-foreground">{message}</p>
        {errorCode && (
          <p className="text-xs text-muted-foreground/60 font-mono">Code: {errorCode}</p>
        )}
        <div className="flex items-center justify-center gap-3 pt-1">
          <Link to="/login" className={cn(buttonVariants({ variant: 'outline' }), 'h-9 inline-flex items-center gap-1.5')}>
            <ApperIcon name="ArrowLeft" size={16} />
            Back to login
          </Link>
          <Link to="/" className={cn(buttonVariants({ variant: 'ghost' }), 'h-9')}>
            Home
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
}
