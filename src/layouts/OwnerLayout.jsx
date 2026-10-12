import { Link, NavLink, Outlet } from 'react-router-dom';
import { useOwnerLayoutData } from '@/hooks/useOwnerLayoutData';
import { APP_CONFIG } from '@/config/app.config';
import { cn } from '@/lib/utils';
import ApperIcon from '@/components/ApperIcon';
import UserMenu from '@/components/UserMenu';
import { ErrorBoundary } from '@/components/ui/error-boundary';

// Top bar with the brand and user menu, then a row of pill tabs that scrolls sideways on phones.
export default function OwnerLayout() {
  const { user, logout, homeRoute, navItems, initials, displayName } = useOwnerLayoutData();

  return (
    <div className="min-h-svh bg-background text-foreground">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <Link to={homeRoute} className="flex items-center gap-2 font-heading text-xl">
            <span aria-hidden="true">{APP_CONFIG.emoji}</span>
            {APP_CONFIG.name}
          </Link>
          <UserMenu user={user} initials={initials} displayName={displayName} logout={logout} />
        </div>
        <nav aria-label="Sections" className="mx-auto flex max-w-6xl gap-2 overflow-x-auto px-4 pb-3">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                cn(
                  'flex h-10 shrink-0 items-center gap-2 rounded-full px-4 text-sm font-semibold transition-colors duration-(--transition-fast)',
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-(--shadow-sm)'
                    : 'bg-muted text-foreground hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring'
                )
              }
            >
              <ApperIcon name={item.icon ?? 'Circle'} size={16} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </header>
      <main>
        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
      </main>
    </div>
  );
}
