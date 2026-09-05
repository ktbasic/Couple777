import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Screen } from '@/components/layout/Screen';
import { AppIcon } from '@/components/ui/Logo777';
import s from './NeedsSetup.module.css';
/**
 * What a build with no Supabase credentials shows.
 *
 * It would be easy to fall back to the old local-only prototype here, and
 * tempting, because the app would look like it worked. It would not: accounts
 * that are not real, a partner who cannot actually join, and everything gone
 * when the tab closes. Better to say plainly what is missing.
 */
export default function NeedsSetupScreen() {
    return (_jsxs(Screen, { className: s.screen, children: [_jsx(AppIcon, { tone: "on-accent", className: s.icon }), _jsx("h1", { className: s.title, children: "Couple777 is not connected yet" }), _jsx("p", { className: s.body, children: "This build has no backend credentials, so there is nowhere to keep an account or a shared space." }), _jsxs("ol", { className: s.steps, children: [_jsxs("li", { children: ["Create a free project at ", _jsx("code", { children: "supabase.com" }), "."] }), _jsxs("li", { children: ["Run ", _jsx("code", { children: "supabase/migrations/0001_init.sql" }), " in its SQL editor."] }), _jsxs("li", { children: ["Copy ", _jsx("code", { children: ".env.example" }), " to ", _jsx("code", { children: ".env.local" }), " and paste in the project URL and anon key."] }), _jsx("li", { children: "Rebuild." })] }), _jsxs("p", { className: s.fine, children: ["The full walkthrough is in ", _jsx("code", { children: "docs/SUPABASE_SETUP.md" }), "."] })] }));
}
