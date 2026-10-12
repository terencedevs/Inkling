/**
 * Evaluates whether the current user satisfies a route access rule.
 * Rules are strings from routes.json: 'public', 'authenticated', or
 * JS expressions like "profile === 'Doctor' || profile === 'Receptionist'".
 */
export function verifyRouteAccess(rule, user) {
  if (!rule || rule === 'public') return true;
  if (rule === 'authenticated' || rule === 'private' || rule === 'protected') return !!user;

  if (!user) return false;

  try {
    const profile = user.profile || '';
    // eslint-disable-next-line no-new-func
    const fn = new Function('profile', `return (${rule});`);
    return fn(profile);
  } catch {
    return false;
  }
}
