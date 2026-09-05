import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Photo } from '@/components/ui/Photo';
import s from './AdventureCard.module.css';
export function AdventureCard({ idea, index = 0, cycleId, }) {
    const navigate = useNavigate();
    return (_jsxs("article", { className: s.card, style: { animationDelay: `${index * 70}ms` }, children: [_jsx(Photo, { src: idea.image, seed: idea.id, ratio: "16 / 9", alt: "" }), _jsxs("div", { className: s.body, children: [_jsx("p", { className: s.place, children: idea.place }), _jsxs("h3", { className: s.title, children: [idea.emoji, " ", idea.title] }), _jsx("p", { className: s.desc, children: idea.description }), _jsx("p", { className: s.why, children: idea.why }), _jsxs("div", { className: s.facts, children: [_jsxs("span", { className: s.fact, children: ["\uD83D\uDE86 ", idea.travelTime] }), _jsxs("span", { className: s.fact, children: ["\uD83D\uDCB6 ", idea.cost] })] }), _jsx("div", { className: s.actions, children: _jsx(Button, { variant: "secondary", size: "sm", block: true, onClick: () => navigate(`/plan/new?adventure=${idea.id}${cycleId ? `&cycle=${cycleId}` : ''}`), children: "Make this the plan" }) })] })] }));
}
