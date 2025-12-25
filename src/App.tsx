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
  const { hasCompletedOnboarding, theme } = useUIStore();

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement;

    // Remove existing theme classes
    root.classList.remove('light', 'dark');

    if (theme === 'system') {
      // Detect system preference
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.classList.add(isDark ? 'dark' : 'light');

      // Listen for system theme changes
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = (e: MediaQueryListEvent) => {
        root.classList.remove('light', 'dark');
        root.classList.add(e.matches ? 'dark' : 'light');
      };

      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } else {
      // Apply explicit theme
      root.classList.add(theme);
    }
  }, [theme]);

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
