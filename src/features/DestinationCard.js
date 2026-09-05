import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useNavigate } from 'react-router-dom';
import { Photo } from '@/components/ui/Photo';
import { Button } from '@/components/ui/Button';
import { HeartToggle } from '@/components/ui/HeartToggle';
import { useStore } from '@/context/store';
import { useToast } from '@/components/ui/Toast';
import s from './DestinationCard.module.css';
/**
 * Saving is secret. You can see that *you* saved something, never that your
 * partner did — until you both have, which is the whole point of the feature.
 */
export function DestinationCard({ destination }) {
    const { me, dispatch } = useStore();
    const toast = useToast();
    const savedByMe = destination.savedBy.includes(me.id);
    const isMatch = destination.savedBy.length === 2 && destination.matchSeen;
    return (_jsxs("article", { className: s.card, children: [_jsx(Photo, { src: destination.image, seed: destination.id, className: s.img, alt: "" }), _jsx("span", { className: s.scrim, "aria-hidden": true }), isMatch ? _jsx("span", { className: s.match, children: "\u2726 Match" }) : null, _jsx(HeartToggle, { saved: savedByMe, label: savedByMe ? 'Remove from your list' : 'Add to your list, privately', onToggle: () => {
                    dispatch({ type: 'toggleDestination', id: destination.id, personId: me.id });
                    if (!savedByMe) {
                        toast.show({ emoji: '🤫', message: `${destination.name} added, privately` });
                    }
                } }), _jsxs("div", { className: s.body, children: [_jsx("h3", { className: s.name, children: destination.name }), _jsx("p", { className: s.country, children: destination.country })] })] }));
}
/** Shown once, when a secret save turns out to be mutual. */
export function MatchReveal({ destination }) {
    const { dispatch, partner } = useStore();
    const navigate = useNavigate();
    return (_jsxs("div", { className: s.reveal, children: [_jsx(Photo, { src: destination.image, seed: `${destination.id}-reveal`, className: s.revealImg, alt: "" }), _jsx("span", { className: s.revealScrim, "aria-hidden": true }), _jsx("p", { className: s.revealEyebrow, children: "Our matches" }), _jsxs("h3", { className: s.revealTitle, children: ["You both want to go to ", destination.name, " \u2764\uFE0F"] }), _jsxs("p", { className: s.revealBody, children: ["You and ", partner.name, " added this separately, without knowing. ", destination.bestTime, " is the time to go."] }), _jsxs("div", { className: s.revealActions, children: [_jsx(Button, { variant: "accent", size: "sm", onClick: () => {
                            dispatch({ type: 'markMatchSeen', id: destination.id });
                            navigate(`/plan/new?destination=${destination.id}`);
                        }, children: "Start planning it" }), _jsx(Button, { variant: "quiet", size: "sm", onClick: () => dispatch({ type: 'markMatchSeen', id: destination.id }), children: "Not yet" })] })] }));
}
