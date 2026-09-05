import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { savePendingOnboarding } from '@/lib/pendingOnboarding';
import { AppIcon } from '@/components/ui/Logo777';
import { CosmicPair } from '@/components/ui/CosmicPair';
import { Button } from '@/components/ui/Button';
import s from './Onboarding.module.css';
/*
 * Welcome, what you want out of this, your vibe, then the 777 rule — and then
 * the account.
 *
 * The couple's own details (their names, how long, how far apart) used to live
 * here too. They have moved to /couple, after sign-up, for two reasons: the
 * second partner arrives through an invite link and must never be asked to
 * re-enter what the first one already answered, and asking anybody to describe
 * their relationship before they know what the app is gets the app closed.
 */
const STEPS = 4;
const WISHES = [
    { value: 'romance', label: 'More romance', emoji: '🌹' },
    { value: 'conversation', label: 'Deeper conversations', emoji: '💬' },
    { value: 'fun', label: 'More fun', emoji: '🎲' },
    { value: 'adventure', label: 'More adventures', emoji: '🧭' },
    { value: 'quality-time', label: 'More quality time', emoji: '🕰' },
    { value: 'spontaneity', label: 'More spontaneity', emoji: '✨' },
];
const VIBES = [
    { value: 'cozy', label: 'Cozy & relaxed', emoji: '🕯️' },
    { value: 'romantic', label: 'Romantic', emoji: '🌹' },
    { value: 'playful', label: 'Playful', emoji: '🤸' },
    { value: 'creative', label: 'Creative', emoji: '🎨' },
    { value: 'adventurous', label: 'Adventurous', emoji: '⛰️' },
    { value: 'exploring', label: 'Always exploring', emoji: '🗺️' },
];
export default function OnboardingScreen() {
    const navigate = useNavigate();
    const [step, setStep] = useState(0);
    const [wishes, setWishes] = useState([]);
    const [vibes, setVibes] = useState([]);
    const next = () => setStep((n) => Math.min(STEPS - 1, n + 1));
    const back = () => setStep((n) => Math.max(0, n - 1));
    /*
     * The answers so far belong to a person who does not have an account yet, so
     * they wait in this browser and move to the profile the moment one exists.
     */
    const finish = () => {
        savePendingOnboarding({
            datePreferences: { wishes, vibes },
            coupleProfile: {
                wishes,
                status: 'unsaid',
                proximity: 'together',
                vibes,
            },
        });
        navigate('/account');
    };
    const canContinue = true;
    const primaryLabel = (() => {
        switch (step) {
            case 0: return 'Start';
            case STEPS - 1: return "Let's try 777";
            default: return 'Continue';
        }
    })();
    const onPrimary = () => {
        if (step === STEPS - 1)
            return finish();
        next();
    };
    return (_jsx("div", { className: s.frame, children: _jsxs("div", { className: s.app, children: [_jsx("div", { className: s.progress, "aria-hidden": true, children: Array.from({ length: STEPS }).map((_, i) => (_jsx("span", { className: [s.tick, i <= step ? s.tickOn : ''].filter(Boolean).join(' ') }, i))) }), _jsxs("div", { className: s.body, children: [step === 0 ? _jsx(Welcome, {}) : null, step === 1 ? _jsx(WishStep, { wishes: wishes, onChange: setWishes }) : null, step === 2 ? _jsx(VibeStep, { vibes: vibes, onChange: setVibes }) : null, step === 3 ? _jsx(Rule, {}) : null] }), _jsxs("div", { className: s.foot, children: [_jsx(Button, { variant: "accent", size: "lg", block: true, disabled: !canContinue, onClick: onPrimary, children: primaryLabel }), step > 0 ? (_jsx("button", { type: "button", className: s.back, onClick: back, children: "Back" })) : null] })] }) }));
}
/* --------------------------------- Steps --------------------------------- */
/*
 * The illustration is the hero here, so the step is a column that fills the
 * body: title and lede at the top, the pair in the middle taking whatever room
 * is left, and the warm line pushed down to sit just above the button as the
 * last thing read before tapping it.
 */
