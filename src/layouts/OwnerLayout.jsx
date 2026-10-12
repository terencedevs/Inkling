import { useState } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { useOwnerLayoutData } from '@/hooks/useOwnerLayoutData';
import { APP_CONFIG } from '@/config/app.config';
import { cn } from '@/lib/utils';
import ApperIcon from '@/components/ApperIcon';
import UserMenu from '@/components/UserMenu';
import { ErrorBoundary } from '@/components/ui/error-boundary';

/**
 * Placeholder owner shell — a plain top bar so the app is navigable before it is designed.
 * Overwrite it with the app's own shell (Platform Contract §12). Whatever the shape, keep
 * the parts: nav from useOwnerLayoutData(), UserMenu once, the page through <Outlet /> in
 * <main>. This is a layout route: it receives no `children` prop.
 */
export default function OwnerLayout() {
  const { user, logout, homeRoute, navItems, navGroups, initials, displayName, counts } = useOwnerLayoutData();
  const grouped = navGroups.length ? navGroups : [{ label: null, items: navItems }];
  const [navOpen, setNavOpen] = useState(false);

  const nav = grouped.map((g, i) => (
    <div key={g.label ?? `g-${i}`} className="flex flex-wrap items-center gap-1">
      {g.label && <span className="px-2 text-xs uppercase tracking-wide text-muted-foreground">{g.label}</span>}
      {g.items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === '/'}
          onClick={() => setNavOpen(false)}
          className={({ isActive }) => cn(
            'flex items-center gap-2 rounded-md px-3 py-2 text-sm',
            isActive ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground',
          )}
        >
          <ApperIcon name={item.icon ?? 'Circle'} size={18} />
          <span>{item.label}</span>
          {counts[item.to] != null && <span className="text-xs text-muted-foreground">{counts[item.to]}</span>}
        </NavLink>
      ))}
    </div>
  ));

  return (
    <div className="min-h-svh bg-background text-foreground">
      <header className="flex h-(--spacing-header) items-center gap-4 border-b border-border px-4">
        <Link to={homeRoute} className="flex items-center gap-2 font-heading text-lg">
          <ApperIcon name={APP_CONFIG.icon} size={20} /> {APP_CONFIG.name}
        </Link>
        <nav className="hidden items-center gap-1 md:flex">{nav}</nav>
        <button type="button" className="md:hidden" aria-label="Toggle navigation" onClick={() => setNavOpen((o) => !o)}>
          <ApperIcon name="Menu" size={22} />
        </button>
        <div className="ml-auto">
          <UserMenu user={user} initials={initials} displayName={displayName} logout={logout} />
        </div>
      </header>
      {navOpen && <nav className="flex flex-col gap-1 border-b border-border p-2 md:hidden">{nav}</nav>}
      <main className="p-4 md:p-6">
        <ErrorBoundary><Outlet /></ErrorBoundary>
      </main>
    </div>
  );
}
