import { useTheme } from '../hooks/useTheme';

interface SettingsPanelProps {
    onClose: () => void;
}

export default function SettingsPanel({ onClose }: SettingsPanelProps) {
    const { currentTheme, changeTheme, availableThemes } = useTheme();

    const handleThemeChange = (theme: string) => {
        changeTheme(theme as any);
        // Auto-save on click - no need for explicit save button
    };

    return (
        <div className="absolute top-16 right-4 w-80 bg-white border border-termilo-border rounded-lg shadow-lg z-20">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-termilo-border">
                <h3 className="text-lg font-semibold text-termilo-dark">Settings</h3>
                <button
                    onClick={onClose}
                    className="text-termilo-muted hover:text-termilo-dark transition-colors"
                >
                    ✕
                </button>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4">
                {/* Theme Selection */}
                <div>
                    <label className="block text-sm font-medium text-termilo-dark mb-2">
                        Theme
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                        {availableThemes.map((theme) => (
                            <button
                                key={theme.value}
                                onClick={() => handleThemeChange(theme.value)}
                                className={`
                                    p-3 rounded-lg border text-sm font-medium transition-all duration-200
                                    ${currentTheme === theme.value
                                    ? 'bg-termilo-primary text-white border-termilo-primary'
                                    : 'bg-termilo-card text-termilo-dark border-termilo-border hover:border-termilo-primary hover:bg-slate-50'
                                }
                                `}
                            >
                                {theme.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Future Settings Placeholder */}
                <div className="pt-2 border-t border-termilo-border">
                    <div className="text-sm text-termilo-muted">
                        More settings coming soon...
                    </div>
                </div>
            </div>
        </div>
    );
}