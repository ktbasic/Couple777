import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useRef, useState } from 'react';
import { Sheet } from '@/components/ui/Sheet';
import { Segmented } from '@/components/ui/Segmented';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { AVATARS, AVATAR_GROUPS, AvatarArt } from '@/components/ui/AvatarArt';
import { useStore } from '@/context/store';
import { useToast } from '@/components/ui/Toast';
import s from './AvatarPicker.module.css';
/**
 * Downscale before storing. A phone photo is several megabytes and this all
 * lives in localStorage, so anything bigger than a thumbnail would blow the
 * quota and take the whole app's state down with it.
 */
function downscale(file, edge = 240) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = () => reject(new Error('read failed'));
        reader.onload = () => {
            const img = new Image();
            img.onerror = () => reject(new Error('decode failed'));
            img.onload = () => {
                const side = Math.min(img.width, img.height);
                const canvas = document.createElement('canvas');
                canvas.width = edge;
                canvas.height = edge;
                const ctx = canvas.getContext('2d');
                if (!ctx)
                    return reject(new Error('no canvas'));
                // Centre-crop to a square so it fills the circular frame.
                ctx.drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, 0, 0, edge, edge);
                resolve(canvas.toDataURL('image/jpeg', 0.82));
            };
            img.src = String(reader.result);
        };
        reader.readAsDataURL(file);
    });
}
export function AvatarPicker({ person, open, onClose, }) {
    const { dispatch, me, state } = useStore();
    const toast = useToast();
    const fileRef = useRef(null);
    const [error, setError] = useState(null);
    const [picked, setPicked] = useState(null);
    const [tab, setTab] = useState(() => AVATARS.find((a) => a.id === person.avatarId)?.group ?? 'People');
    const [renaming, setRenaming] = useState(false);
    const [draft, setDraft] = useState(person.name);
    const [editingDetails, setEditingDetails] = useState(false);
    const [ageDraft, setAgeDraft] = useState(person.age ? String(person.age) : '');
    const [jobDraft, setJobDraft] = useState(person.occupation ?? '');
    /*
     * You can change your own name and face. You can change what your partner
     * is called only until they have an account of their own — after that the
     * name and the avatar are theirs, on their row, behind a policy that only
     * lets a person edit their own. Offering the control anyway would produce a
     * change that looks saved and is gone on the next load.
     */
    const isMe = person.id === me.id;
    const editable = isMe || !state.couple.partnerJoined;
    const saveName = () => {
        const next = draft.trim();
        if (next && next !== person.name) {
            dispatch({ type: 'renamePerson', personId: person.id, name: next });
            toast.show({ emoji: '\u270F\uFE0F', message: 'Name updated' });
        }
        setRenaming(false);
    };
    /*
     * Both fields are optional, so an empty one is an answer: it clears what was
     * there. A number that could not be an age is not an answer, though — that
     * is a typo, and saving it would be worse than keeping the form open.
     */
    const parsedAge = Number.parseInt(ageDraft, 10);
    const ageValid = Number.isFinite(parsedAge) && parsedAge >= 13 && parsedAge <= 120;
    const ageBad = Boolean(ageDraft.trim()) && !ageValid;
    const openDetails = () => {
        setAgeDraft(person.age ? String(person.age) : '');
        setJobDraft(person.occupation ?? '');
        setEditingDetails(true);
    };
    const saveDetails = () => {
        if (ageBad)
            return;
        dispatch({
            type: 'setPersonDetails',
            personId: person.id,
            age: ageValid ? parsedAge : undefined,
            occupation: jobDraft.trim() || undefined,
        });
        toast.show({ emoji: '\u2728', message: 'Profile updated' });
        setEditingDetails(false);
    };
    /* Age and what you do, on one line, in that order, and only what exists. */
    const summary = person.age && person.occupation
        ? `${person.age} \u00B7 ${person.occupation}`
        : person.age
            ? `${person.age} years old`
            : (person.occupation ?? null);
    // The sheet stays open so the preview at the top updates under your thumb
    // and you can try a few. Closing on the first tap made it a one-shot guess.
    const choose = (avatarId) => {
        setPicked(avatarId);
        dispatch({ type: 'setPersonAvatar', personId: person.id, avatarId });
        window.setTimeout(() => setPicked(null), 500);
    };
    const upload = async (file) => {
        setError(null);
        try {
            const avatarUrl = await downscale(file);
            dispatch({ type: 'setPersonAvatar', personId: person.id, avatarUrl });
            toast.show({ emoji: '📷', message: 'Photo saved' });
            onClose();
        }
        catch {
            setError("That image couldn't be read. Try a different one.");
        }
    };
    return (_jsxs(Sheet, { open: open, onClose: onClose, title: `${person.name}'s avatar`, children: [_jsxs("div", { className: [s.current, isMe && editingDetails ? s.currentEditing : ''].filter(Boolean).join(' '), children: [_jsx(Avatar, { person: person, size: 54 }), _jsx("div", { className: s.currentMain, children: renaming ? (_jsxs("form", { className: s.nameForm, onSubmit: (e) => {
                                e.preventDefault();
                                saveName();
                            }, children: [_jsx("input", { className: s.nameInput, value: draft, onChange: (e) => setDraft(e.target.value), maxLength: 40, autoFocus: true, "aria-label": "Name", onKeyDown: (e) => {
                                        if (e.key === 'Escape')
                                            setRenaming(false);
                                    } }), _jsx("button", { type: "submit", className: s.nameSave, disabled: !draft.trim(), children: "Save" }), _jsx("button", { type: "button", className: s.nameCancel, onClick: () => setRenaming(false), children: "Cancel" })] })) : (_jsxs(_Fragment, { children: [_jsxs("div", { className: s.nameRow, children: [_jsx("p", { className: s.currentName, children: person.name }), editable ? (_jsx("button", { type: "button", className: s.editName, "aria-label": `Change ${isMe ? 'your' : `${person.name}'s`} name`, onClick: () => {
                                                setDraft(person.name);
                                                setRenaming(true);
                                            }, children: _jsx(PencilIcon, {}) })) : null] }), isMe && editingDetails ? (_jsxs("form", { className: s.detailsForm, onSubmit: (e) => {
                                        e.preventDefault();
                                        saveDetails();
                                    }, onKeyDown: (e) => {
                                        if (e.key === 'Escape')
                                            setEditingDetails(false);
                                    }, children: [_jsxs("label", { className: s.field, children: [_jsx("span", { className: s.fieldLabel, children: "Age" }), _jsx("input", { className: s.ageInput, value: ageDraft, onChange: (e) => setAgeDraft(e.target.value.replace(/[^0-9]/g, '')), inputMode: "numeric", maxLength: 3, autoFocus: true, "aria-label": "Age", placeholder: "Age" })] }), _jsxs("label", { className: s.field, children: [_jsx("span", { className: s.fieldLabel, children: "What do you do?" }), _jsx("input", { className: s.jobInput, value: jobDraft, onChange: (e) => setJobDraft(e.target.value), maxLength: 60, autoComplete: "organization-title", placeholder: "Designer, student, doctor\u2026" }), _jsx("span", { className: s.fieldHelp, children: "Optional \u2014 helps tailor ideas to your lifestyle." })] }), _jsxs("div", { className: s.detailsActions, children: [_jsx("button", { type: "submit", className: s.nameSave, disabled: ageBad, children: "Save" }), _jsx("button", { type: "button", className: s.nameCancel, onClick: () => setEditingDetails(false), children: "Cancel" })] })] })) : isMe ? (_jsx("button", { type: "button", className: summary ? s.currentHint : s.addAge, onClick: openDetails, children: summary ?? 'Add your age' })) : (_jsx("p", { className: s.currentHint, children: summary ?? 'Nothing shared yet' }))] })) })] }), !editable ? (_jsxs("p", { className: s.theirs, children: [person.name, " picks their own name and avatar on their phone. Yours is the one you can change here."] })) : null, error ? _jsx("p", { className: s.error, children: error }) : null, editable ? (_jsxs(_Fragment, { children: [_jsxs("label", { className: s.upload, children: [_jsx("span", { "aria-hidden": true, children: "\uD83D\uDCF7" }), "Upload a photo", _jsx("input", { ref: fileRef, type: "file", accept: "image/*", hidden: true, onChange: (e) => {
                                    const file = e.target.files?.[0];
                                    if (file)
                                        void upload(file);
                                    e.target.value = '';
                                } })] }), _jsx("div", { className: s.tabs, children: _jsx(Segmented, { value: tab, onChange: setTab, options: AVATAR_GROUPS.map((g) => ({ value: g, label: g })) }) }), AVATAR_GROUPS.filter((g) => g === tab).map((group) => {
                        const items = AVATARS.filter((a) => a.group === group);
                        return (_jsx("div", { children: _jsx("div", { className: s.grid, children: items.map((a) => {
                                    const selected = !person.avatarUrl && person.avatarId === a.id;
                                    return (_jsxs("button", { type: "button", "aria-label": a.label, title: a.label, "aria-pressed": selected, className: [
                                            s.option,
                                            selected ? s.optionOn : '',
                                            picked === a.id ? s.optionPop : '',
                                        ]
                                            .filter(Boolean)
                                            .join(' '), onClick: () => choose(a.id), children: [_jsx(AvatarArt, { id: a.id, size: 54 }), selected ? (_jsx("span", { className: s.tick, "aria-hidden": true, children: "\u2713" })) : null] }, a.id));
                                }) }) }, group));
                    })] })) : null, _jsx("div", { className: s.done, children: _jsx(Button, { variant: "accent", block: true, onClick: onClose, children: "Done" }) })] }));
}
/** A small pencil, drawn so it takes the ink colour around it. */
function PencilIcon() {
    return (_jsx("svg", { viewBox: "0 0 16 16", width: "14", height: "14", "aria-hidden": true, children: _jsx("path", { d: "M10.6 2.4a1.6 1.6 0 0 1 2.3 2.3L5.6 12 2.5 13.5 4 10.4z", fill: "none", stroke: "currentColor", strokeWidth: "1.5", strokeLinejoin: "round" }) }));
}
