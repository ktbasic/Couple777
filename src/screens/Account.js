import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Screen } from '@/components/layout/Screen';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Field';
import { AppIcon } from '@/components/ui/Logo777';
import { readableAuthError, useAuth } from '@/context/auth';
import s from './Account.module.css';
/** Where to come back to after an OAuth round trip. */
function useNext() {
    const [params] = useSearchParams();
    return params.get('next') || '/';
}
export default function AccountScreen() {
    const { signUpWithEmail, signInWithEmail, signInWithProvider, user } = useAuth();
    const navigate = useNavigate();
    const next = useNext();
    const [mode, setMode] = useState('choose');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState(null);
    const [sentConfirmation, setSentConfirmation] = useState(false);
    /*
     * Signing in is not the end of the journey, and this screen has no way of
     * knowing whether a project requires email confirmation — so it waits for a
     * real session rather than guessing, and moves on the moment one appears.
     * Everyone lands on the name step: it is the one thing every account needs
     * and the one thing sign-up no longer asks for.
     */
    useEffect(() => {
        if (!user)
            return;
        navigate(`/me/name?next=${encodeURIComponent(next)}`, { replace: true });
    }, [user, next, navigate]);
    const run = async (fn) => {
        setBusy(true);
        setError(null);
        try {
            await fn();
        }
        catch (e) {
            setError(readableAuthError(e));
        }
        finally {
            setBusy(false);
        }
    };
    if (sentConfirmation) {
        return (_jsx(Screen, { className: s.screen, children: _jsxs("div", { className: s.center, children: [_jsx("span", { className: s.bigEmoji, "aria-hidden": true, children: "\uD83D\uDC8C" }), _jsx("h1", { className: s.title, children: "Check your email" }), _jsxs("p", { className: s.body, children: ["We sent a confirmation link to ", _jsx("strong", { children: email }), ". Open it and you are in."] }), _jsx("button", { type: "button", className: s.link, onClick: () => setSentConfirmation(false), children: "Use a different email" })] }) }));
    }
    return (_jsxs(Screen, { className: s.screen, children: [_jsxs("div", { className: s.top, children: [_jsx(AppIcon, { tone: "on-accent", className: s.icon }), _jsx("h1", { className: s.title, children: "Save your Couple777" }), _jsx("p", { className: s.body, children: "Your memories, plans, and shared space stay connected to your account." })] }), mode === 'choose' ? (_jsxs("div", { className: s.actions, children: [_jsxs(Button, { variant: "secondary", size: "lg", block: true, disabled: busy, onClick: () => void run(() => signInWithProvider('google', next)), children: [_jsx("span", { className: s.mark, "aria-hidden": true, children: _jsx(GoogleMark, {}) }), "Continue with Google"] }), _jsxs(Button, { variant: "secondary", size: "lg", block: true, disabled: busy, onClick: () => void run(() => signInWithProvider('apple', next)), children: [_jsx("span", { className: s.mark, "aria-hidden": true }), "Continue with Apple"] }), _jsx(Button, { variant: "accent", size: "lg", block: true, onClick: () => setMode('email-up'), children: "Continue with email" }), _jsx("button", { type: "button", className: s.link, onClick: () => setMode('email-in'), children: "I already have an account" })] })) : (_jsxs("form", { className: s.form, onSubmit: (e) => {
                    e.preventDefault();
                    void run(async () => {
                        if (mode === 'email-up') {
                            await signUpWithEmail(email, password);
                            // Whether a confirmation email is required is a project
                            // setting, so ask the session rather than assuming: if we are
                            // signed in already, the app moves on by itself.
                            setSentConfirmation(true);
                        }
                        else {
                            await signInWithEmail(email, password);
                        }
                    });
                }, children: [_jsx(Input, { label: "Email", type: "email", inputMode: "email", autoComplete: "email", value: email, onChange: (e) => setEmail(e.target.value), required: true }), _jsx(Input, { label: "Password", type: "password", autoComplete: mode === 'email-up' ? 'new-password' : 'current-password', value: password, onChange: (e) => setPassword(e.target.value), hint: mode === 'email-up' ? 'At least six characters.' : undefined, required: true }), error ? _jsx("p", { className: s.error, children: error }) : null, _jsx(Button, { type: "submit", variant: "accent", size: "lg", block: true, disabled: busy, children: busy ? 'One moment…' : mode === 'email-up' ? 'Create my account' : 'Sign in' }), _jsx("button", { type: "button", className: s.link, onClick: () => setMode(mode === 'email-up' ? 'email-in' : 'email-up'), children: mode === 'email-up' ? 'I already have an account' : 'Create an account instead' }), _jsx("button", { type: "button", className: s.link, onClick: () => setMode('choose'), children: "Back" })] })), mode === 'choose' && error ? _jsx("p", { className: s.error, children: error }) : null, _jsx("p", { className: s.fine, children: "Couple777 is a private space for two. Nothing you write here is public." })] }));
}
/** Google's mark, drawn rather than fetched so the screen has no third-party request. */
function GoogleMark() {
    return (_jsxs("svg", { viewBox: "0 0 48 48", width: "18", height: "18", "aria-hidden": true, children: [_jsx("path", { fill: "#EA4335", d: "M24 9.5c3.5 0 6.6 1.2 9 3.6l6.7-6.7C35.6 2.6 30.2 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.8 6.1C12.3 13.2 17.6 9.5 24 9.5z" }), _jsx("path", { fill: "#4285F4", d: "M46.1 24.6c0-1.6-.1-3.2-.4-4.6H24v9.1h12.4c-.5 2.9-2.2 5.3-4.7 6.9l7.3 5.7c4.3-3.9 6.8-9.8 6.8-17.1z" }), _jsx("path", { fill: "#FBBC05", d: "M10.4 28.7a14.6 14.6 0 0 1 0-9.4l-7.8-6.1a24 24 0 0 0 0 21.6l7.8-6.1z" }), _jsx("path", { fill: "#34A853", d: "M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.3-5.7c-2 1.4-4.7 2.3-8.6 2.3-6.4 0-11.7-3.7-13.6-9.1l-7.8 6.1C6.5 42.6 14.6 48 24 48z" })] }));
}
