import { createClient } from '@supabase/supabase-js';
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
/**
 * The browser-safe key, under either of the two names Supabase has given it.
 *
 * Projects created before the 2025 key rotation show it as "anon public" and
 * it is a JWT; newer ones show it as "publishable" and it looks like
 * `sb_publishable_...`. They are the same thing as far as this app is
 * concerned — both are safe in a bundle because RLS, not the key, decides who
 * reads what — and a deployment that sets only the name the code did not
 * happen to check would silently fall back to the setup screen. So check both.
 */
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim() ||
    import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();
const configured = Boolean(url && publishableKey && !url.includes('your-project-ref'));
export const supabase = configured
    ? createClient(url, publishableKey, {
        auth: {
            persistSession: true,
            autoRefreshToken: true,
            // The OAuth providers come back with the session in the URL fragment.
            detectSessionInUrl: true,
            flowType: 'pkce',
        },
    })
    : null;
export function isConfigured() {
    return configured;
}
export function requireDb() {
    if (!supabase) {
        throw new Error('Couple777 has no Supabase credentials. Set VITE_SUPABASE_URL and ' +
            'VITE_SUPABASE_PUBLISHABLE_KEY (or VITE_SUPABASE_ANON_KEY) — see .env.example.');
    }
    return supabase;
}
/**
 * Where this build is served from, for invite links and OAuth redirects.
 * Falls back to the address bar so local development needs no configuration.
 */
export function appOrigin() {
    const configuredOrigin = import.meta.env.VITE_PUBLIC_APP_URL?.trim();
    if (configuredOrigin)
        return configuredOrigin.replace(/\/+$/, '');
    return window.location.origin;
}
/** A full link a partner can open, honouring the hash-router build. */
export function appUrl(path) {
    const clean = path.startsWith('/') ? path : `/${path}`;
    const hashRouted = import.meta.env.VITE_ROUTER === 'hash';
    return `${appOrigin()}/${hashRouted ? '#' : ''}${clean.slice(1)}`;
}
