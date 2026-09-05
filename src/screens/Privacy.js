import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/context/store';
import { Button } from '@/components/ui/Button';
import { IconPrivate, IconReveal, IconShared, IconSurprise, } from '@/components/ui/PrivacyIcons';
import s from './Onboarding.module.css';
/**
 * The last screen before the app itself, shown once to each person after they
 * have a space. It comes after couple setup on purpose: the promises only mean
 * something once there is a second person for them to be about.
 *
 * Every line here is enforced in supabase/migrations/0001_init.sql rather than
 * in the UI, which is the only way a promise like this is worth making.
 */
const PRIVACY_CARDS = [
    {
        tone: 'shared',
        Icon: IconShared,
        title: 'Shared',
        body: 'Plans, trips, memories, and conversations you did together.',
    },
    {
        tone: 'private',
        Icon: IconPrivate,
        title: 'Private',
        body: 'Notes and reflections only you can see.',
    },
    {
        tone: 'surprise',
        Icon: IconSurprise,
        title: 'Surprise',
        body: 'Your partner knows something is planned, except the details.',
    },
    {
        tone: 'reveal',
        Icon: IconReveal,
        title: 'Reveal together',
        body: 'Daily answers stay hidden until both of you respond.',
    },
];
const SEEN_KEY = 'couple777:privacy-seen';
export function markPrivacySeen(userId) {
    try {
        window.localStorage.setItem(`${SEEN_KEY}:${userId}`, '1');
    }
    catch {
        /* ignore */
    }
}
export function hasSeenPrivacy(userId) {
    try {
        return window.localStorage.getItem(`${SEEN_KEY}:${userId}`) === '1';
    }
    catch {
        return true;
    }
}
export default function PrivacyScreen() {
    const navigate = useNavigate();
    const { state } = useStore();
    /* Each card keeps its own state. Closing one because another was opened
       takes the choice away from the person reading: four short explanations
       are worth comparing side by side, and a card that shuts itself while you
       are looking at the next one is a card you have to go back for. */
    const [open, setOpen] = useState(() => new Set());
    const toggle = (tone) => setOpen((current) => {
        const next = new Set(current);
        if (!next.delete(tone))
            next.add(tone);
        return next;
    });
    return (_jsx("div", { className: s.frame, children: _jsxs("div", { className: s.app, children: [_jsx("div", { className: s.body, children: _jsxs("div", { className: s.step, children: [_jsx("h1", { className: s.title, children: "How your space works" }), _jsx("p", { className: s.lede, children: "Some things are shared, some stay private, and some only reveal when you\u2019re both ready." }), _jsx("p", { className: s.privacyHint, children: "Tap each card to see how it works" }), _jsx("div", { className: s.privacyGrid, children: PRIVACY_CARDS.map((card, i) => (_jsx("button", { type: "button", className: s.privacyCard, "data-tone": card.tone, "aria-pressed": open.has(card.tone), onClick: () => toggle(card.tone), style: {
                                        animationDelay: `${i * 90}ms`,
                                        // Staggered so the four never catch the light together.
                                        ['--sheen-delay']: `${i * 800}ms`,
                                    }, children: _jsxs("span", { className: s.privacyInner, children: [_jsxs("span", { className: [s.privacyFace, s.privacyFront].join(' '), children: [_jsx(card.Icon, { size: 34 }), _jsx("span", { className: s.privacyTitle, children: card.title })] }), _jsx("span", { className: [s.privacyFace, s.privacyBack].join(' '), children: _jsx("span", { className: s.privacyBody, children: card.body }) })] }) }, card.tone))) })] }) }), _jsx("div", { className: s.foot, children: _jsx(Button, { variant: "accent", size: "lg", block: true, onClick: () => {
                            markPrivacySeen(state.couple.currentPersonId);
                            navigate('/', { replace: true });
                        }, children: "Open our space" }) })] }) }));
}
