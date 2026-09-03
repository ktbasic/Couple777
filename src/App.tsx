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
function RequireCouple({ children }: { children: React.ReactNode }) {
  const { status, state } = useStore();
  const location = useLocation();

  if (status === 'unconfigured') return <NeedsSetupScreen />;
  if (status === 'loading') return null;
  if (status === 'signed-out') {
    return <Navigate to="/onboarding" replace state={{ from: location.pathname }} />;
  }
  if (status === 'no-couple') return <Navigate to="/couple" replace />;
  // Shown once per person, after there is a second person for the promises to
  // be about. Both partners see it, including the one who arrived by link.
  if (!hasSeenPrivacy(state.couple.currentPersonId)) {
    return <Navigate to="/privacy" replace />;
  }
  return <>{children}</>;
}

export function App() {
  const [splashOpen, dismissSplash] = useSplash();
  // The app fades and rises up while the splash lifts away, so the two moves
  // overlap into one instead of cutting. The animation settles on
  // `transform: none` deliberately: a wrapper left holding a transform would
  // become the containing block for every position: fixed sheet below it.
  const [handingOff, setHandingOff] = useState(false);

  return (
    <>
      {splashOpen ? <Splash onLeave={() => setHandingOff(true)} onDone={dismissSplash} /> : null}
      <div className={handingOff ? a.entering : undefined}>
        <Routes>
          <Route path="/onboarding" element={<OnboardingScreen />} />
        <Route path="/account" element={<AccountScreen />} />
        <Route path="/couple" element={<CoupleSetupScreen />} />
        {/* The partner's way in. Deliberately reachable signed-out. */}
        <Route path="/join/:code" element={<JoinInviteScreen />} />
        <Route path="/privacy" element={<PrivacyScreen />} />
        <Route path="/me/setup" element={<MeSetupScreen />} />

          {/* Tabbed surfaces */}
          <Route
            element={
              <RequireCouple>
                <AppShell />
              </RequireCouple>
            }
          >
            <Route index element={<HomeScreen />} />
            <Route path="/explore" element={<ExploreScreen />} />
            <Route path="/memories" element={<MemoriesScreen />} />
            <Route path="/talk" element={<TalkScreen />} />
            <Route path="/us" element={<UsScreen />} />
          </Route>

          {/* Pushed flows — no tab bar, so the screen keeps your attention. */}
          <Route
            element={
              <RequireCouple>
                <AppShell tabs={false} />
              </RequireCouple>
            }
          >
            <Route path="/plan/new" element={<PlanEditScreen />} />
            <Route path="/plan/:planId/edit" element={<PlanEditScreen />} />
            <Route path="/plan/:planId" element={<PlanDetailScreen />} />

            <Route path="/memories/new" element={<MemoryCaptureScreen />} />
            <Route path="/memories/:memoryId" element={<MemoryDetailScreen />} />

            <Route path="/talk/daily" element={<DailyQuestionScreen />} />
            <Route path="/talk/room" element={<RoomScreen />} />
            <Route path="/talk/room/:topicId" element={<RoomSessionScreen />} />
            <Route path="/talk/notes" element={<NotesScreen />} />
            <Route path="/talk/notes/new" element={<NoteComposeScreen />} />

            <Route path="/us/settings" element={<SettingsScreen />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </>
  );
}
