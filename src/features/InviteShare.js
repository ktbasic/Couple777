import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Screen } from '@/components/layout/Screen';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { useStore } from '@/context/store';
import { appUrl } from '@/lib/supabase';
import { shareInvite } from '@/lib/share';
import s from './InviteShare.module.css';
/**
 * "Bring Marian in ❤️".
 *
 * The prototype used to claim the partner had joined as soon as you tapped
 * share. It says nothing of the kind now: joined is whether a second account
 * has actually taken the seat, and until then this screen only ever offers to
 * ask again.
 */
export function InviteShare({ partnerName, onDone, }) {
    const { state, me, refresh } = useStore();
    const toast = useToast();
    const [checking, setChecking] = useState(false);
    const name = (partnerName || state.couple.people[1]?.name || 'your partner').trim();
    const code = state.couple.inviteCode;
    const link = appUrl(`/join/${code}`);
    const joined = state.couple.partnerJoined;
    const text = `${me.name} invited you to Couple777 ❤️\n\nJoin our shared 777 space:\n${link}\n\nCode: ${code}`;
    const share = async () => {
        const outcome = await shareInvite(text, 'Couple777');
        if (outcome.method === 'clipboard') {
            toast.show({ emoji: '📋', message: 'Invite copied — paste it anywhere' });
        }
        else if (outcome.method === 'failed') {
            toast.show({ message: "Couldn't open sharing. The code is on screen to copy." });
        }
    };
    const check = async () => {
        setChecking(true);
        await refresh();
        setChecking(false);
    };
    if (joined) {
        return (_jsx(Screen, { className: s.screen, children: _jsxs("div", { className: s.center, children: [_jsx("span", { className: s.bigEmoji, "aria-hidden": true, children: "\uD83C\uDF89" }), _jsxs("h1", { className: s.title, children: [state.couple.people[1]?.name ?? name, " joined"] }), _jsx("p", { className: s.body, children: "Your 777 starts now. Everything you plan, you plan together." }), _jsx(Button, { variant: "accent", size: "lg", block: true, onClick: onDone, children: "Let's go" })] }) }));
    }
    return (_jsxs(Screen, { className: s.screen, children: [_jsxs("div", { className: s.top, children: [_jsxs("h1", { className: s.title, children: ["Bring ", name, " in \u2764\uFE0F"] }), _jsx("p", { className: s.body, children: "Your Couple777 space is ready." }), _jsxs("p", { className: s.body, children: ["Invite ", name, " so you can plan, answer, and remember things together."] })] }), _jsxs("div", { className: s.codeCard, children: [_jsx("p", { className: s.codeLabel, children: "Your invite code" }), _jsx("p", { className: s.code, children: code }), _jsxs("p", { className: s.codeHint, children: [name, " can enter this, or just open your link."] })] }), _jsxs("div", { className: s.actions, children: [_jsx(Button, { variant: "accent", size: "lg", block: true, onClick: () => void share(), children: "Share invite" }), _jsx(Button, { variant: "quiet", block: true, disabled: checking, onClick: () => void check(), children: checking ? 'Checking…' : `Check if ${name} has joined` }), _jsx("button", { type: "button", className: s.link, onClick: onDone, children: "I'll do this later" })] })] }));
}
