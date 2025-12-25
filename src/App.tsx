import { useEffect } from 'react';
import { MainLayout } from '@/layouts/MainLayout';
import { ConnectionsDashboard } from '@/pages/ConnectionsDashboard';
import { TerminalPage } from '@/pages/TerminalPage';
import { useSessionStore } from '@/store/sessionStore';
import { useUIStore } from '@/store/uiStore';
import { OnboardingFlow } from '@/components/Onboarding/OnboardingFlow';
import "./App.css";

function App() {
  const { activeSessionId, currentView } = useSessionStore();
  const { hasCompletedOnboarding } = useUIStore();

  useEffect(() => {
    // Optional: Prevent default browser shortcuts like Ctrl+F
  }, []);

  if (!hasCompletedOnboarding) {
    return <OnboardingFlow />;
  }

  return (
    <div className="h-screen w-screen overflow-hidden bg-background text-foreground">
      <MainLayout>
        {/* Persistent Terminal Page - hidden when not in view, but kept alive */}
        <div className={activeSessionId ? (currentView === 'terminal' ? 'block h-full' : 'hidden') : 'hidden'}>
          <TerminalPage />
        </div>

        {/* Dashboard - conditionally rendered (can be unmounted) */}
        {currentView === 'dashboard' && (
          <ConnectionsDashboard />
        )}
      </MainLayout>
    </div>
  );
}

export default App;
