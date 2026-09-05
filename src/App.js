import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell';
import { useStore } from './context/store';
import { Splash, useSplash } from './screens/Splash';
import a from './App.module.css';
import OnboardingScreen from './screens/Onboarding';
import AccountScreen from './screens/Account';
import CoupleSetupScreen from './screens/CoupleSetup';
import JoinInviteScreen from './screens/JoinInvite';
import NeedsSetupScreen from './screens/NeedsSetup';
import PrivacyScreen, { hasSeenPrivacy } from './screens/Privacy';
import MeSetupScreen from './screens/MeSetup';
import NameSetupScreen from './screens/NameSetup';
import HomeScreen from './screens/Home';
import ExploreScreen from './screens/Explore';
import MemoriesScreen from './screens/Memories';
import MemoryDetailScreen from './screens/MemoryDetail';
import MemoryCaptureScreen from './screens/MemoryCapture';
import TalkScreen from './screens/Talk';
import DailyQuestionScreen from './screens/DailyQuestion';
import RoomScreen from './screens/Room';
import RoomSessionScreen from './screens/RoomSession';
import NotesScreen from './screens/Notes';
import NoteComposeScreen from './screens/NoteCompose';
import PlanEditScreen from './screens/PlanEdit';
import PlanDetailScreen from './screens/PlanDetail';
import UsScreen from './screens/Us';
import SettingsScreen from './screens/Settings';
/**
 * The app proper is behind a real account in a real couple.
 *
 * Each redirect below is a different missing thing, and sending someone to the
 * wrong one is how people get stuck in a loop: signed in but spaceless lands
 * on couple setup, not back on sign-up.
 */
function RequireCouple({ children }) {
    const { status, state } = useStore();
    const location = useLocation();
    if (status === 'unconfigured')
        return _jsx(NeedsSetupScreen, {});
    if (status === 'loading')
        return null;
    if (status === 'signed-out') {
        return _jsx(Navigate, { to: "/onboarding", replace: true, state: { from: location.pathname } });
    }
    if (status === 'no-couple')
        return _jsx(Navigate, { to: "/couple", replace: true });
    // Shown once per person, after there is a second person for the promises to
    // be about. Both partners see it, including the one who arrived by link.
    if (!hasSeenPrivacy(state.couple.currentPersonId)) {
        return _jsx(Navigate, { to: "/privacy", replace: true });
    }
    return _jsx(_Fragment, { children: children });
}
export function App() {
    const [splashOpen, dismissSplash] = useSplash();
    // The app fades and rises up while the splash lifts away, so the two moves
    // overlap into one instead of cutting. The animation settles on
    // `transform: none` deliberately: a wrapper left holding a transform would
    // become the containing block for every position: fixed sheet below it.
    const [handingOff, setHandingOff] = useState(false);
    return (_jsxs(_Fragment, { children: [splashOpen ? _jsx(Splash, { onLeave: () => setHandingOff(true), onDone: dismissSplash }) : null, _jsx("div", { className: handingOff ? a.entering : undefined, children: _jsxs(Routes, { children: [_jsx(Route, { path: "/onboarding", element: _jsx(OnboardingScreen, {}) }), _jsx(Route, { path: "/account", element: _jsx(AccountScreen, {}) }), _jsx(Route, { path: "/couple", element: _jsx(CoupleSetupScreen, {}) }), _jsx(Route, { path: "/join/:code", element: _jsx(JoinInviteScreen, {}) }), _jsx(Route, { path: "/privacy", element: _jsx(PrivacyScreen, {}) }), _jsx(Route, { path: "/me/name", element: _jsx(NameSetupScreen, {}) }), _jsx(Route, { path: "/me/setup", element: _jsx(MeSetupScreen, {}) }), _jsxs(Route, { element: _jsx(RequireCouple, { children: _jsx(AppShell, {}) }), children: [_jsx(Route, { index: true, element: _jsx(HomeScreen, {}) }), _jsx(Route, { path: "/explore", element: _jsx(ExploreScreen, {}) }), _jsx(Route, { path: "/memories", element: _jsx(MemoriesScreen, {}) }), _jsx(Route, { path: "/talk", element: _jsx(TalkScreen, {}) }), _jsx(Route, { path: "/us", element: _jsx(UsScreen, {}) })] }), _jsxs(Route, { element: _jsx(RequireCouple, { children: _jsx(AppShell, { tabs: false }) }), children: [_jsx(Route, { path: "/plan/new", element: _jsx(PlanEditScreen, {}) }), _jsx(Route, { path: "/plan/:planId/edit", element: _jsx(PlanEditScreen, {}) }), _jsx(Route, { path: "/plan/:planId", element: _jsx(PlanDetailScreen, {}) }), _jsx(Route, { path: "/memories/new", element: _jsx(MemoryCaptureScreen, {}) }), _jsx(Route, { path: "/memories/:memoryId", element: _jsx(MemoryDetailScreen, {}) }), _jsx(Route, { path: "/talk/daily", element: _jsx(DailyQuestionScreen, {}) }), _jsx(Route, { path: "/talk/room", element: _jsx(RoomScreen, {}) }), _jsx(Route, { path: "/talk/room/:topicId", element: _jsx(RoomSessionScreen, {}) }), _jsx(Route, { path: "/talk/notes", element: _jsx(NotesScreen, {}) }), _jsx(Route, { path: "/talk/notes/new", element: _jsx(NoteComposeScreen, {}) }), _jsx(Route, { path: "/us/settings", element: _jsx(SettingsScreen, {}) })] }), _jsx(Route, { path: "*", element: _jsx(Navigate, { to: "/", replace: true }) })] }) })] }));
}
