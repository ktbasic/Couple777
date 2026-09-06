import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useNavigate } from 'react-router-dom';
import { Photo } from '@/components/ui/Photo';
import { useStore } from '@/context/store';
import { useToast } from '@/components/ui/Toast';
import s from './IdeaCard.module.css';
function duration(mins) {
    if (mins < 60)
        return `${mins} min`;
    const h = mins / 60;
    return Number.isInteger(h) ? `${h} hrs` : `${Math.floor(h)}–${Math.ceil(h)} hrs`;
}
function cost(euros) {
    return euros === 0 ? 'Free' : euros <= 30 ? '€' : euros <= 60 ? '€€' : '€€€';
}
const HEART = (filled) => (_jsx("svg", { viewBox: "0 0 24 24", width: "17", height: "17", "aria-hidden": true, children: _jsx("path", { d: "M12 20.4C5.6 15.9 2.4 12.6 2.4 8.9 2.4 5.9 4.7 3.6 7.5 3.6c1.8 0 3.4.9 4.5 2.4 1.1-1.5 2.7-2.4 4.5-2.4 2.8 0 5.1 2.3 5.1 5.3 0 3.7-3.2 7-9.6 11.5Z", fill: filled ? 'currentColor' : 'none', stroke: "currentColor", strokeWidth: filled ? 0 : 1.7, strokeLinejoin: "round" }) }));
/* Two short words per idea, drawn from what it already is rather than a new
   field to keep in sync: where it happens, and what it feels like. */
function tagsFor(idea) {
    const where = idea.setting === 'home' ? 'Indoor' : 'Outdoor';
    const vibe = idea.vibes[0];
    const feel = vibe ? vibe.charAt(0).toUpperCase() + vibe.slice(1) : null;
    return feel ? [where, feel] : [where];
}
const PLUS = (_jsx("svg", { viewBox: "0 0 24 24", width: "14", height: "14", "aria-hidden": true, children: _jsx("path", { d: "M12 5.5v13M5.5 12h13", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round" }) }));
/**
 * One idea, compact.
 *
 * Two ways to keep it, and they are not the same thing. The heart is yours
 * and stays yours. "Add to our list" tells them. Putting both on the card is
 * the only way the difference is ever visible — a single save button would
 * have made the private one impossible to offer.
 */
export function IdeaCard({ idea, index = 0, cycleId, }) {
    const { state, dispatch, me, partner } = useStore();
    const toast = useToast();
    const navigate = useNavigate();
    const row = state.savedIdeas.find((i) => i.id === idea.id);
    const liked = Boolean(row?.likedBy.includes(me.id));
    const shared = Boolean(row?.sharedBy.length);
    const matched = Boolean(row?.matchedAt);
    const like = () => {
        const wouldMatch = !liked && Boolean(row?.likedBy.includes(partner.id));
        dispatch({ type: 'likeIdea', id: idea.id, personId: me.id, partnerId: partner.id });
        toast.show(wouldMatch
            ? { emoji: '💕', message: 'You both saved this!' }
            : { emoji: liked ? '' : '❤️', message: liked ? 'Removed' : 'Liked — just for you' });
    };
    const share = () => {
        dispatch({ type: 'shareIdea', id: idea.id, personId: me.id });
        toast.show({
            emoji: shared ? '' : '✨',
            message: shared ? 'Off our list' : `On our list — ${partner.name} can see it`,
        });
    };
    return (_jsxs("article", { className: s.card, style: { animationDelay: `${index * 60}ms` }, children: [_jsx("button", { type: "button", className: s.shot, onClick: () => navigate(`/plan/new?idea=${idea.id}${cycleId ? `&cycle=${cycleId}` : ''}`), "aria-label": `Plan ${idea.title}`, children: _jsx(Photo, { src: idea.image, seed: idea.id, ratio: "1 / 1", className: s.img, alt: "" }) }), _jsxs("div", { className: s.main, children: [_jsxs("div", { className: s.head, children: [_jsx("h3", { className: s.title, children: idea.title }), _jsx("button", { type: "button", className: [s.heart, liked ? s.hearted : ''].filter(Boolean).join(' '), "aria-pressed": liked, "aria-label": liked ? 'Liked' : 'Like this idea', onClick: like, children: HEART(liked) })] }), _jsx("p", { className: s.desc, children: idea.description }), _jsxs("div", { className: s.tags, children: [tagsFor(idea).map((t) => (_jsx("span", { className: s.tag, children: t }, t))), _jsxs("span", { className: s.meta, children: [duration(idea.duration), " \u00B7 ", cost(idea.cost)] })] }), matched ? (_jsx("p", { className: s.matched, children: "You both saved this \uD83D\uDC95" })) : (_jsx("button", { type: "button", className: [s.add, shared ? s.added : ''].filter(Boolean).join(' '), onClick: share, children: shared ? '✓ On our list' : _jsxs(_Fragment, { children: [PLUS, " Add to our list"] }) }))] })] }));
}
