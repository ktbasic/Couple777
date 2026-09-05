import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Screen } from '@/components/layout/Screen';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Field';
import { Avatar } from '@/components/ui/Avatar';
import { AvatarPicker } from '@/features/AvatarPicker';
import { useAuth } from '@/context/auth';
import { useStore } from '@/context/store';
import * as repo from '@/lib/db/repo';
import { pendingOnboarding, clearPendingOnboarding } from '@/lib/pendingOnboarding';
import s from './MeSetup.module.css';
const WHAT_HELPS = [
    { value: 'time', label: 'Just having the time booked', emoji: '📅' },
    { value: 'ideas', label: 'Ideas, so we stop deciding', emoji: '💡' },
    { value: 'nudge', label: 'A nudge when it has been a while', emoji: '🔔' },
    { value: 'memories', label: 'Keeping what we did', emoji: '📸' },
];
/**
 * The short way in, for the partner who arrived through an invite link.
 *
 * They are not asked for anything the first person already answered — how long
 * you have been together, where you live, how far apart you are. That is the
 * couple's, and it is already there. This asks only for what is theirs: their
 * name, their face, and one thing about what they want out of it.
 */
export default function MeSetupScreen() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { me, state, refresh } = useStore();
    const [name, setName] = useState(me.name === 'You' ? '' : me.name);
    const [helps, setHelps] = useState(null);
    const [picking, setPicking] = useState(false);
    const [busy, setBusy] = useState(false);
    const partner = state.couple.people.find((p) => p.id !== me.id);
    const save = async () => {
        if (!user)
            return;
        setBusy(true);
        try {
            const pending = pendingOnboarding();
            await repo.upsertProfile(user.id, {
                display_name: name.trim() || me.name,
                avatar_type: me.avatarUrl ? 'photo' : 'avatar',
                avatar_value: me.avatarUrl ?? me.avatarId ?? null,
                date_preferences: { ...pending?.datePreferences, helps },
            });
            clearPendingOnboarding();
            await refresh();
            navigate('/', { replace: true });
        }
        finally {
            setBusy(false);
        }
    };
    return (_jsxs(Screen, { className: s.screen, children: [_jsxs("div", { className: s.top, children: [_jsxs("h1", { className: s.title, children: ["You're in", partner?.name ? `, with ${partner.name}` : '', " \u2764\uFE0F"] }), _jsx("p", { className: s.body, children: "Two quick things, and they are only about you." })] }), _jsxs("button", { type: "button", className: s.avatarButton, onClick: () => setPicking(true), children: [_jsx(Avatar, { person: me, size: 92 }), _jsx("span", { className: s.avatarHint, children: "Choose your look" })] }), _jsx(Input, { label: "Your name", value: name, onChange: (e) => setName(e.target.value), placeholder: "Type your name" }), _jsxs("fieldset", { className: s.group, children: [_jsx("legend", { className: s.legend, children: "What would help most?" }), _jsx("div", { className: s.options, children: WHAT_HELPS.map((o) => (_jsxs("button", { type: "button", className: s.option, "data-on": helps === o.value || undefined, onClick: () => setHelps(helps === o.value ? null : o.value), children: [_jsx("span", { "aria-hidden": true, children: o.emoji }), o.label] }, o.value))) })] }), _jsx(Button, { variant: "accent", size: "lg", block: true, disabled: busy, onClick: () => void save(), children: busy ? 'Saving…' : 'Continue' }), _jsx(AvatarPicker, { person: me, open: picking, onClose: () => setPicking(false) })] }));
}
