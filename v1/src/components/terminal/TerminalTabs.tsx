import { useStore } from '../../store/useStore';

export default function TerminalTabs() {
    const { sessions, activeSessionId, setActiveSession, closeSession } = useStore();

    if (sessions.length === 0) {
        return (
            <div className="p-2 text-termilo-muted text-sm">
                No active sessions
            </div>
        );
    }

    return (
        <div className="flex">
            {sessions.map((session) => (
                <div
                    key={session.id}
                    className={`
                        flex items-center px-4 py-2 border-r border-slate-300 cursor-pointer
                        ${activeSessionId === session.id
                        ? 'bg-white border-b-2 border-termilo-primary'
                        : 'bg-slate-50 hover:bg-slate-100'
                    }
                    `}
                    onClick={() => setActiveSession(session.id)}
                >
                    {/* Connection Status */}
                    <div className={`
                        w-2 h-2 rounded-full mr-2
                        ${session.isConnecting
                        ? 'bg-termilo-connecting'
                        : session.isConnected
                            ? 'bg-termilo-success'
                            : 'bg-termilo-error'
                    }
                    `} />

                    {/* Session Name */}
                    <span className="text-sm font-medium mr-2 text-termilo-dark">
                        {session.profileName}
                    </span>

                    {/* Close Button */}
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            closeSession(session.id);
                        }}
                        className="ml-1 text-termilo-muted hover:text-termilo-dark text-lg leading-none"
                    >
                        ×
                    </button>
                </div>
            ))}
        </div>
    );
}