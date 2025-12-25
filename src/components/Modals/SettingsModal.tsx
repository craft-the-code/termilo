import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useUIStore } from '@/store/uiStore';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface SettingsModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

type Tab = 'general' | 'appearance' | 'keybindings';

export function SettingsModal({ open, onOpenChange }: SettingsModalProps) {
    const [activeTab, setActiveTab] = useState<Tab>('appearance');
    const {
        theme, setTheme,
        fontSize, setFontSize,
        fontFamily, setFontFamily,
        lineHeight, setLineHeight
    } = useUIStore();

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-[1000px] h-[700px] bg-background p-0 overflow-hidden gap-0 flex border-border">
                {/* Sidebar */}
                <aside className="w-64 flex-shrink-0 bg-secondary/30 border-r border-border pt-6 pb-4 flex flex-col justify-between">
                    <div className="px-3">
                        <div className="px-3 mb-6">
                            <h1 className="font-bold text-lg">Settings</h1>
                            <p className="text-xs text-muted-foreground mt-1">v1.0.0</p>
                        </div>
                        <nav className="space-y-1">
                            <SettingsTab
                                icon="settings"
                                label="General"
                                active={activeTab === 'general'}
                                onClick={() => setActiveTab('general')}
                            />
                            <SettingsTab
                                icon="palette"
                                label="Appearance"
                                active={activeTab === 'appearance'}
                                onClick={() => setActiveTab('appearance')}
                            />
                            <SettingsTab
                                icon="keyboard"
                                label="Keybindings"
                                active={activeTab === 'keybindings'}
                                onClick={() => setActiveTab('keybindings')}
                            />
                        </nav>
                    </div>
                </aside>

                {/* Main Content */}
                <main className="flex-1 overflow-y-auto bg-background p-10">
                    {activeTab === 'appearance' && (
                        <div className="max-w-3xl space-y-10">
                            <div>
                                <h2 className="text-2xl font-bold mb-2">Appearance</h2>
                                <p className="text-muted-foreground">Customize the visual style of your terminal.</p>
                            </div>

                            {/* Theme */}
                            <section className="space-y-6">
                                <h3 className="font-semibold text-lg">Interface Theme</h3>
                                <div className="grid grid-cols-3 gap-6">
                                    <ThemeOption
                                        label="System"
                                        icon="desktop_windows"
                                        active={theme === 'system'}
                                        onClick={() => setTheme('system')}
                                    />
                                    <ThemeOption
                                        label="Light"
                                        icon="light_mode"
                                        active={theme === 'light'}
                                        onClick={() => setTheme('light')}
                                    />
                                    <ThemeOption
                                        label="Dark"
                                        icon="dark_mode"
                                        active={theme === 'dark'}
                                        onClick={() => setTheme('dark')}
                                    />
                                </div>
                            </section>

                            <div className="h-px bg-border" />

                            {/* Typography */}
                            <section className="space-y-8">
                                <h3 className="font-semibold text-lg">Typography</h3>

                                <div className="space-y-3">
                                    <label className="text-sm font-medium">Font Family</label>
                                    <select
                                        className="w-full h-11 rounded-lg border border-input bg-card px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                        value={fontFamily}
                                        onChange={(e) => setFontFamily(e.target.value)}
                                    >
                                        <option value="JetBrains Mono">JetBrains Mono</option>
                                        <option value="Fira Code">Fira Code</option>
                                        <option value="Source Code Pro">Source Code Pro</option>
                                        <option value="monospace">System Monospace</option>
                                    </select>
                                    <p className="text-xs text-muted-foreground">
                                        Note: Only fonts installed on your system will work correctly.
                                    </p>
                                </div>

                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <div className="flex justify-between">
                                            <label className="text-sm font-medium">Font Size</label>
                                            <span className="text-xs font-mono bg-secondary px-2 py-1 rounded">{fontSize}px</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="10"
                                            max="24"
                                            step="1"
                                            value={fontSize}
                                            onChange={(e) => setFontSize(parseInt(e.target.value))}
                                            className="w-full accent-primary"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex justify-between">
                                            <label className="text-sm font-medium">Line Height</label>
                                            <span className="text-xs font-mono bg-secondary px-2 py-1 rounded">{lineHeight}</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="1"
                                            max="2.5"
                                            step="0.1"
                                            value={lineHeight}
                                            onChange={(e) => setLineHeight(parseFloat(e.target.value))}
                                            className="w-full accent-primary"
                                        />
                                    </div>
                                </div>
                            </section>
                        </div>
                    )}

                    {activeTab !== 'appearance' && (
                        <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                            <span className="material-symbols-outlined text-4xl mb-4">construction</span>
                            <p>This section is coming soon.</p>
                        </div>
                    )}
                </main>
            </DialogContent>
        </Dialog>
    );
}

function SettingsTab({ icon, label, active, onClick }: { icon: string, label: string, active: boolean, onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
            )}
        >
            <span className={cn("material-symbols-outlined text-[20px]", active && "fill-1")}>{icon}</span>
            {label}
        </button>
    );
}

function ThemeOption({ icon, label, active, onClick }: { icon: string, label: string, active: boolean, onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all",
                active
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-border bg-card hover:bg-secondary/50 hover:border-muted-foreground/50"
            )}
        >
            <span className="material-symbols-outlined text-2xl">{icon}</span>
            <span className="text-sm font-medium">{label}</span>
        </button>
    );
}
