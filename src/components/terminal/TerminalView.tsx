import { useState } from 'react';
import { useStore } from '../../store/useStore';
import ProfileSidebar from './ProfileSidebar';
import TerminalTabs from './TerminalTabs';
import TerminalPanel from './TerminalPanel';
import AddProfileModal from './AddProfileModal';

export default function TerminalView() {
    const [showAddProfile, setShowAddProfile] = useState(false);
    const { activeSessionId } = useStore();

    return (
        <>
            {/* Sidebar */}
            <div className="flex h-full">
                <div className="w-64 bg-termilo-sidebar text-termilo-primary border-r border-termilo-border">
                    <ProfileSidebar onAddProfile={() => setShowAddProfile(true)} />
                </div>

                {/* Main Terminal Area */}
                <div className="flex-1 flex flex-col">
                    {/* Tabs */}
                    <div className="bg-white border-b border-slate-200">
                        <TerminalTabs />
                    </div>

                    {/* Terminal Content */}
                    <div className="flex-1">
                        {activeSessionId && activeSessionId.trim() ? (
                            <TerminalPanel sessionId={activeSessionId} />
                        ) : (
                            <div className="h-full flex items-center justify-center text-termilo-muted bg-termilo-terminal">
                                <div className="text-center">
                                    <div className="text-6xl mb-4">🖥️</div>
                                    <div className="text-xl font-medium text-termilo-primary">Select a server to connect</div>
                                    <div className="text-sm text-termilo-secondary mt-2">Choose a profile from the sidebar to start a new session</div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Add Profile Modal */}
            {showAddProfile && (
                <AddProfileModal onClose={() => setShowAddProfile(false)} />
            )}
        </>
    );
}