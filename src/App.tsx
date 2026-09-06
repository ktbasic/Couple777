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
import PrivacyScreen from './screens/Privacy';
import MeSetupScreen from './screens/MeSetup';
import NameSetupScreen from './screens/NameSetup';
import HomeScreen from './screens/Home';
import ExploreScreen from './screens/Explore';
import MemoriesScreen from './screens/Memories';
import MemoryDetailScreen from './screens/MemoryDetail';
import MemoryCaptureScreen from './screens/MemoryCapture';
import TalkScreen from './screens/Talk';
import CommunityScreen from './screens/Community';
import PostDetailScreen from './screens/PostDetail';
import PostComposeScreen from './screens/PostCompose';
import DailyQuestionScreen from './screens/DailyQuestion';
import RoomScreen from './screens/Room';
import RoomSessionScreen from './screens/RoomSession';
import NotesScreen from './screens/Notes';
import NoteComposeScreen from './screens/NoteCompose';
import PlanEditScreen from './screens/PlanEdit';
import PlanDetailScreen from './screens/PlanDetail';
import UsScreen from './screens/Us';
import SettingsScreen from './screens/Settings';

/** Everything that used to live at /talk/... now lives under /us/talk/... */
function TalkRedirect() {
  const { pathname, search } = useLocation();
  return <Navigate to={`/us${pathname}${search}`} replace />;
}

/**
 * The app proper is behind a real account in a real couple.
 *
 * Each redirect below is a different missing thing, and sending someone to the
 * wrong one is how people get stuck in a loop: signed in but spaceless lands
 * on couple setup, not back on sign-up.
 *
 * Signed-out lands on the account screen rather than the intro. Someone
 * returning is not a new user, and the four questions of onboarding are for
 * people who do not have answers yet — /account decides which of the two this
 * is, once it knows who they are.
 */
function RequireCouple({ children }: { children: React.ReactNode }) {
  const { status } = useStore();
  const location = useLocation();

  if (status === 'unconfigured') return <NeedsSetupScreen />;
  if (status === 'loading') return null;
  if (status === 'signed-out') {
    return <Navigate to="/account" replace state={{ from: location.pathname }} />;
  }
  if (status === 'no-couple') return <Navigate to="/couple" replace />;
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
        <Route path="/me/name" element={<NameSetupScreen />} />
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
            {/* Community opens on the feed. There is no landing page in
                between, so the tab and the reading are the same tap. */}
            <Route path="/community" element={<CommunityScreen />} />
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

            {/* The conversation belongs to the two of you, so it lives under
                Us. The old /talk/* paths still resolve — they are in sent
                notifications and in people's history. */}
            <Route path="/us/talk" element={<TalkScreen />} />
            <Route path="/us/talk/daily" element={<DailyQuestionScreen />} />
            <Route path="/us/talk/room" element={<RoomScreen />} />
            <Route path="/us/talk/room/:topicId" element={<RoomSessionScreen />} />
            <Route path="/us/talk/notes" element={<NotesScreen />} />
            <Route path="/us/talk/notes/new" element={<NoteComposeScreen />} />

            <Route path="/community/new" element={<PostComposeScreen />} />
            <Route path="/community/:postId" element={<PostDetailScreen />} />

            <Route path="/us/settings" element={<SettingsScreen />} />
          </Route>

          <Route path="/talk" element={<Navigate to="/us/talk" replace />} />
          <Route path="/talk/*" element={<TalkRedirect />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </>
  );
}
