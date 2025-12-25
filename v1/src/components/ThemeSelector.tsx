import { useTheme } from '../hooks/useTheme';

export default function ThemeSelector() {
    const { currentTheme, changeTheme, availableThemes } = useTheme();

    return (
        <div className="flex items-center gap-2">
            <span className="text-termilo-secondary text-sm">Theme:</span>
            <select
                value={currentTheme}
                onChange={(e) => changeTheme(e.target.value as any)}
                className="bg-termilo-sidebar text-termilo-primary border border-termilo-border rounded px-2 py-1 text-sm"
            >
                {availableThemes.map((theme) => (
                    <option key={theme.value} value={theme.value}>
                        {theme.label}
                    </option>
                ))}
            </select>
        </div>
    );
}