import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './db/schema';

/**
 * The one Supabase client.
 *
 * It is deliberately nullable. Without credentials the app must say so
 * plainly rather than pretend — a prototype that appears to sign you in and
 * then loses your account the moment you close the tab is worse than one that
 * admits it has no backend. Every caller goes through requireDb(), and the
 * shell shows the setup screen when isConfigured() is false.
 */

const url = import.meta.env.VITE_SUPABASE_URL?.trim();
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

const configured = Boolean(url && anonKey && !url.includes('your-project-ref'));

export const supabase: SupabaseClient<Database> | null = configured
  ? createClient<Database>(url!, anonKey!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        // The OAuth providers come back with the session in the URL fragment.
        detectSessionInUrl: true,
        flowType: 'pkce',
      },
    })
  : null;

export function isConfigured(): boolean {
  return configured;
}

export function requireDb(): SupabaseClient<Database> {
  if (!supabase) {
    throw new Error(
      'Couple777 has no Supabase credentials. Copy .env.example to .env.local and fill it in.',
    );
  }
  return supabase;
}

/**
 * Where this build is served from, for invite links and OAuth redirects.
 * Falls back to the address bar so local development needs no configuration.
 */
export function appOrigin(): string {
  const configuredOrigin = import.meta.env.VITE_PUBLIC_APP_URL?.trim();
  if (configuredOrigin) return configuredOrigin.replace(/\/+$/, '');
  return window.location.origin;
}

/** A full link a partner can open, honouring the hash-router build. */
export function appUrl(path: string): string {
  const clean = path.startsWith('/') ? path : `/${path}`;
  const hashRouted = import.meta.env.VITE_ROUTER === 'hash';
  return `${appOrigin()}/${hashRouted ? '#' : ''}${clean.slice(1)}`;
}
