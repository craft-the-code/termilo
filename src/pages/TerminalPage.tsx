import { useRef, useEffect } from 'react';
import { useSessionStore } from '@/store/sessionStore';
import { Terminal } from '@/components/Terminal/Terminal';
import { Button } from '@/components/ui/button';
import { useProfileStore } from '@/store/profileStore';

export function TerminalPage() {
    const { activeSessionId, sessions, setActiveSession, removeSession } = useSessionStore();
    const { getProfile } = useProfileStore();

    // If no active session, we shouldn't be here ideally, but handle gracefully
    if (!activeSessionId) return <div className="p-10 text-center">No active session</div>;

    const activeSession = sessions.find(s => s.id === activeSessionId);
    if (!activeSession) return <div className="p-10 text-center">Session not found</div>;

    const profile = getProfile(activeSession.profileId);

    // Switch tabs
    const handleTabClick = (id: string) => {
        setActiveSession(id);
    };

    const handleCloseTab = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        removeSession(id);
    };

    return (
        <div className="flex flex-col h-screen w-full bg-[#0f111a] overflow-hidden">
            {/* Tab Bar */}
            <div className="flex items-center h-10 bg-[#1e293b] border-b border-[#334155] px-2 gap-1 overflow-x-auto">
                {sessions.map(session => (
                    <div
                        key={session.id}
                        onClick={() => handleTabClick(session.id)}
                        className={`
                            group flex items-center gap-2 px-3 h-8 rounded-t-md text-sm font-medium cursor-pointer transition-colors min-w-[150px] max-w-[200px] select-none
                            ${session.id === activeSessionId
                                ? 'bg-[#0f111a] text-blue-400 border-t-2 border-blue-500'
                                : 'bg-transparent text-slate-400 hover:bg-[#334155/54] hover:text-slate-200'}
                        `}
                    >
                        <span className="material-symbols-outlined text-[16px]">terminal</span>
                        <span className="truncate flex-1">{session.title}</span>
                        <button
                            onClick={(e) => handleCloseTab(e, session.id)}
                            className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-slate-700 rounded-full transition-all"
                        >
                            <span className="material-symbols-outlined text-[14px]">close</span>
                        </button>
                    </div>
                ))}
            </div>

            {/* Terminal View area */}
            <div className="flex-1 relative">
                {/* We render ALL terminals but hide inactive ones to preserve state/buffer */}
                {sessions.map(session => (
                    <div
                        key={session.id}
                        className={`absolute inset-0 z-0 ${session.id === activeSessionId ? 'visible z-10' : 'invisible'}`}
                    >
                        <Terminal
                            sessionId={session.id}
                        />
                    </div>
                ))}
            </div>

            {/* Status Bar */}
            <div className="h-6 bg-[#0f172a] border-t border-[#1e293b] flex items-center px-4 text-xs text-slate-500 justify-between">
                <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1">
                        <span className={`w-2 h-2 rounded-full ${activeSession.status === 'connected' ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
                        {activeSession.status === 'connected' ? 'Connected' : 'Connecting...'}
                    </span>
                    <span>SSH: {profile?.username}@{profile?.host}</span>
                </div>
                <div>
                    UTF-8
                </div>
            </div>
        </div>
    );
}
