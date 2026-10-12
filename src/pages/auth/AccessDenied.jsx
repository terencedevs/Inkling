import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/layouts/RootLayout';
import { APP_CONFIG, AUTH_PROFILES } from '@/config/app.config';
import ApperIcon from '@/components/ApperIcon';
import AuthLayout from './AuthLayout';

export default function AccessDenied() {
  const { user, isAuthenticated } = useAuth();

  return (
    <AuthLayout
      title="Access Denied"
      icon="ShieldOff"
    >
      <div className="text-center space-y-5">
        <p className="text-sm text-muted-foreground">
          {isAuthenticated
            ? `Your ${user?.profileLabel || 'current'} account doesn't have permission to access this page.`
            : 'You need to sign in to access this page.'}
        </p>
        {!isAuthenticated && AUTH_PROFILES?.length > 0 && (
          <div className="flex flex-col gap-3">
            <p className="text-sm font-medium">Sign in as:</p>
            <div className="flex flex-col gap-2">
              {AUTH_PROFILES.map((p) => (
                <Button key={p.key} variant="outline" asChild className="h-9">
                  <Link to={`/${p.key}/login`}>{p.label}</Link>
                </Button>
              ))}
            </div>
          </div>
        )}
        {!isAuthenticated && !AUTH_PROFILES?.length && (
          <Button asChild className="h-9">
            <Link to={APP_CONFIG.defaultLoginRoute}>
              <ApperIcon name="LogIn" size={16} />
              Sign in
            </Link>
          </Button>
        )}
        {isAuthenticated && (
          <Button asChild className="h-9">
            <Link to="/">
              <ApperIcon name="Home" size={16} />
              Go home
            </Link>
          </Button>
        )}
      </div>
    </AuthLayout>
  );
}
