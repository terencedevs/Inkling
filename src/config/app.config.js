/**
 * app.config.js — APP IDENTITY & AUTH CONFIG
 *
 * Branding, theme, and auth configuration only.
 * Routes are self-declared by each page (export const route).
 * Nav items are self-declared by each page (export const nav).
 * Tables are auto-discovered from mockData/*.json files.
 */

export const APP_CONFIG = {
  name: 'MyApp',
  tagline: 'Your app tagline here',
  emoji: '🚀',
  icon: 'Box',

  defaultTheme: 'system',
  defaultLoginRoute: '/login',
};

/**
 * Per-role auth routes and copy.
 * null when the app has no distinct profiles (uses GENERIC_AUTH instead).
 */
export const AUTH_PROFILES = null;

/**
 * Fallback auth copy when AUTH_PROFILES is null or URL profile doesn't match.
 */
export const GENERIC_AUTH = {
  loginTitle: 'Welcome back',
  signupTitle: 'Create account',
  loginDescription: null,
  signupDescription: null,
  redirectAfterAuth: '/dashboard',
};
