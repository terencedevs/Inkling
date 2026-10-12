import { useMemo } from 'react';
import { useAuth } from '@/layouts/RootLayout';
import { APP_CONFIG, AUTH_PROFILES, GENERIC_AUTH } from '@/config/app.config';
import { useFetch } from '@/hooks/useFetch';
import { sdk } from '@/services/sdk';

// Auto-discover nav items and footer pages from page exports
const pageMods = import.meta.glob('/src/pages/**/*.jsx', { eager: true });

const discoveredNavItems = Object.entries(pageMods)
  .filter(([, mod]) => mod.nav)
  .map(([, mod]) => { const to = mod.nav.to ?? mod.route?.path; return { ...mod.nav, to, path: to, href: to }; })
  .sort((a, b) => (a.order ?? 99) - (b.order ?? 99));

const navPaths = new Set(discoveredNavItems.map((n) => n.to));
const footerPages = Object.entries(pageMods)
  .filter(([, mod]) => mod.route && mod.route.layout === 'owner' && mod.route.access !== 'public' && !mod.route.path.includes(':') && !navPaths.has(mod.route.path))
  .map(([, mod]) => ({ ...mod.route, to: mod.route.path, href: mod.route.path }));

const countItems = discoveredNavItems.filter((item) => item.count?.table);

async function fetchCounts() {
  if (!countItems.length) return {};
  const results = await Promise.all(countItems.map((item) =>
    sdk.table(item.count.table)
      .select([{ field: 'Id' }])
      .aggregate([{ id: 'c', fields: [{ field: 'Id', fn: 'Count', alias: 'count' }], ...(item.count.where ? { where: item.count.where } : {}) }])
      .limit(1)
      .fetch()
  ));
  const counts = {};
  countItems.forEach((item, i) => {
    const bucket = results[i]?.aggregators?.find((a) => a.id === 'c');
    counts[item.to] = bucket?.data?.count ?? bucket?.count ?? bucket?.value ?? 0;
  });
  return counts;
}

// The single data source for OwnerLayout: auth, nav discovery, profile filtering,
// section grouping, footer pages, nav count badges, and the post-login home route.
export function useOwnerLayoutData() {
  const { logout, user } = useAuth();

  // "Home" for a signed-in user is their profile's post-login route, matching AuthPage.
  const homeRoute = useMemo(() => {
    const matched = AUTH_PROFILES?.find((p) => p.name === user?.profile);
    return matched?.redirectAfterAuth ?? GENERIC_AUTH?.redirectAfterAuth ?? '/';
  }, [user?.profile]);

  const navItems = useMemo(
    () => discoveredNavItems.filter((item) => !item.profiles || item.profiles.includes(user?.profile)),
    [user?.profile]
  );

  const navGroups = useMemo(() => {
    const groups = [];
    const byLabel = new Map();
    for (const item of navItems) {
      const groupLabel = item.section ?? null;
      let group = groupLabel != null ? byLabel.get(groupLabel) : null;
      if (!group) {
        group = { label: groupLabel, items: [] };
        groups.push(group);
        if (groupLabel != null) byLabel.set(groupLabel, group);
      }
      group.items.push(item);
    }
    return groups;
  }, [navItems]);

  const initials = `${user?.firstName?.[0] ?? ''}${user?.lastName?.[0] ?? ''}`.toUpperCase()
    || APP_CONFIG.name.slice(0, 2).toUpperCase();
  const displayName = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || user?.emailAddress;

  const { data: counts, run: refreshCounts } = useFetch(fetchCounts, []);

  return { user, logout, homeRoute, navItems, navGroups, footerPages, initials, displayName, counts: counts ?? {}, refreshCounts };
}
