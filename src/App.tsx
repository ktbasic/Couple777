import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell';
import { useStore } from './context/store';

import OnboardingScreen from './screens/Onboarding';
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

/** Everything is behind the couple being set up. */
function RequireOnboarding({ children }: { children: React.ReactNode }) {
  const { state } = useStore();
  const location = useLocation();
  if (!state.onboarded) {
    return <Navigate to="/onboarding" replace state={{ from: location.pathname }} />;
  }
  return <>{children}</>;
}

export function App() {
  return (
    <Routes>
      <Route path="/onboarding" element={<OnboardingScreen />} />

      {/* Tabbed surfaces */}
      <Route
        element={
          <RequireOnboarding>
            <AppShell />
          </RequireOnboarding>
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
          <RequireOnboarding>
            <AppShell tabs={false} />
          </RequireOnboarding>
        }
      >
        <Route path="/plan/new/:tier" element={<PlanEditScreen />} />
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
  );
}
