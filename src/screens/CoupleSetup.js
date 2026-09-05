import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Screen } from '@/components/layout/Screen';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Field';
import { CosmicGreeter } from '@/components/ui/CosmicPair';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/context/auth';
import { useStore } from '@/context/store';
import * as repo from '@/lib/db/repo';
import { pendingOnboarding, clearPendingOnboarding } from '@/lib/pendingOnboarding';
import { today } from '@/lib/dates';
import { createInitialCycles } from '@/lib/cycles';
import { InviteShare } from '@/features/InviteShare';
import s from './CoupleSetup.module.css';
/* Stored as free text on the couple row, so 'other' needs no migration. */
const RELATIONSHIP = [
    { value: 'dating', label: 'Dating', emoji: '💞' },
    { value: 'engaged', label: 'Engaged', emoji: '💍' },
    { value: 'married', label: 'Married', emoji: '🤍' },
    { value: 'other', label: 'Something else', emoji: '✨' },
    { value: 'unsaid', label: 'Rather not say', emoji: '🤫' },
];
/* The same five as the name step, asked about the other person. */
const IDENTITIES = [
    { value: 'woman', label: 'Woman' },
    { value: 'man', label: 'Man' },
    { value: 'non-binary', label: 'Non-binary' },
    { value: 'self-describe', label: 'Self-describe' },
    { value: 'unsaid', label: 'Prefer not to say' },
];
const CLOSENESS = [
    { value: 'together', label: 'We live together', emoji: '🏠' },
    { value: 'same-area', label: 'Same city', emoji: '🚲' },
    { value: 'different-cities', label: 'Different cities', emoji: '🚆' },
    { value: 'long-distance', label: 'Long distance', emoji: '✈️' },
];
export default function CoupleSetupScreen() {
    const navigate = useNavigate();
    const [params] = useSearchParams();
    const { user } = useAuth();
    const { refresh, state, coupleId } = useStore();
    const toast = useToast();
    const [step, setStep] = useState(params.get('code') ? 'join' : 'choose');
    /** Which of the five questions is on screen, once step is 'create'. */
    const [q, setQ] = useState(0);
    const [nameChecked, setNameChecked] = useState(false);
    const [partnerName, setPartnerName] = useState('');
    const [partnerGender, setPartnerGender] = useState('');
    const [partnerCity, setPartnerCity] = useState('');
    const [partnerGenderNote, setPartnerGenderNote] = useState('');
    const [since, setSince] = useState('');
    const [status, setStatus] = useState('');
    const [distance, setDistance] = useState('');
    const [homeBase, setHomeBase] = useState('');
    const [code, setCode] = useState(params.get('code') ?? '');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState(null);
    /*
     * Nobody makes a space before they have a name.
     *
     * Not just tidiness: the very next screen says "Bring Marian in" and the
     * invitation it sends is signed by whoever is sending it. An account that
     * skipped the name step — an OAuth provider that gave us nothing, a session
     * restored from an older build — would send a nameless invitation, so it
     * gets asked here rather than papered over.
     */
    useEffect(() => {
        if (!user) {
            setNameChecked(true);
            return;
        }
        let alive = true;
        void (async () => {
            try {
                const profile = await repo.getProfile(user.id);
                if (!alive)
                    return;
                if (!profile?.display_name?.trim()) {
                    navigate('/me/name?next=/couple', { replace: true });
                    return;
                }
            }
            catch {
                // A lookup that fails must not strand anyone in setup with no way on.
            }
            if (alive)
                setNameChecked(true);
        })();
        return () => {
            alive = false;
        };
    }, [user, navigate]);
    // Someone arriving here who already has a space (a stale tab, a back
    // button) belongs in the app, not in setup.
    useEffect(() => {
        if (coupleId && step !== 'invite')
            navigate('/', { replace: true });
    }, [coupleId, step, navigate]);
    if (!nameChecked)
        return null;
    const create = async () => {
        if (!user)
            return;
        setBusy(true);
        setError(null);
        try {
            // The answers given before signing up were held in this browser only.
            // Now there is an account to attach them to.
            const pending = pendingOnboarding();
            if (pending?.displayName) {
                await repo.upsertProfile(user.id, {
                    display_name: pending.displayName,
                    avatar_type: pending.avatarId ? 'avatar' : 'avatar',
                    avatar_value: pending.avatarId ?? null,
                    date_preferences: pending.datePreferences ?? {},
                    relationship_preferences: pending.relationshipPreferences ?? {},
                    home_base: homeBase || null,
                });
            }
            const couple = await repo.createCouple(user.id, {
                partnerName,
                togetherSince: since || undefined,
                relationshipStatus: status || 'unsaid',
                distanceSetup: distance || undefined,
                homeBase: homeBase || undefined,
                profile: {
                    ...(pending?.coupleProfile ?? state.couple.profile),
                    ...(partnerGender
                        ? {
                            partnerGender,
                            ...(partnerGender === 'self-describe' && partnerGenderNote.trim()
                                ? { partnerGenderNote: partnerGenderNote.trim() }
                                : {}),
                        }
                        : {}),
                    ...(partnerCity.trim() ? { partnerCity: partnerCity.trim() } : {}),
                },
                rhythmStart: today(),
            });
            // The three clocks start the moment the space exists.
            await repo.seedCycles(couple.id, createInitialCycles(couple.rhythm_start?.slice(0, 10) || today()).map((c) => ({
                tier: c.tier,
                seq: c.seq,
                startDate: c.startDate,
                dueDate: c.dueDate,
            })));
            clearPendingOnboarding();
            await refresh();
            setStep('invite');
        }
        catch (e) {
            setError(e instanceof Error ? e.message : String(e));
        }
        finally {
            setBusy(false);
        }
    };
    const join = async () => {
        setBusy(true);
        setError(null);
        try {
            await repo.joinCoupleByCode(code);
            const pending = pendingOnboarding();
            if (user && pending?.displayName) {
                await repo.upsertProfile(user.id, {
                    display_name: pending.displayName,
                    avatar_value: pending.avatarId ?? null,
                    date_preferences: pending.datePreferences ?? {},
                });
            }
            clearPendingOnboarding();
            await refresh();
            toast.show({ emoji: '🎉', message: "You're in. Welcome to your 777." });
            navigate('/me/setup', { replace: true });
        }
        catch (e) {
            setError(e instanceof Error ? e.message : String(e));
        }
        finally {
            setBusy(false);
        }
    };
    if (step === 'invite') {
        return _jsx(InviteShare, { partnerName: partnerName, onDone: () => navigate('/', { replace: true }) });
    }
    if (step === 'choose') {
        return (_jsxs(Screen, { className: s.screen, children: [_jsxs("div", { className: s.top, children: [_jsx("h1", { className: s.title, children: "How do you want to start?" }), _jsx("p", { className: s.body, children: "Couple777 is built for two. One of you starts the space, the other joins with a code." })] }), _jsxs("div", { className: s.actions, children: [_jsx(Button, { variant: "accent", size: "lg", block: true, onClick: () => setStep('create'), children: "Create our space" }), _jsx(Button, { variant: "secondary", size: "lg", block: true, onClick: () => setStep('join'), children: "I have an invite" })] })] }));
    }
    if (step === 'join') {
        return (_jsxs(Screen, { className: s.screen, children: [_jsxs("div", { className: s.top, children: [_jsx("h1", { className: s.title, children: "Enter your invite code" }), _jsx("p", { className: s.body, children: "It looks like K7-4M2P. Your partner has it on their phone." })] }), _jsxs("form", { className: s.form, onSubmit: (e) => {
                        e.preventDefault();
                        void join();
                    }, children: [_jsx(Input, { label: "Invite code", value: code, autoCapitalize: "characters", autoCorrect: "off", spellCheck: false, onChange: (e) => setCode(e.target.value.toUpperCase()), placeholder: "K7-4M2P", required: true }), error ? _jsx("p", { className: s.error, children: error }) : null, _jsx(Button, { type: "submit", variant: "accent", size: "lg", block: true, disabled: busy || !code.trim(), children: busy ? 'Joining…' : 'Join' }), _jsx("button", { type: "button", className: s.link, onClick: () => setStep('choose'), children: "Back" })] })] }));
    }
    /* One question, one answer, next. The relationship question advances on the
       tap that answers it — a Continue button under a list of five options asks
       you to say the same thing twice. Closeness cannot: answering it opens a
       follow-up underneath, and a screen that leaves the moment it grows is a
       screen nobody gets to read. */
    const QUESTIONS = 4;
    /* The bar spans the whole of onboarding, and the name step already spent
       the first segment — so these four continue it rather than restarting. */
    const BAR = 5;
    /* Living together and sharing a city both mean one place to suggest things
       in; the other two mean two. */
    const nearby = distance === 'together' || distance === 'same-area';
    const apart = distance === 'different-cities' || distance === 'long-distance';
    const back = () => (q === 0 ? setStep('choose') : setQ(q - 1));
    const forward = () => setQ((current) => Math.min(QUESTIONS - 1, current + 1));
    /** Take the answer, then move on a beat later so the choice is seen. */
    const answer = (set, value) => {
        set(value);
        window.setTimeout(forward, 180);
    };
    return (_jsxs(Screen, { className: s.wizard, children: [q === 3 ? _jsx("div", { className: s.cosmos, "aria-hidden": true }) : null, _jsx("div", { className: s.progress, "aria-hidden": true, children: Array.from({ length: BAR }).map((_, i) => (_jsx("span", { className: [s.tick, i <= q + 1 ? s.tickOn : ''].filter(Boolean).join(' ') }, i))) }), _jsxs("div", { className: [s.question, q === 0 ? s.questionFill : ''].filter(Boolean).join(' '), children: [q === 0 ? (_jsxs(_Fragment, { children: [_jsxs("div", { className: s.qHead, children: [_jsx("h1", { className: s.qTitle, children: "What should we call your partner?" }), _jsx("p", { className: s.qBody, children: "We\u2019ll use this name across Couple777, so enter what you usually call them." })] }), _jsx("form", { className: s.form, onSubmit: (e) => {
                                    e.preventDefault();
                                    if (partnerName.trim())
                                        forward();
                                }, children: _jsx(Input, { label: "Partner\u2019s name", value: partnerName, onChange: (e) => setPartnerName(e.target.value), placeholder: "Type your partner\u2019s name", autoComplete: "off", maxLength: 40, required: true }) }), _jsxs("fieldset", { className: s.identity, children: [_jsxs("legend", { className: s.legend, children: ["How do they identify?", _jsx("span", { className: s.optional, children: "(optional)" })] }), _jsx("div", { className: s.chips, children: IDENTITIES.map((o) => (_jsx("button", { type: "button", className: s.chip, "aria-pressed": partnerGender === o.value, onClick: () => setPartnerGender(partnerGender === o.value ? '' : o.value), children: o.label }, o.value))) }), partnerGender === 'self-describe' ? (_jsx("div", { className: s.selfDescribe, children: _jsx(Input, { label: "In their words", value: partnerGenderNote, onChange: (e) => setPartnerGenderNote(e.target.value), placeholder: "However they describe themselves", maxLength: 40, autoFocus: true }) })) : null] }), _jsxs("div", { className: s.mascot, children: [_jsx(CosmicGreeter, { tone: "cool" }), _jsxs("div", { className: s.mascotNote, children: [_jsx("span", { className: s.hand, children: partnerName.trim()
                                                    ? `This is ${partnerName.trim().split(/\s+/)[0]}`
                                                    : 'This is your person' }), _jsx(ArrowDoodle, {})] })] })] })) : null, q === 1 ? (_jsxs(_Fragment, { children: [_jsxs("div", { children: [_jsx("h1", { className: s.qTitle, children: "How would you describe your relationship?" }), _jsx("p", { className: s.qBody, children: "Only the two of you ever see this." })] }), _jsx("div", { className: s.options, children: RELATIONSHIP.map((o) => (_jsxs("button", { type: "button", className: s.option, "data-on": status === o.value || undefined, onClick: () => answer(setStatus, o.value), children: [_jsx("span", { className: s.optionEmoji, "aria-hidden": true, children: o.emoji }), o.label] }, o.value))) })] })) : null, q === 2 ? (_jsxs(_Fragment, { children: [_jsxs("div", { children: [_jsx("h1", { className: s.qTitle, children: "How close are you two?" }), _jsx("p", { className: s.qBody, children: "We\u2019ll use this to suggest dates and mini adventures that actually fit your lives." })] }), _jsx("div", { className: s.options, children: CLOSENESS.map((o) => (_jsxs("button", { type: "button", className: s.option, "data-on": distance === o.value || undefined, onClick: () => setDistance(o.value), children: [_jsx("span", { className: s.optionEmoji, "aria-hidden": true, children: o.emoji }), o.label] }, o.value))) }), nearby ? (_jsx("div", { className: s.reveal, children: _jsxs("div", { className: s.revealInner, children: [_jsx("p", { className: s.followUp, children: "What city are you based in?" }), _jsx(Input, { label: "Your city", value: homeBase, onChange: (e) => setHomeBase(e.target.value), placeholder: "Type your city", autoComplete: "address-level2", maxLength: 60 }), _jsx("p", { className: s.followUpHint, children: "Used for nearby date ideas and mini adventures." })] }) }, "near")) : null, apart ? (_jsx("div", { className: s.reveal, children: _jsxs("div", { className: s.revealInner, children: [_jsx("p", { className: s.followUp, children: "Where are you both based?" }), _jsx(Input, { label: "Your city", value: homeBase, onChange: (e) => setHomeBase(e.target.value), placeholder: "Type your city", autoComplete: "address-level2", maxLength: 60 }), _jsx(Input, { label: `${partnerName.trim() || 'Your partner'}\u2019s city`, value: partnerCity, onChange: (e) => setPartnerCity(e.target.value), placeholder: "Type their city", autoComplete: "off", maxLength: 60 }), _jsx("p", { className: s.followUpHint, children: "We\u2019ll use this to suggest ideas in both places." })] }) }, "apart")) : null] })) : null, q === 3 ? (_jsxs(_Fragment, { children: [_jsxs("div", { children: [_jsx("h1", { className: s.qTitle, children: "Together since?" }), _jsx("p", { className: s.qBody, children: "For the anniversaries worth a plan. Skip it if you would rather not count." })] }), _jsx("form", { className: s.form, onSubmit: (e) => {
                                    e.preventDefault();
                                    void create();
                                }, children: _jsx(Input, { label: "Together since", type: "date", value: since, onChange: (e) => setSince(e.target.value) }) })] })) : null, error ? _jsx("p", { className: s.error, children: error }) : null] }, q), _jsxs("div", { className: s.foot, children: [q === QUESTIONS - 1 ? (_jsx(Button, { variant: "accent", size: "lg", block: true, glow: true, disabled: busy, onClick: () => void create(), children: busy ? 'Making your space…' : 'Create our space' })) : q === 0 || q === 2 ? (_jsx(Button, { variant: "accent", size: "lg", block: true, disabled: q === 0 && !partnerName.trim(), onClick: forward, children: "Continue" })) : null, q === QUESTIONS - 1 ? (_jsx("button", { type: "button", className: s.link, disabled: busy, onClick: () => {
                            setSince('');
                            void create();
                        }, children: "Skip for now" })) : (_jsx("button", { type: "button", className: s.link, onClick: back, children: "Back" }))] })] }));
}
/** A small hand-drawn arrow, curving back toward the traveller beside it. */
function ArrowDoodle() {
    return (_jsxs("svg", { className: s.arrow, viewBox: "0 0 62 40", width: "56", height: "36", "aria-hidden": true, children: [_jsx("path", { d: "M 56 5 C 50 20, 38 31, 16 33", fill: "none", stroke: "currentColor", strokeWidth: "2.4", strokeLinecap: "round" }), _jsx("path", { d: "M 25 26 L 14 33.4 L 25 38", fill: "none", stroke: "currentColor", strokeWidth: "2.4", strokeLinecap: "round", strokeLinejoin: "round" })] }));
}
