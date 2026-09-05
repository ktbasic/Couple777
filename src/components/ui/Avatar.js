import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { AvatarArt, avatarById } from './AvatarArt';
import s from './Avatar.module.css';
/**
 * Three fallbacks deep: an uploaded photo, then a chosen Couple777 avatar,
 * then the person's initial. A broken image never shows.
 */
export function Avatar({ person, size = 32, ring, }) {
    const [failed, setFailed] = useState(false);
    const art = avatarById(person.avatarId);
    const showPhoto = Boolean(person.avatarUrl) && !failed;
    return (_jsxs("span", { className: [s.avatar, ring ? s.ring : ''].filter(Boolean).join(' '), style: { width: size, height: size, fontSize: size * 0.4 }, title: person.name, children: [!showPhoto && art ? (_jsx(AvatarArt, { id: art.id, size: size })) : (_jsx("span", { "aria-hidden": showPhoto, children: person.initial })), showPhoto ? (_jsx("img", { className: s.img, src: person.avatarUrl, alt: "", loading: "lazy", onError: () => setFailed(true) })) : null] }));
}
export function AvatarPair({ people, size = 30 }) {
    return (_jsx("span", { className: s.pair, children: people.map((p) => (_jsx(Avatar, { person: p, size: size }, p.id))) }));
}
