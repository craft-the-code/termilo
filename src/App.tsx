import { useState } from 'react';
import { useStore } from './store/useStore';
import ProfileSidebar from './components/ProfileSidebar';
import TerminalTabs from './components/TerminalTabs';
import TerminalView from './components/TerminalView';
import AddProfileModal from './components/AddProfileModal';
import './App.css';

function App() {
    const [showAddProfile, setShowAddProfile] = useState(false);
    const { sessions, activeSessionId } = useStore();

    return (
        <div className="h-screen flex">
            {/* Sidebar */}
            <div className="w-64 bg-gray-900 text-white">
                <ProfileSidebar onAddProfile={() => setShowAddProfile(true)} />
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col">
                {/* Tabs */}
                <div className="bg-gray-100 border-b">
                    <TerminalTabs />
                </div>

                {/* Terminal Area */}
                <div className="flex-1">
                    {activeSessionId && activeSessionId.trim() ? (
                        <TerminalView sessionId={activeSessionId} />
                    ) : (
                        <div className="h-full flex items-center justify-center text-gray-500">
                            Select a server to connect
                        </div>
                    )}
                </div>
            </div>

            {/* Add Profile Modal */}
            {showAddProfile && (
                <AddProfileModal onClose={() => setShowAddProfile(false)} />
            )}
        </div>
    );
}

export default App;