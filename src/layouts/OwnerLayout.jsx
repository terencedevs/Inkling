import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { useOwnerLayoutData } from '@/hooks/useOwnerLayoutData';
import { APP_CONFIG } from '@/config/app.config';
import { cn } from '@/lib/utils';
import ApperIcon from '@/components/ApperIcon';
import NamePrompt from '@/components/NamePrompt';
import UserMenu from '@/components/UserMenu';
import { useNickname } from '@/components/useNickname';
import { ErrorBoundary } from '@/components/ui/error-boundary';

const FAB_ROUTES = ['/', '/dates', '/calendar'];

// An Android-style shell: top app bar, scrolling content, a floating action button and a bottom
// navigation bar. On a desktop browser it sits in a phone-sized frame so it reads as a mobile app.
export default function OwnerLayout() {
  const { user, logout, homeRoute, navItems, initials, displayName } = useOwnerLayoutData();
  const { pathname } = useLocation();
  const { loading, name, save } = useNickname();
  const showFab = FAB_ROUTES.includes(pathname);

  return (
    <div className="min-h-svh bg-muted md:flex md:items-center md:justify-center md:p-6">
      <div className="relative mx-auto flex h-svh w-full max-w-md flex-col overflow-hidden bg-background text-foreground md:h-[min(52rem,calc(100svh-3rem))] md:rounded-[2.5rem] md:border md:border-border md:shadow-(--shadow-lg)">
        <header className="flex h-14 shrink-0 items-center justify-between bg-primary px-4 text-primary-foreground">
          <Link to={homeRoute} className="flex items-center gap-2 font-heading text-xl">
            <span aria-hidden="true">{APP_CONFIG.emoji}</span>
            {APP_CONFIG.name}
          </Link>
          <UserMenu user={user} initials={initials} displayName={displayName} logout={logout} />
        </header>

        <main className="min-h-0 flex-1 overflow-y-auto pb-24">
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </main>

        {showFab && (
          <Link
            to="/notes/new"
            aria-label="New note"
            className="absolute bottom-24 right-4 z-(--z-sticky) flex h-14 items-center gap-2 rounded-2xl bg-highlight px-5 font-semibold text-highlight-foreground shadow-(--shadow-lg) transition-transform duration-(--transition-fast) hover:scale-105 active:scale-95 focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none"
          >
            <ApperIcon name="Plus" size={22} />
            New note
          </Link>
        )}

        <nav aria-label="Main" className="flex shrink-0 border-t border-border bg-card px-2 pb-2 pt-2">
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.to === '/'} className="flex flex-1 flex-col items-center gap-1 rounded-xl py-1 text-xs font-semibold focus-visible:ring-2 focus-visible:ring-ring">
              {({ isActive }) => (
                <>
                  <span
                    className={cn(
                      'flex h-8 w-16 items-center justify-center rounded-full transition-colors duration-(--transition-normal)',
                      isActive ? 'bg-secondary text-secondary-foreground' : 'text-muted-foreground'
                    )}
                  >
                    <ApperIcon name={item.icon ?? 'Circle'} size={20} />
                  </span>
                  <span className={isActive ? 'text-foreground' : 'text-muted-foreground'}>{item.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <NamePrompt open={!loading && !name} onSave={save} />
      </div>
    </div>
  );
}
