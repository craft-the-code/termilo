import { useState } from 'react';
import Navigation from './components/Navigation';
import SettingsPanel from './components/SettingsPanel';
import TerminalView from './components/terminal/TerminalView';
import TodoView from './components/todo/TodoView';
import AutomationView from './components/automation/AutomationView';
import InfoView from './components/info/InfoView';
import './App.css';

type ActiveView = 'ssh' | 'todo' | 'automation' | 'info';

function App() {
    const [showSettings, setShowSettings] = useState(false);
    const [activeView, setActiveView] = useState<ActiveView>('ssh');

    const renderMainContent = () => {
        switch (activeView) {
            case 'ssh':
                return <TerminalView />;
            case 'todo':
                return <TodoView />;
            case 'automation':
                return <AutomationView />;
            case 'info':
                return <InfoView />;
            default:
                return null;
        }
    };

    return (
        <div className="h-screen flex bg-termilo-terminal">
            {/* Navigation */}
            <div className="w-16 bg-termilo-sidebar border-r border-termilo-border">
                <Navigation activeView={activeView} onViewChange={setActiveView} />
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col bg-slate-100 relative">
                {renderMainContent()}

                {/* Settings Button */}
                <button
                    onClick={() => setShowSettings(!showSettings)}
                    className="absolute top-4 right-4 p-2 bg-termilo-sidebar text-termilo-secondary hover:text-termilo-primary border border-termilo-border rounded-lg transition-colors duration-200 z-10"
                    title="Settings"
                >
                    ⚙️
                </button>

                {/* Settings Panel */}
                {showSettings && (
                    <SettingsPanel onClose={() => setShowSettings(false)} />
                )}
            </div>
        </div>
    );
}

export default App;