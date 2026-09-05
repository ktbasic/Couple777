import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Photo } from '@/components/ui/Photo';
import { HeartToggle } from '@/components/ui/HeartToggle';
import { useStore } from '@/context/store';
import { useToast } from '@/components/ui/Toast';
import s from './IdeaCard.module.css';
function duration(mins) {
    if (mins < 60)
        return `${mins} min`;
    const h = mins / 60;
    return Number.isInteger(h) ? `${h} hours` : `${Math.floor(h)}h ${mins % 60}m`;
}
function cost(euros) {
    return euros === 0 ? 'Free' : `~€${euros}`;
}
export function IdeaCard({ idea, index = 0, cycleId, }) {
    const { state, dispatch } = useStore();
    const toast = useToast();
    const navigate = useNavigate();
    const saved = state.savedIdeaIds.includes(idea.id);
    return (_jsxs("article", { className: s.card, style: { animationDelay: `${index * 70}ms` }, children: [_jsxs("div", { className: s.hero, children: [_jsx(Photo, { src: idea.image, seed: idea.id, ratio: "16 / 9", className: s.img, alt: "" }), _jsx(HeartToggle, { saved: saved, label: saved ? 'Saved' : 'Save this idea', onToggle: () => {
                            dispatch({ type: 'toggleSavedIdea', id: idea.id });
                            toast.show({
                                message: saved ? 'Removed from saved' : 'Saved to your ideas',
                            });
                        } })] }), _jsxs("div", { className: s.body, children: [_jsxs("h3", { className: s.title, children: [_jsx("span", { className: s.emoji, "aria-hidden": true, children: idea.emoji }), idea.title] }), _jsx("p", { className: s.desc, children: idea.description }), _jsxs("div", { className: s.facts, children: [_jsxs("span", { className: s.fact, children: ["\uD83D\uDD70 ", duration(idea.duration)] }), _jsxs("span", { className: s.fact, children: ["\uD83D\uDCB6 ", cost(idea.cost)] }), _jsxs("span", { className: s.fact, children: ["\uD83E\uDDFA ", idea.prep] })] }), _jsxs("div", { className: s.why, children: [_jsx("p", { className: s.whyLabel, children: "Why this one" }), _jsx("p", { className: s.whyBody, children: idea.why })] }), _jsxs("div", { className: s.actions, children: [_jsx(Button, { variant: "accent", size: "sm", onClick: () => navigate(`/plan/new?idea=${idea.id}${cycleId ? `&cycle=${cycleId}` : ''}`), children: "Make this the plan" }), _jsx(Button, { variant: "quiet", size: "sm", onClick: () => navigate(`/plan/new?idea=${idea.id}&surprise=1${cycleId ? `&cycle=${cycleId}` : ''}`), children: "Surprise them" })] })] })] }));
}
