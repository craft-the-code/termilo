import { useStore } from '../store/useStore';

export default function TerminalTabs() {
    const { sessions, activeSessionId, setActiveSession, closeSession } = useStore();

    if (sessions.length === 0) {
        return (
            <div className="p-2 text-gray-500 text-sm">
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
            flex items-center px-4 py-2 border-r border-gray-300 cursor-pointer
            ${activeSessionId === session.id
                        ? 'bg-white border-b-2 border-blue-500'
                        : 'bg-gray-50 hover:bg-gray-100'
                    }
          `}
                    onClick={() => setActiveSession(session.id)}
                >
                    {/* Connection Status */}
                    <div className={`
            w-2 h-2 rounded-full mr-2
            ${session.isConnecting
                        ? 'bg-yellow-500'
                        : session.isConnected
                            ? 'bg-green-500'
                            : 'bg-red-500'
                    }
          `} />

                    {/* Session Name */}
                    <span className="text-sm font-medium mr-2">
            {session.profileName}
          </span>

                    {/* Close Button */}
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            closeSession(session.id);
                        }}
                        className="ml-1 text-gray-500 hover:text-gray-700 text-lg leading-none"
                    >
                        ×
                    </button>
                </div>
            ))}
        </div>
    );
}