function Welcome() {
    return (_jsxs("div", { className: [s.step, s.welcome].join(' '), children: [_jsxs("div", { className: s.mark, children: [_jsx(AppIcon, { tone: "on-accent", className: s.markGlyph }), _jsx("span", { className: s.markWord, children: "Couple777" })] }), _jsx("p", { className: s.eyebrow, children: "A private space for two" }), _jsx("h1", { className: [s.title, s.titleWelcome].join(' '), children: "In a huge universe, you found each other." }), _jsx("p", { className: s.lede, children: "Couple777 helps make sure the good stuff doesn't keep getting postponed." }), _jsx("div", { className: s.hero, children: _jsx(CosmicPair, {}) }), _jsx("p", { className: s.warmLine, children: "Starting is already a pretty good sign. \u2764\uFE0F" })] }));
}
/** Shared multi-select with a cap, used by both taste questions. */
function OptionGroup({ options, selected, max, onChange, }) {
    const toggle = (v) => {
        if (selected.includes(v))
            onChange(selected.filter((x) => x !== v));
        // At the cap, the oldest choice makes room rather than the tap doing nothing.
        else if (selected.length >= max)
            onChange([...selected.slice(1), v]);
        else
            onChange([...selected, v]);
    };
    return (_jsx("div", { className: s.options, children: options.map((o) => {
            const on = selected.includes(o.value);
            return (_jsxs("button", { type: "button", "aria-pressed": on, className: [s.option, on ? s.optionOn : ''].filter(Boolean).join(' '), onClick: () => toggle(o.value), children: [o.emoji ? _jsx("span", { "aria-hidden": true, children: o.emoji }) : null, o.label] }, o.value));
        }) }));
}
function WishStep({ wishes, onChange }) {
    return (_jsxs("div", { className: s.step, children: [_jsx("p", { className: s.eyebrow, children: "A little about you two" }), _jsx("h1", { className: s.title, children: "What would you love more of together?" }), _jsxs("div", { className: s.question, children: [_jsxs("p", { className: s.qLabel, children: ["Pick what fits ", _jsx("span", { className: s.qHint, children: "Up to 2" })] }), _jsx(OptionGroup, { options: WISHES, selected: wishes, max: 2, onChange: onChange })] })] }));
}
function VibeStep({ vibes, onChange }) {
    return (_jsxs("div", { className: s.step, children: [_jsx("p", { className: s.eyebrow, children: "A little about you two" }), _jsx("h1", { className: s.title, children: "What feels most like you two?" }), _jsxs("div", { className: s.question, children: [_jsxs("p", { className: s.qLabel, children: ["Pick what fits ", _jsx("span", { className: s.qHint, children: "Up to 3" })] }), _jsx(OptionGroup, { options: VIBES, selected: vibes, max: 3, onChange: onChange })] })] }));
}
const RULE_PARTS = [
    {
        tier: 'day',
        unit: '7 days',
        headline: 'Make time for each other.',
        body: 'A date, a quiet dinner, or two hours that are just yours.',
    },
    {
        tier: 'week',
        unit: '7 weeks',
        headline: 'Go somewhere together.',
        body: 'A day trip, small getaway, or something outside your normal routine.',
    },
    {
        tier: 'month',
        unit: '7 months',
        headline: 'Make a bigger memory.',
        body: "Travel somewhere new. Try something you'll still talk about years later.",
    },
];
function Rule() {
    // The three parts land one after another — this is the moment the product
    // is named for, so it is choreographed rather than just rendered.
    const [revealed, setRevealed] = useState(0);
    useEffect(() => {
        const timers = RULE_PARTS.map((_, i) => window.setTimeout(() => setRevealed(i + 1), 260 + i * 520));
        timers.push(window.setTimeout(() => setRevealed(RULE_PARTS.length + 1), 260 + RULE_PARTS.length * 520));
        return () => timers.forEach(window.clearTimeout);
    }, []);
    return (_jsxs("div", { className: s.step, children: [_jsxs("div", { className: s.ruleHead, children: [_jsx("span", { className: s.ruleBadge, children: "The 777 rule" }), _jsx("h1", { className: s.ruleTitle, children: "Have you heard of the 777 Rule?" }), _jsx("p", { className: s.ruleLede, children: "A simple rhythm for keeping your relationship from running on autopilot." })] }), _jsx("div", { className: s.rules, children: RULE_PARTS.map((part, i) => (_jsxs("div", { className: [s.rule, revealed > i ? s.ruleIn : ''].filter(Boolean).join(' '), "data-tier": part.tier, children: [_jsx("span", { className: s.ruleNum, children: "7" }), _jsxs("div", { children: [_jsx("p", { className: s.ruleUnit, children: part.unit }), _jsx("p", { className: s.ruleHeadline, children: part.headline }), _jsx("p", { className: s.ruleBody, children: part.body })] })] }, part.tier))) }), _jsx("p", { className: [s.ruleClose, revealed > RULE_PARTS.length ? s.ruleCloseIn : '']
                    .filter(Boolean)
                    .join(' '), children: "Small moments. Regular adventures. Big memories." })] }));
}
