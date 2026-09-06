import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Screen } from '@/components/layout/Screen';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Field';
import { Chip } from '@/components/ui/Chip';
import { Photo } from '@/components/ui/Photo';
import { CosmicGreeter } from '@/components/ui/CosmicPair';
import { useToast } from '@/components/ui/Toast';
import { useStore } from '@/context/store';
import { MAX_PHOTOS, readPickedPhoto } from '@/lib/imageFile';
import { NEXT_STEP, OPENING, readMemory } from '@/lib/memoryAi';
import { FEELINGS, FEELING_MOOD, HARD_FEELINGS, feelingEmoji } from '@/lib/memoryRead';
import { formatStamp, today } from '@/lib/dates';
import { uid } from '@/lib/id';
import s from './MemoryCapture.module.css';
const PLACEHOLDER = 'Write it however it comes to you…\n\ne.g. We cooked pasta tonight and somehow ended up dancing in the kitchen. I haven’t laughed like that in a while.';
/** The most questions anyone is asked, whatever the model would like. */
const MAX_ASKS = 3;
export default function MemoryCaptureScreen() {
    const [params] = useSearchParams();
    const navigate = useNavigate();
    const toast = useToast();
    const { state, dispatch, me, error } = useStore();
    // Arriving from a finished plan means the when and where are already known.
    const cycle = state.cycles.find((c) => c.id === params.get('cycle'));
    const plan = state.plans.find((p) => p.id === (cycle?.planId ?? params.get('plan')));
    const [step, setStep] = useState('write');
    const [note, setNote] = useState('');
    const [photos, setPhotos] = useState([]);
    const [busyPhotos, setBusyPhotos] = useState(false);
    const [photoError, setPhotoError] = useState(null);
    const [reading, setReading] = useState(null);
    const [answers, setAnswers] = useState([]);
    const [title, setTitle] = useState('');
    const [emoji, setEmoji] = useState('✨');
    const [date, setDate] = useState(plan?.date ?? null);
    const [place, setPlace] = useState(plan?.place ?? '');
    const [feelings, setFeelings] = useState([]);
    const [extra, setExtra] = useState('');
    const [visibility, setVisibility] = useState('shared');
    const [saved, setSaved] = useState(null);
    const fileInput = useRef(null);
    /*
     * Saving is optimistic — the reducer runs, then the write goes out. When the
     * write fails the store reloads from the server and the memory quietly
     * disappears, so this watches for that: being told "Kept" about something
     * that was not kept is the one outcome this screen must never produce.
     */
    const errorBefore = useRef(null);
    const waitingOnSave = useRef(false);
    useEffect(() => {
        if (!waitingOnSave.current || error === errorBefore.current)
            return;
        if (error) {
            waitingOnSave.current = false;
            setSaveError(error);
            setStep('failed');
        }
    }, [error]);
    const [saveError, setSaveError] = useState(null);
    const hard = reading?.tone === 'difficult' || reading?.type === 'conflict';
    /* ------------------------------- Photos -------------------------------- */
    const pick = async (files) => {
        if (!files?.length)
            return;
        setPhotoError(null);
        setBusyPhotos(true);
        const room = MAX_PHOTOS - photos.length;
        const chosen = Array.from(files).slice(0, room);
        try {
            const added = await Promise.all(chosen.map(readPickedPhoto));
            setPhotos((prev) => [...prev, ...added].slice(0, MAX_PHOTOS));
            if (files.length > room)
                setPhotoError(`${MAX_PHOTOS} photos is the most one memory keeps.`);
        }
        catch {
            setPhotoError('One of those would not open. Try another?');
        }
        finally {
            setBusyPhotos(false);
            if (fileInput.current)
                fileInput.current.value = '';
        }
    };
    /* ------------------------------ The reading ----------------------------- */
    /**
     * What comes back is a starting point, never an overwrite: once someone has
     * answered something themselves, their answer is the answer.
     */
    const apply = (next, asked) => {
        setReading(next);
        setTitle((current) => current || next.title);
        setEmoji(plan?.emoji ?? emojiFor(next));
        if (next.date && !date)
            setDate(next.date);
        if (next.place && !place)
            setPlace(next.place);
        if (!asked.some((a) => a.field === 'feelings') && next.feelings.length) {
            setFeelings(next.feelings.map(titleCase));
        }
        if (!asked.length)
            setVisibility(next.defaultVisibility);
        setStep(next.needsFollowUp && asked.length < MAX_ASKS ? 'ask' : 'review');
    };
    const ask = async (asked) => {
        setStep('thinking');
        setAnswers(asked);
        const { reading: next } = await readMemory(note.trim(), asked);
        apply(next, asked);
    };
    const begin = () => {
        /* What the plan already told us counts as answered — it is conversation
           state like any other, and it stops the flow asking where someone was on
           an evening it arranged itself. */
        const known = [];
        if (plan?.date)
            known.push({ question: 'When was this?', field: 'date', answer: plan.date });
        if (plan?.place)
            known.push({ question: 'Where was this?', field: 'place', answer: plan.place });
        void ask(known);
    };
    /** One answer, then straight back for whatever is worth asking next. */
    const answer = (value) => {
        if (!reading?.nextQuestion)
            return;
        void ask([
            ...answers,
            { question: reading.nextQuestion, field: reading.questionField, answer: value },
        ]);
    };
    const back = () => {
        setPhotoError(null);
        if (step === 'write') {
            navigate(-1);
        }
        else if (step === 'ask' || step === 'thinking') {
            setStep('write');
        }
        else if (step === 'review') {
            setStep(reading?.nextQuestion ? 'ask' : 'write');
        }
        else if (step === 'edit') {
            setStep('review');
        }
        else {
            navigate(saved ? `/memories/${saved.id}` : '/memories', { replace: true });
        }
    };
    /* -------------------------------- Saving -------------------------------- */
    const keep = () => {
        const written = note.trim();
        const memory = {
            id: uid('m'),
            date: date ?? today(),
            title: title.trim() || 'A moment worth keeping',
            emoji,
            kind: cycle?.tier ?? 'moment',
            place: place.trim() || undefined,
            photos,
            mood: feelings.length ? FEELING_MOOD[feelings[0]] : undefined,
            feelings: feelings.length ? feelings : undefined,
            visibility,
            sharedNote: written || undefined,
            notes: {},
            /* The last answer is a note to yourself, and it is kept as one — it is
               also the only per-person text on a memory that survives a reload. */
            privateNotes: extra.trim() ? { [me.id]: extra.trim() } : {},
            planId: plan?.id,
            cycleId: cycle?.id,
        };
        errorBefore.current = error;
        waitingOnSave.current = true;
        setSaveError(null);
        dispatch({ type: 'upsertMemory', memory });
        if (plan)
            dispatch({ type: 'linkMemoryToPlan', planId: plan.id, memoryId: memory.id });
        setSaved(memory);
        toast.show({ emoji: '✓', message: 'Kept', actionLabel: 'See it', actionTo: `/memories/${memory.id}` });
        setStep(reading?.offerNextSteps && reading.nextSteps.length ? 'suggest' : 'done');
    };
    const restart = () => {
        setNote('');
        setPhotos([]);
        setReading(null);
        setAnswers([]);
        setTitle('');
        setEmoji('✨');
        setDate(null);
        setPlace('');
        setFeelings([]);
        setExtra('');
        setVisibility('shared');
        setSaved(null);
        setStep('write');
    };
    /* ------------------------------- Rendering ------------------------------ */
    const dateLabel = date ? formatStamp(date) : null;
    return (_jsxs(_Fragment, { children: [_jsxs("div", { className: s.bar, children: [_jsx("button", { type: "button", className: s.back, onClick: back, "aria-label": "Back", children: _jsx(Chevron, {}) }), step === 'write' ? _jsx("span", { className: s.barTitle, children: "New memory" }) : null] }), _jsxs(Screen, { className: s.screen, children: [step === 'write' ? (_jsxs(_Fragment, { children: [_jsxs("header", { className: s.head, children: [_jsx("span", { className: s.sparkle, "aria-hidden": true, children: "\u2728" }), _jsx("h1", { className: s.title, children: "What do you want to remember?" }), _jsx("p", { className: s.sub, children: "An occasion, a grateful thought, a small moment, or something you\u2019ve been reflecting on." })] }), _jsx(Textarea, { value: note, onChange: (e) => setNote(e.target.value), placeholder: PLACEHOLDER, maxLength: 500, showCount: true, rows: 7, autoFocus: true }), _jsxs("div", { className: s.photos, children: [photos.length ? (_jsx("div", { className: s.thumbs, children: photos.map((src, i) => (_jsxs("div", { className: s.thumb, children: [_jsx(Photo, { src: src, seed: `pick-${i}`, className: s.thumbImg, alt: "" }), _jsx("button", { type: "button", className: s.remove, "aria-label": "Remove this photo", onClick: () => setPhotos(photos.filter((p) => p !== src)), children: "\u2715" })] }, src.slice(-24) + i))) })) : null, _jsx("input", { ref: fileInput, type: "file", accept: "image/*", multiple: true, className: s.file, onChange: (e) => void pick(e.target.files) }), _jsx(Button, { variant: "secondary", size: "lg", block: true, icon: _jsx(PhotoIcon, {}), disabled: busyPhotos || photos.length >= MAX_PHOTOS, onClick: () => fileInput.current?.click(), children: busyPhotos ? 'Adding…' : photos.length ? 'Add more photos' : 'Add photos' }), photoError ? _jsx("p", { className: s.hint, children: photoError }) : null] }), _jsx("div", { className: s.foot, children: _jsx(Button, { variant: "accent", size: "lg", block: true, disabled: !note.trim(), trailingIcon: _jsx(Arrow, {}), onClick: begin, children: "Continue" }) })] })) : null, step === 'thinking' ? (_jsxs("div", { className: s.chat, children: [_jsx("div", { className: s.greeter, children: _jsx(CosmicGreeter, {}) }), _jsxs("p", { className: `${s.bubble} ${s.thinking}`, children: [_jsx("span", { "aria-hidden": true, children: "\u00B7" }), _jsx("span", { "aria-hidden": true, children: "\u00B7" }), _jsx("span", { "aria-hidden": true, children: "\u00B7" }), _jsx("span", { className: s.sr, children: "Reading what you wrote" })] })] })) : null, step === 'ask' && reading?.nextQuestion ? (_jsx(AskStep, { reading: reading, first: answers.length === 0, onAnswer: answer, onSkip: () => answer(''), onDate: (value) => {
                            setDate(value);
                            answer(value ? formatStamp(value) : 'Doesn’t matter');
                        }, onPlace: (value) => {
                            setPlace(value ?? '');
                            answer(value ?? '');
                        }, feelings: feelings, onFeelings: setFeelings, extra: extra, onExtra: setExtra })) : null, step === 'review' && (_jsxs(_Fragment, { children: [_jsxs("header", { className: s.head, children: [_jsx("h1", { className: s.title, children: hard ? 'Your memory' : 'Your memory ✨' }), _jsx("p", { className: s.sub, children: "Here\u2019s what we\u2019ve captured." })] }), _jsxs("article", { className: s.card, children: [photos.length ? (_jsxs("div", { className: s.strip, children: [photos.slice(0, 2).map((src, i) => (_jsx(Photo, { src: src, seed: `rev-${i}`, className: s.stripImg, alt: "" }, i))), photos.length > 2 ? _jsxs("span", { className: s.more, children: ["+", photos.length - 2] }) : null] })) : null, _jsxs("h2", { className: s.cardTitle, children: [_jsx("span", { "aria-hidden": true, children: emoji }), " ", title] }), dateLabel || place ? (_jsxs("p", { className: s.meta, children: [dateLabel ? _jsxs("span", { children: ["\uD83D\uDDD3 ", dateLabel] }) : null, place ? _jsxs("span", { children: ["\uD83D\uDCCD ", place] }) : null] })) : null, note.trim() ? _jsxs("p", { className: s.quote, children: ["\u201C", note.trim(), "\u201D"] }) : null, extra.trim() ? (_jsxs("p", { className: s.extra, children: [_jsx("span", { className: s.extraLabel, children: "\uD83D\uDD12 Just for you" }), extra.trim()] })) : null, feelings.length ? (_jsx("div", { className: s.tags, children: feelings.map((f) => (_jsxs("span", { className: s.tag, children: [_jsx("span", { "aria-hidden": true, children: feelingEmoji(f) }), " ", f] }, f))) })) : null, _jsx(Visibility, { value: visibility, onChange: setVisibility })] }), _jsxs("div", { className: s.foot, children: [_jsx(Button, { variant: "accent", size: "lg", block: true, onClick: keep, children: "Keep this memory" }), _jsx(Button, { variant: "secondary", size: "lg", block: true, onClick: () => setStep('edit'), children: "Edit details" })] })] })), step === 'edit' && (_jsxs(_Fragment, { children: [_jsxs("header", { className: s.head, children: [_jsx("h1", { className: s.title, children: "Edit details" }), _jsx("p", { className: s.sub, children: "Change anything. It is your memory." })] }), _jsxs("div", { className: s.form, children: [_jsx(Input, { label: "Title", value: title, onChange: (e) => setTitle(e.target.value), maxLength: 80 }), _jsx(Input, { label: "When", type: "date", value: date ?? '', onChange: (e) => setDate(e.target.value || null) }), _jsx(Input, { label: "Where", placeholder: "Optional", value: place, onChange: (e) => setPlace(e.target.value) }), _jsx(Textarea, { label: "What you wrote", value: note, onChange: (e) => setNote(e.target.value), maxLength: 500, showCount: true, rows: 5 }), _jsxs("div", { children: [_jsx("p", { className: s.label, children: "How it felt" }), _jsx("div", { className: s.chips, children: feelingChoices(hard, feelings).map((f) => (_jsx(Chip, { emoji: feelingEmoji(f), selected: feelings.includes(f), onClick: () => setFeelings(feelings.includes(f) ? feelings.filter((v) => v !== f) : [...feelings, f]), children: f }, f))) })] })] }), _jsx("div", { className: s.foot, children: _jsx(Button, { variant: "accent", size: "lg", block: true, onClick: () => setStep('review'), children: "Done" }) })] })), step === 'suggest' && reading && (_jsxs(_Fragment, { children: [_jsxs("header", { className: s.headCentre, children: [hard ? null : (_jsx("span", { className: s.sparkle, "aria-hidden": true, children: "\u2728" })), _jsx("h1", { className: s.title, children: hard ? 'Would any of this help?' : 'Want to turn this into something more?' }), _jsx("p", { className: s.sub, children: hard ? 'No rush, and no wrong answer.' : 'Here are a few ideas based on this memory.' })] }), _jsx("div", { className: s.options, children: reading.nextSteps.map((id) => (_jsxs("button", { type: "button", className: s.option, onClick: () => navigate(NEXT_STEP[id].to), children: [_jsx("span", { className: s.optionIcon, "aria-hidden": true, children: NEXT_STEP[id].icon }), _jsx("span", { className: s.optionLabel, children: NEXT_STEP[id].label }), _jsx("span", { className: s.plus, "aria-hidden": true, children: "+" })] }, id))) }), _jsx("button", { type: "button", className: s.skip, onClick: () => setStep('done'), children: "Maybe later" })] })), step === 'failed' && (_jsxs("div", { className: s.done, children: [_jsx("span", { className: s.moon, "aria-hidden": true, children: "\uD83C\uDF27" }), _jsx("h1", { className: s.title, children: "That didn\u2019t save" }), _jsx("p", { className: s.sub, children: "Your words are still here \u2014 nothing is lost. This is what came back:" }), _jsx("p", { className: s.error, children: saveError }), _jsxs("div", { className: s.foot, children: [_jsx(Button, { variant: "accent", size: "lg", block: true, onClick: keep, children: "Try again" }), _jsx(Button, { variant: "secondary", size: "lg", block: true, onClick: () => setStep('review'), children: "Back to the memory" })] })] })), step === 'done' && (_jsxs("div", { className: s.done, children: [_jsx("span", { className: s.moon, "aria-hidden": true, children: "\uD83C\uDF19" }), _jsx("h1", { className: s.title, children: hard ? 'Kept' : 'Saved ✨' }), _jsx("p", { className: s.sub, children: hard
                                    ? visibility === 'private'
                                        ? 'This one is just for you. It will be here when you want it.'
                                        : 'It is written down. That is enough for now.'
                                    : 'Another beautiful moment in your 777 universe.' }), _jsxs("div", { className: s.foot, children: [_jsx(Button, { variant: "accent", size: "lg", block: true, onClick: () => navigate(`/memories/${saved?.id ?? ''}`, { replace: true }), children: "View memory" }), _jsx(Button, { variant: "secondary", size: "lg", block: true, onClick: restart, children: "Add another" })] }), hard ? null : _jsx("p", { className: s.hand, children: "More moments. A closer us. \u2661" })] }))] })] }));
}
/* ------------------------------- One question ------------------------------ */
function AskStep({ reading, first, feelings, extra, onAnswer, onSkip, onDate, onPlace, onFeelings, onExtra, }) {
    const [typing, setTyping] = useState(null);
    const [typed, setTyped] = useState('');
    const hard = reading.tone === 'difficult' || reading.type === 'conflict';
    const field = reading.questionField;
    const hand = hard
        ? 'Whatever you need to keep. ♡'
        : field === 'date'
            ? 'Little moments make a big love story. ♡'
            : field === 'place'
                ? 'Same place, now memories. ♡'
                : field === 'feelings'
                    ? 'Feel it. Keep it. ♡'
                    : 'A kinder you for future you. ♡';
    /* A tapped reply is words, not a value — the model writes them — so each one
       is read for what it means before it is acted on, and anything
       unrecognised is still recorded as the answer it was. */
    const tapDate = (reply) => {
        if (/toda|tonight|this (morning|afternoon|evening)|^yes/i.test(reply))
            return onDate(today());
        if (/choose|another|different|pick|date/i.test(reply))
            return setTyping('date');
        if (/matter|skip|sure|remember/i.test(reply))
            return onDate(null);
        return onAnswer(reply);
    };
    const tapPlace = (reply) => {
        if (/^(at )?home$/i.test(reply.trim()))
            return onPlace('Home');
        if (/add|another|somewhere|else|choose|where/i.test(reply))
            return setTyping('place');
        if (/skip|rather not|doesn|matter/i.test(reply))
            return onPlace(null);
        return onPlace(reply);
    };
    const toggle = (f) => onFeelings(feelings.includes(f) ? feelings.filter((v) => v !== f) : [...feelings, f]);
    const replies = reading.quickReplies.length
        ? reading.quickReplies
        : field === 'feelings'
            ? [...(hard ? HARD_FEELINGS : FEELINGS)]
            : [];
    return (_jsxs("div", { className: s.chat, children: [_jsx("div", { className: s.greeter, children: _jsx(CosmicGreeter, {}) }), first ? _jsx("p", { className: s.bubble, children: OPENING[reading.tone] }) : null, _jsx("p", { className: s.bubble, children: reading.nextQuestion }), field === 'date' && (_jsx("div", { className: s.options, children: typing === 'date' ? (_jsxs(_Fragment, { children: [_jsx(Input, { type: "date", autoFocus: true, onChange: (e) => (e.target.value ? onDate(e.target.value) : undefined) }), _jsx("button", { type: "button", className: s.skip, onClick: () => setTyping(null), children: "Back to the quick answers" })] })) : (_jsxs(_Fragment, { children: [replies.map((r) => (_jsx(Option, { icon: dateIcon(r), label: r, onClick: () => tapDate(r) }, r))), _jsx("button", { type: "button", className: s.skip, onClick: onSkip, children: "Skip" })] })) })), field === 'place' && (_jsx("div", { className: s.options, children: typing === 'place' ? (_jsxs("form", { className: s.inline, onSubmit: (e) => {
                        e.preventDefault();
                        onPlace(typed.trim() || null);
                    }, children: [_jsx(Input, { autoFocus: true, placeholder: "Where were you?", value: typed, onChange: (e) => setTyped(e.target.value) }), _jsx(Button, { type: "submit", variant: "accent", size: "lg", block: true, disabled: !typed.trim(), children: "Save this place" })] })) : (_jsxs(_Fragment, { children: [replies.map((r) => (_jsx(Option, { icon: placeIcon(r), label: r, onClick: () => tapPlace(r) }, r))), _jsx("button", { type: "button", className: s.skip, onClick: onSkip, children: "Skip" })] })) })), field === 'feelings' && (_jsxs(_Fragment, { children: [_jsxs("div", { className: s.feelings, children: [replies.map((f) => (_jsx(Chip, { emoji: feelingEmoji(f), selected: feelings.includes(titleCase(f)), onClick: () => toggle(titleCase(f)), children: titleCase(f) }, f))), _jsx(Chip, { emoji: "\u270F\uFE0F", selected: typing === 'feeling', onClick: () => setTyping(typing === 'feeling' ? null : 'feeling'), children: "Add my own" })] }), typing === 'feeling' ? (_jsxs("form", { className: s.own, onSubmit: (e) => {
                            e.preventDefault();
                            const word = titleCase(typed.trim());
                            if (!word)
                                return;
                            if (!feelings.includes(word))
                                onFeelings([...feelings, word]);
                            setTyped('');
                            setTyping(null);
                        }, children: [_jsx(Input, { autoFocus: true, placeholder: "In your own word", maxLength: 24, value: typed, onChange: (e) => setTyped(e.target.value) }), _jsx(Button, { type: "submit", variant: "secondary", size: "md", disabled: !typed.trim(), children: "Add" })] })) : null, _jsx("div", { className: s.foot, children: feelings.length ? (_jsx(Button, { variant: "accent", size: "lg", block: true, onClick: () => onAnswer(feelings.join(', ')), children: "Continue" })) : (_jsx("button", { type: "button", className: s.skip, onClick: onSkip, children: "Skip" })) })] })), (field === 'context' || field === null) && (_jsxs(_Fragment, { children: [_jsx(Textarea, { value: extra, onChange: (e) => onExtra(e.target.value), placeholder: "Add a note, just for you (optional)", maxLength: 500, showCount: true, rows: 5, autoFocus: true }), _jsx("div", { className: s.foot, children: extra.trim() ? (_jsx(Button, { variant: "accent", size: "lg", block: true, onClick: () => onAnswer(extra.trim()), children: "Continue" })) : (_jsx("button", { type: "button", className: s.skip, onClick: onSkip, children: "Skip" })) })] })), _jsx("p", { className: s.hand, children: hand })] }));
}
/* --------------------------------- Pieces ---------------------------------- */
function Visibility({ value, onChange, }) {
    return (_jsxs("div", { className: s.visibility, children: [_jsxs("div", { className: s.visRow, children: [_jsx("button", { type: "button", className: s.vis, "aria-pressed": value === 'private', onClick: () => onChange('private'), children: "\uD83D\uDD12 Private" }), _jsx("button", { type: "button", className: s.vis, "aria-pressed": value === 'shared', onClick: () => onChange('shared'), children: "\uD83D\uDC9E Shared" })] }), _jsx("p", { className: s.visNote, children: value === 'private'
                    ? 'Only you can see this one.'
                    : 'This goes on the timeline you both see.' })] }));
}
function Option({ icon, label, onClick }) {
    return (_jsxs("button", { type: "button", className: s.option, onClick: onClick, children: [_jsx("span", { className: s.optionIcon, "aria-hidden": true, children: icon }), _jsx("span", { className: s.optionLabel, children: label })] }));
}
function titleCase(word) {
    return word.charAt(0).toUpperCase() + word.slice(1);
}
/** The set on the edit screen: the right six, plus anything already chosen. */
function feelingChoices(hard, chosen) {
    const base = hard ? [...HARD_FEELINGS] : [...FEELINGS];
    return [...base, ...chosen.filter((f) => !base.includes(f))];
}
function dateIcon(reply) {
    if (/toda|tonight|^yes/i.test(reply))
        return '💗';
    if (/matter|skip|sure/i.test(reply))
        return '···';
    return '🗓';
}
function placeIcon(reply) {
    if (/home/i.test(reply))
        return '🏠';
    if (/skip|matter|rather not/i.test(reply))
        return '···';
    return '📍';
}
/** Something small at the top of the card, chosen by what kind of note it is. */
function emojiFor(reading) {
    if (reading.tone === 'difficult')
        return '🤍';
    switch (reading.type) {
        case 'gratitude':
            return '🌿';
        case 'milestone':
            return '🎉';
        case 'reflection':
            return '💭';
        case 'conflict':
            return '🤍';
        default:
            return '✨';
    }
}
/* --------------------------------- Marks ---------------------------------- */
function Chevron() {
    return (_jsx("svg", { viewBox: "0 0 24 24", width: "17", height: "17", "aria-hidden": true, children: _jsx("path", { d: "M15 5l-7 7 7 7", fill: "none", stroke: "currentColor", strokeWidth: "1.9", strokeLinecap: "round", strokeLinejoin: "round" }) }));
}
function Arrow() {
    return (_jsx("svg", { viewBox: "0 0 24 24", width: "17", height: "17", "aria-hidden": true, children: _jsx("path", { d: "M5 12h13m-5-6 6 6-6 6", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }) }));
}
function PhotoIcon() {
    return (_jsxs("svg", { viewBox: "0 0 24 24", width: "18", height: "18", "aria-hidden": true, children: [_jsx("rect", { x: "3", y: "5", width: "18", height: "14", rx: "3.4", fill: "none", stroke: "currentColor", strokeWidth: "1.7" }), _jsx("circle", { cx: "9", cy: "10", r: "1.6", fill: "currentColor" }), _jsx("path", { d: "M4.5 17.5 9.5 12l3.2 3 2.4-2 4.4 4.5", fill: "none", stroke: "currentColor", strokeWidth: "1.7", strokeLinecap: "round", strokeLinejoin: "round" })] }));
}
