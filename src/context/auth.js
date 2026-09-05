import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { appUrl, isConfigured, supabase } from '@/lib/supabase';
const AuthContext = createContext(null);
/**
 * Supabase speaks in error codes and provider jargon. People do not, and a
 * sign-in screen is exactly where an unhelpful message costs you the user.
 */
export function readableAuthError(error) {
    const raw = error instanceof Error ? error.message : String(error ?? '');
    const m = raw.toLowerCase();
    if (m.includes('invalid login credentials'))
        return "That email and password don't match.";
    if (m.includes('user already registered') || m.includes('already been registered')) {
        return 'There is already an account with that email. Try signing in instead.';
    }
    if (m.includes('password should be at least'))
        return 'Use at least six characters.';
    if (m.includes('unable to validate email') || m.includes('invalid email')) {
        return "That email address doesn't look right.";
    }
    if (m.includes('email not confirmed')) {
        return 'Check your inbox and confirm your email first.';
    }
    if (m.includes('provider is not enabled')) {
        return 'That sign-in method is not switched on for this Couple777 yet.';
    }
    if (m.includes('rate limit') || m.includes('too many')) {
        return 'Too many tries just now. Give it a minute.';
    }
    if (m.includes('failed to fetch') || m.includes('networkerror')) {
        return "Couldn't reach Couple777. Check your connection.";
    }
    return raw || 'Something went wrong. Try again.';
}
export function AuthProvider({ children }) {
    const configured = isConfigured();
    const [session, setSession] = useState(null);
    const [loading, setLoading] = useState(configured);
    useEffect(() => {
        if (!supabase)
            return;
        let alive = true;
        supabase.auth.getSession().then(({ data }) => {
            if (!alive)
                return;
            setSession(data.session);
            setLoading(false);
        });
        // Covers sign-in, sign-out, token refresh and the OAuth redirect landing.
        const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
            setSession(next);
            setLoading(false);
        });
        return () => {
            alive = false;
            sub.subscription.unsubscribe();
        };
    }, []);
    /*
      * Deliberately no display name here. An email address is a login, not a
      * name, and a sign-up form that asks for both in one breath is where the
      * two get conflated. The account is created nameless and /me/name asks
      * properly, once, on a screen of its own.
      */
    const signUpWithEmail = useCallback(async (email, password) => {
        if (!supabase)
            throw new Error('Couple777 is not connected to a backend yet.');
        const { error } = await supabase.auth.signUp({ email: email.trim(), password });
        if (error)
            throw error;
    }, []);
    const signInWithEmail = useCallback(async (email, password) => {
        if (!supabase)
            throw new Error('Couple777 is not connected to a backend yet.');
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error)
            throw error;
    }, []);
    const signInWithProvider = useCallback(async (provider, next) => {
        if (!supabase)
            throw new Error('Couple777 is not connected to a backend yet.');
        const { error } = await supabase.auth.signInWithOAuth({
            provider,
            // Come back where you left off — an invited partner must land back on
            // their invite, not on a generic home screen.
            options: { redirectTo: appUrl(next ?? '/') },
        });
        if (error)
            throw error;
    }, []);
    const signOut = useCallback(async () => {
        if (!supabase)
            return;
        await supabase.auth.signOut();
    }, []);
    const value = useMemo(() => ({
        session,
        user: session?.user ?? null,
        loading,
        configured,
        signUpWithEmail,
        signInWithEmail,
        signInWithProvider,
        signOut,
    }), [session, loading, configured, signUpWithEmail, signInWithEmail, signInWithProvider, signOut]);
    return _jsx(AuthContext.Provider, { value: value, children: children });
}
export function useAuth() {
    const v = useContext(AuthContext);
    if (!v)
        throw new Error('useAuth must be used inside <AuthProvider>');
    return v;
}
