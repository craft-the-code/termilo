import { useEffect } from 'react';
import { MainLayout } from '@/layouts/MainLayout';
import { ConnectionsDashboard } from '@/pages/ConnectionsDashboard';
import { TerminalPage } from '@/pages/TerminalPage';
import { useSessionStore } from '@/store/sessionStore';
import "./App.css";

function App() {
  const { activeSessionId } = useSessionStore();

  useEffect(() => {
    // Optional: Prevent default browser shortcuts like Ctrl+F
  }, []);

  return (
    <div className="h-screen w-screen overflow-hidden bg-background text-foreground">
      {activeSessionId ? (
        <TerminalPage />
      ) : (
        <MainLayout>
          <ConnectionsDashboard />
        </MainLayout>
      )}
    </div>
  );
}

export default App;
