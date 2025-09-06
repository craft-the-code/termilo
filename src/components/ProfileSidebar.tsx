import { useStore } from '../store/useStore';

interface ProfileSidebarProps {
    onAddProfile: () => void;
}

export default function ProfileSidebar({ onAddProfile }: ProfileSidebarProps) {
    const { profiles, createSession } = useStore();

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="p-4 border-b border-gray-700">
                <h2 className="text-lg font-semibold">Servers</h2>
                <button
                    onClick={onAddProfile}
                    className="mt-2 w-full bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm"
                >
                    Add Server
                </button>
            </div>

            {/* Server List */}
            <div className="flex-1 overflow-y-auto">
                {profiles.length === 0 ? (
                    <div className="p-4 text-gray-400 text-sm">
                        No servers configured
                    </div>
                ) : (
                    profiles.map((profile) => (
                        <div
                            key={profile.id}
                            className="p-3 border-b border-gray-700 hover:bg-gray-800 cursor-pointer"
                            onClick={() => createSession(profile.id)}
                        >
                            <div className="font-medium">{profile.name}</div>
                            <div className="text-sm text-gray-400">
                                {profile.username}@{profile.host}:{profile.port}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                                Auth: {profile.authMethod}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}