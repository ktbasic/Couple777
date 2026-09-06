import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useStore } from '@/context/store';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { QUEST_WEEK_AVERAGE, QUEST_WEEK_GOAL, questForDate } from '@/data/quests';
import { today } from '@/lib/dates';
import { starsThisWeek } from '@/lib/selectors';
import s from './LittleQuest.module.css';
/**
 * One small thing, worth one star.
 *
 * There is no streak here on purpose. A streak makes the seventh good week
 * feel like an obligation and the first missed day feel like a failure, which
 * is the opposite of what this is for. The week's stars reset on their own and
 * nothing carries a penalty into the next one.
 */
export function LittleQuest() {
    const { state, dispatch } = useStore();
    const toast = useToast();
    const date = today();
    const doneIds = state.questsDone.map((q) => q.questId);
    const quest = questForDate(date, state.couple.profile.wishes ?? [], doneIds, state.questsSkipped);
    const stars = starsThisWeek(state);
    const reached = stars >= QUEST_WEEK_GOAL;
    if (!quest)
        return null;
    const done = () => {
        dispatch({ type: 'completeQuest', questId: quest.id });
        toast.show({
            emoji: '⭐',
            message: stars + 1 >= QUEST_WEEK_GOAL ? `${QUEST_WEEK_GOAL} stars this week` : 'One star',
        });
    };
    return (_jsxs("div", { className: s.card, children: [_jsxs("div", { className: s.top, children: [_jsx("p", { className: s.eyebrow, children: "Little quest" }), _jsxs("span", { className: s.count, children: [stars, "/", QUEST_WEEK_GOAL, " \u2605"] })] }), _jsxs("div", { className: s.main, children: [_jsx("span", { className: s.emoji, "aria-hidden": true, children: quest.emoji }), _jsxs("div", { children: [_jsx("p", { className: s.title, children: quest.title }), _jsx("p", { className: s.body, children: quest.body })] })] }), _jsx("div", { className: s.stars, "aria-label": `${stars} of ${QUEST_WEEK_GOAL} stars this week`, children: Array.from({ length: QUEST_WEEK_GOAL }, (_, i) => (_jsx("span", { className: [s.star, i < stars ? s.starOn : ''].filter(Boolean).join(' '), "aria-hidden": true, children: "\u2605" }, i))) }), _jsx("p", { className: s.scale, children: reached
                    ? `That's the week. Anything else is a bonus.`
                    : `${quest.minutes} min · most couples get about ${QUEST_WEEK_AVERAGE} a week.` }), _jsxs("div", { className: s.actions, children: [_jsx(Button, { variant: "accent", size: "sm", onClick: done, children: "We did it \u2B50" }), _jsx(Button, { variant: "quiet", size: "sm", onClick: () => dispatch({ type: 'skipQuest', questId: quest.id }), children: "Another one" })] })] }));
}
