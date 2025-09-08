import { useStore } from '../../store/useStore';

interface ProfileSidebarProps {
    onAddProfile: () => void;
}

export default function ProfileSidebar({ onAddProfile }: ProfileSidebarProps) {
    const { profiles, createSession } = useStore();

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="p-4 border-b border-termilo-border">
                <h2 className="text-lg font-semibold text-termilo-primary">Servers</h2>
                <button
                    onClick={onAddProfile}
                    className="mt-2 w-full bg-termilo-primary hover:bg-termilo-primary text-white px-3 py-1 rounded text-sm transition-colors duration-200"
                >
                    Add Server
                </button>
            </div>

            {/* Server List */}
            <div className="flex-1 overflow-y-auto terminal-scrollbar">
                {profiles.length === 0 ? (
                    <div className="p-4 text-termilo-secondary text-sm">
                        No servers configured
                    </div>
                ) : (
                    profiles.map((profile) => (
                        <div
                            key={profile.id}
                            className="p-3 border-b border-termilo-border hover:bg-termilo-border cursor-pointer transition-colors duration-200"
                            onClick={() => createSession(profile.id)}
                        >
                            <div className="font-medium text-termilo-primary">{profile.name}</div>
                            <div className="text-sm text-termilo-secondary">
                                {profile.username}@{profile.host}:{profile.port}
                            </div>
                            <div className="text-xs text-termilo-muted mt-1">
                                Auth: {profile.authMethod}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}