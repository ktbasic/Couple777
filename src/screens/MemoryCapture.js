import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useRef, useState } from 'react';
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
import { FEELINGS, FEELING_EMOJI, FEELING_MOOD, asksFor, readNote, suggestionsFor, } from '@/lib/memoryRead';
import { formatStamp, today } from '@/lib/dates';
import { uid } from '@/lib/id';
import s from './MemoryCapture.module.css';
const PLACEHOLDER = 'Write it however it comes to you…\n\ne.g. We cooked pasta tonight and somehow ended up dancing in the kitchen. I haven’t laughed like that in a while.';
export default function MemoryCaptureScreen() {
    const [params] = useSearchParams();
    const navigate = useNavigate();
    const toast = useToast();
    const { state, dispatch, me, partner } = useStore();
    // Arriving from a finished plan means the when and where are already known,
    // so those questions are never asked.
    const cycle = state.cycles.find((c) => c.id === params.get('cycle'));
    const plan = state.plans.find((p) => p.id === (cycle?.planId ?? params.get('plan')));
    const [step, setStep] = useState('write');
    const [note, setNote] = useState('');
    const [photos, setPhotos] = useState([]);
    const [busyPhotos, setBusyPhotos] = useState(false);
    const [photoError, setPhotoError] = useState(null);
    const [title, setTitle] = useState('');
    const [emoji, setEmoji] = useState('✨');
    const [date, setDate] = useState(plan?.date ?? null);
    const [place, setPlace] = useState(plan?.place ?? '');
    const [feelings, setFeelings] = useState([]);
    const [extra, setExtra] = useState('');
    const [ownFeeling, setOwnFeeling] = useState(false);
    const [asks, setAsks] = useState([]);
    const [asked, setAsked] = useState(0);
    const [saved, setSaved] = useState(null);
    const [suggestions, setSuggestions] = useState([]);
    const fileInput = useRef(null);
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
    /* -------------------------- Reading, then asking ------------------------ */
    const begin = () => {
        const reading = readNote(note);
        setTitle(reading.title);
        setEmoji(plan?.emoji ?? reading.emoji);
        if (reading.date && !date)
            setDate(reading.date);
        if (reading.place && !place)
            setPlace(reading.place);
        setFeelings(reading.feelings);
        const queue = asksFor(reading, { date: Boolean(date), place: Boolean(place) });
        setAsks(queue);
        setAsked(0);
        setStep(queue.length ? 'ask' : 'review');
    };
    const nextAsk = () => {
        if (asked + 1 < asks.length)
            setAsked(asked + 1);
        else
            setStep('review');
    };
    const back = () => {
        setPhotoError(null);
        if (step === 'write') {
            navigate(-1);
        }
        else if (step === 'ask') {
            if (asked > 0)
                setAsked(asked - 1);
            else
                setStep('write');
        }
        else if (step === 'review') {
            if (asks.length) {
                setAsked(asks.length - 1);
                setStep('ask');
            }
            else {
                setStep('write');
            }
        }
        else if (step === 'edit') {
            setStep('review');
        }
        else {
            // Saved already — there is nothing behind this but the memory itself.
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
            sharedNote: written || undefined,
            notes: {},
            /*
             * "Anything else you want to remember" is a note to yourself — the
             * screen says as much — so it is kept as one. It is also the only
             * per-person text on a memory that survives a reload: the shared
             * per-person note has no column behind it.
             */
            privateNotes: extra.trim() ? { [me.id]: extra.trim() } : {},
            planId: plan?.id,
            cycleId: cycle?.id,
        };
        dispatch({ type: 'upsertMemory', memory });
        if (plan)
            dispatch({ type: 'linkMemoryToPlan', planId: plan.id, memoryId: memory.id });
        setSaved(memory);
        /* Said here rather than on the last screen, because a suggestion can carry
           someone off to the plan editor without ever seeing it. */
        toast.show({ emoji: '✓', message: 'Kept', actionLabel: 'See it', actionTo: `/memories/${memory.id}` });
        const next = suggestionsFor(`${written} ${extra}`, place || undefined, partner.name);
        setSuggestions(next);
        setStep(next.length ? 'suggest' : 'done');
    };
    /* ------------------------------- Rendering ------------------------------ */
    const dateLabel = date ? formatStamp(date) : null;
    const ask = step === 'ask' ? asks[asked] : null;
    return (_jsxs(_Fragment, { children: [_jsxs("div", { className: s.bar, children: [_jsx("button", { type: "button", className: s.back, onClick: back, "aria-label": "Back", children: _jsx(Chevron, {}) }), step === 'write' ? _jsx("span", { className: s.barTitle, children: "New memory" }) : null] }), _jsxs(Screen, { className: s.screen, children: [step === 'write' ? (_jsxs(_Fragment, { children: [_jsxs("header", { className: s.head, children: [_jsx("span", { className: s.sparkle, "aria-hidden": true, children: "\u2728" }), _jsx("h1", { className: s.title, children: "What do you want to remember?" }), _jsx("p", { className: s.sub, children: "An occasion, a grateful thought, a small moment, or something you\u2019ve been reflecting on." })] }), _jsx(Textarea, { value: note, onChange: (e) => setNote(e.target.value), placeholder: PLACEHOLDER, maxLength: 500, showCount: true, rows: 7, autoFocus: true }), _jsxs("div", { className: s.photos, children: [photos.length ? (_jsx("div", { className: s.thumbs, children: photos.map((src, i) => (_jsxs("div", { className: s.thumb, children: [_jsx(Photo, { src: src, seed: `pick-${i}`, className: s.thumbImg, alt: "" }), _jsx("button", { type: "button", className: s.remove, "aria-label": "Remove this photo", onClick: () => setPhotos(photos.filter((p) => p !== src)), children: "\u2715" })] }, src.slice(-24) + i))) })) : null, _jsx("input", { ref: fileInput, type: "file", accept: "image/*", multiple: true, className: s.file, onChange: (e) => void pick(e.target.files) }), _jsx(Button, { variant: "secondary", size: "lg", block: true, icon: _jsx(PhotoIcon, {}), disabled: busyPhotos || photos.length >= MAX_PHOTOS, onClick: () => fileInput.current?.click(), children: busyPhotos
                                            ? 'Adding…'
                                            : photos.length
                                                ? 'Add more photos'
                                                : 'Add photos' }), photoError ? _jsx("p", { className: s.hint, children: photoError }) : null] }), _jsx("div", { className: s.foot, children: _jsx(Button, { variant: "accent", size: "lg", block: true, disabled: !note.trim(), trailingIcon: _jsx(Arrow, {}), onClick: begin, children: "Continue" }) })] })) : null, ask ? (_jsx(AskStep, { ask: ask, first: asked === 0, partnerName: partner.name, onDate: (value) => {
                            setDate(value);
                            nextAsk();
                        }, onPlace: (value) => {
                            if (value !== null)
                                setPlace(value);
                            nextAsk();
                        }, feelings: feelings, ownFeeling: ownFeeling, onFeeling: setFeelings, onOwnFeeling: setOwnFeeling, extra: extra, onExtra: setExtra, onNext: nextAsk })) : null, step === 'review' && (_jsxs(_Fragment, { children: [_jsxs("header", { className: s.head, children: [_jsxs("h1", { className: s.title, children: ["Your memory ", _jsx("span", { "aria-hidden": true, children: "\u2728" })] }), _jsx("p", { className: s.sub, children: "Here\u2019s what we\u2019ve captured." })] }), _jsxs("article", { className: s.card, children: [photos.length ? (_jsxs("div", { className: s.strip, children: [photos.slice(0, 2).map((src, i) => (_jsx(Photo, { src: src, seed: `rev-${i}`, className: s.stripImg, alt: "" }, i))), photos.length > 2 ? _jsxs("span", { className: s.more, children: ["+", photos.length - 2] }) : null] })) : null, _jsxs("h2", { className: s.cardTitle, children: [_jsx("span", { "aria-hidden": true, children: emoji }), " ", title] }), dateLabel || place ? (_jsxs("p", { className: s.meta, children: [dateLabel ? _jsxs("span", { children: ["\uD83D\uDDD3 ", dateLabel] }) : null, place ? _jsxs("span", { children: ["\uD83D\uDCCD ", place] }) : null] })) : null, note.trim() ? _jsxs("p", { className: s.quote, children: ["\u201C", note.trim(), "\u201D"] }) : null, extra.trim() ? (_jsxs("p", { className: s.extra, children: [_jsx("span", { className: s.extraLabel, children: "\uD83D\uDD12 Just for you" }), extra.trim()] })) : null, feelings.length ? (_jsx("div", { className: s.tags, children: feelings.map((f) => (_jsxs("span", { className: s.tag, children: [_jsx("span", { "aria-hidden": true, children: FEELING_EMOJI[f] ?? '✨' }), " ", f] }, f))) })) : null] }), _jsxs("div", { className: s.foot, children: [_jsx(Button, { variant: "accent", size: "lg", block: true, onClick: keep, children: "Keep this memory" }), _jsx(Button, { variant: "secondary", size: "lg", block: true, onClick: () => setStep('edit'), children: "Edit details" })] })] })), step === 'edit' && (_jsxs(_Fragment, { children: [_jsxs("header", { className: s.head, children: [_jsx("h1", { className: s.title, children: "Edit details" }), _jsx("p", { className: s.sub, children: "Change anything. It is your memory." })] }), _jsxs("div", { className: s.form, children: [_jsx(Input, { label: "Title", value: title, onChange: (e) => setTitle(e.target.value), maxLength: 80 }), _jsx(Input, { label: "When", type: "date", value: date ?? '', onChange: (e) => setDate(e.target.value || null) }), _jsx(Input, { label: "Where", placeholder: "Optional", value: place, onChange: (e) => setPlace(e.target.value) }), _jsx(Textarea, { label: "What you wrote", value: note, onChange: (e) => setNote(e.target.value), maxLength: 500, showCount: true, rows: 5 }), _jsxs("div", { children: [_jsx("p", { className: s.label, children: "How it felt" }), _jsx("div", { className: s.chips, children: FEELINGS.map((f) => (_jsx(Chip, { emoji: FEELING_EMOJI[f], selected: feelings.includes(f), onClick: () => setFeelings(feelings.includes(f) ? feelings.filter((v) => v !== f) : [...feelings, f]), children: f }, f))) })] })] }), _jsx("div", { className: s.foot, children: _jsx(Button, { variant: "accent", size: "lg", block: true, onClick: () => setStep('review'), children: "Done" }) })] })), step === 'suggest' && (_jsxs(_Fragment, { children: [_jsxs("header", { className: s.headCentre, children: [_jsx("span", { className: s.sparkle, "aria-hidden": true, children: "\u2728" }), _jsx("h1", { className: s.title, children: "Want to turn this into something more?" }), _jsx("p", { className: s.sub, children: "Here are a few ideas based on this memory." })] }), _jsx("div", { className: s.options, children: suggestions.map((sug) => (_jsxs("button", { type: "button", className: s.option, onClick: () => navigate(sug.to), children: [_jsx("span", { className: s.optionIcon, "aria-hidden": true, children: sug.icon }), _jsx("span", { className: s.optionLabel, children: sug.label }), _jsx("span", { className: s.plus, "aria-hidden": true, children: "+" })] }, sug.id))) }), _jsx("button", { type: "button", className: s.skip, onClick: () => setStep('done'), children: "Maybe later" })] })), step === 'done' && (_jsxs("div", { className: s.done, children: [_jsx("span", { className: s.moon, "aria-hidden": true, children: "\uD83C\uDF19" }), _jsxs("h1", { className: s.title, children: ["Saved ", _jsx("span", { "aria-hidden": true, children: "\u2728" })] }), _jsx("p", { className: s.sub, children: "Another beautiful moment in your 777 universe." }), _jsxs("div", { className: s.foot, children: [_jsx(Button, { variant: "accent", size: "lg", block: true, onClick: () => navigate(`/memories/${saved?.id ?? ''}`, { replace: true }), children: "View memory" }), _jsx(Button, { variant: "secondary", size: "lg", block: true, onClick: () => restart(), children: "Add another" })] }), _jsx("p", { className: s.hand, children: "More moments. A closer us. \u2661" })] }))] })] }));
    function restart() {
        setNote('');
        setPhotos([]);
        setTitle('');
        setEmoji('✨');
        setDate(null);
        setPlace('');
        setFeelings([]);
        setExtra('');
        setOwnFeeling(false);
        setAsks([]);
        setAsked(0);
        setSaved(null);
        setSuggestions([]);
        setStep('write');
    }
}
/* ------------------------------- One question ------------------------------ */
function AskStep({ ask, first, feelings, ownFeeling, extra, onDate, onPlace, onFeeling, onOwnFeeling, onExtra, onNext, }) {
    const [picking, setPicking] = useState(false);
    const [typedPlace, setTypedPlace] = useState('');
    const [typedFeeling, setTypedFeeling] = useState('');
    const question = {
        date: 'Was this today?',
        place: 'Do you want to remember where this happened?',
        feeling: 'How did this moment leave you feeling?',
        more: 'Anything else you want to remember about this?',
    }[ask];
    const hand = {
        date: 'Little moments make a big love story. ♡',
        place: 'Same place, now memories. ♡',
        feeling: 'Feel it. Keep it. ♡',
        more: 'A kinder you for future you. ♡',
    }[ask];
    const toggle = (f) => onFeeling(feelings.includes(f) ? feelings.filter((v) => v !== f) : [...feelings, f]);
    return (_jsxs("div", { className: s.chat, children: [_jsx("div", { className: s.greeter, children: _jsx(CosmicGreeter, {}) }), first ? _jsx("p", { className: s.bubble, children: "That sounds like a lovely little moment \u2728" }) : null, _jsx("p", { className: s.bubble, children: question }), ask === 'date' && (_jsx("div", { className: s.options, children: picking ? (_jsxs(_Fragment, { children: [_jsx(Input, { type: "date", autoFocus: true, onChange: (e) => (e.target.value ? onDate(e.target.value) : undefined) }), _jsx("button", { type: "button", className: s.skip, onClick: () => setPicking(false), children: "Back to the quick answers" })] })) : (_jsxs(_Fragment, { children: [_jsx(Option, { icon: "\uD83D\uDC97", label: "Yes, today", onClick: () => onDate(today()) }), _jsx(Option, { icon: "\uD83D\uDDD3", label: "Choose another date", onClick: () => setPicking(true) }), _jsx(Option, { icon: "\u00B7\u00B7\u00B7", label: "Doesn\u2019t matter", onClick: () => onDate(null) })] })) })), ask === 'place' && (_jsx("div", { className: s.options, children: picking ? (_jsxs("form", { className: s.inline, onSubmit: (e) => {
                        e.preventDefault();
                        onPlace(typedPlace.trim() || null);
                    }, children: [_jsx(Input, { autoFocus: true, placeholder: "Where were you?", value: typedPlace, onChange: (e) => setTypedPlace(e.target.value) }), _jsx(Button, { type: "submit", variant: "accent", size: "lg", block: true, disabled: !typedPlace.trim(), children: "Save this place" })] })) : (_jsxs(_Fragment, { children: [_jsx(Option, { icon: "\uD83C\uDFE0", label: "At home", onClick: () => onPlace('Home') }), _jsx(Option, { icon: "\uD83D\uDCCD", label: "Add a place", onClick: () => setPicking(true) }), _jsx(Option, { icon: "\u00B7\u00B7\u00B7", label: "Skip", onClick: () => onPlace(null) })] })) })), ask === 'feeling' && (_jsxs(_Fragment, { children: [_jsxs("div", { className: s.feelings, children: [FEELINGS.map((f) => (_jsx(Chip, { emoji: FEELING_EMOJI[f], selected: feelings.includes(f), onClick: () => toggle(f), children: f }, f))), _jsx(Chip, { emoji: "\u270F\uFE0F", selected: ownFeeling, onClick: () => onOwnFeeling(!ownFeeling), children: "Add my own" })] }), ownFeeling ? (_jsxs("form", { className: s.own, onSubmit: (e) => {
                            e.preventDefault();
                            const word = typedFeeling.trim();
                            if (!word)
                                return;
                            if (!feelings.includes(word))
                                onFeeling([...feelings, word]);
                            setTypedFeeling('');
                            onOwnFeeling(false);
                        }, children: [_jsx(Input, { autoFocus: true, placeholder: "In your own word", maxLength: 24, value: typedFeeling, onChange: (e) => setTypedFeeling(e.target.value) }), _jsx(Button, { type: "submit", variant: "secondary", size: "md", disabled: !typedFeeling.trim(), children: "Add" })] })) : null, _jsx("div", { className: s.foot, children: feelings.length ? (_jsx(Button, { variant: "accent", size: "lg", block: true, onClick: onNext, children: "Continue" })) : (_jsx("button", { type: "button", className: s.skip, onClick: onNext, children: "Skip" })) })] })), ask === 'more' && (_jsxs(_Fragment, { children: [_jsx(Textarea, { value: extra, onChange: (e) => onExtra(e.target.value), placeholder: 'Add a note, just for you (optional)\n\ne.g. I loved how spontaneous it was. We should do this more often!', maxLength: 500, showCount: true, rows: 5, autoFocus: true }), _jsx("div", { className: s.foot, children: extra.trim() ? (_jsx(Button, { variant: "accent", size: "lg", block: true, onClick: onNext, children: "Continue" })) : (_jsx("button", { type: "button", className: s.skip, onClick: onNext, children: "Skip" })) })] })), _jsx("p", { className: s.hand, children: hand })] }));
}
function Option({ icon, label, onClick }) {
    return (_jsxs("button", { type: "button", className: s.option, onClick: onClick, children: [_jsx("span", { className: s.optionIcon, "aria-hidden": true, children: icon }), _jsx("span", { className: s.optionLabel, children: label })] }));
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
