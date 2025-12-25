import { Terminal, ClipboardList, Settings, Info } from 'lucide-react';

interface NavigationProps {
    activeView: 'ssh' | 'todo' | 'automation' | 'info';
    onViewChange: (view: 'ssh' | 'todo' | 'automation' | 'info') => void;
}

export default function Navigation({ activeView, onViewChange }: NavigationProps) {
    const navItems = [
        {
            id: 'ssh' as const,
            icon: <Terminal className="w-7 h-7" />,
            title: 'SSH Sessions',
        },
        {
            id: 'todo' as const,
            icon: <ClipboardList className="w-7 h-7" />,
            title: 'Todo Notes',
        },
        {
            id: 'automation' as const,
            icon: <Settings className="w-7 h-7" />,
            title: 'Automation Scripts',
        },
    ];

    return (
        <div className="flex flex-col h-full py-4">
            {/* Logo/Brand area */}
            <div className="px-2 mb-6">
                <div className="w-12 h-12 bg-termilo-primary rounded-lg flex items-center justify-center text-white font-bold text-lg border border-termilo-border">
                    T
                </div>
            </div>

            {/* Navigation Items */}
            <div className="flex-1 px-2">
                {navItems.map((item) => (
                    <div
                        key={item.id}
                        onClick={() => onViewChange(item.id)}
                        className={`
                            w-12 h-12 mb-3 rounded-lg cursor-pointer
                            flex items-center justify-center relative group
                            ${activeView === item.id
                            ? 'text-white bg-termilo-primary/20 border border-termilo-primary'
                            : 'text-termilo-secondary border border-termilo-border hover:text-termilo-primary hover:bg-termilo-border/50'
                        }
                        `}
                        title={item.title}
                    >
                        {item.icon}

                        {/* Active indicator */}
                        {activeView === item.id && (
                            <div className="absolute -right-1 top-1/2 -translate-y-1/2 w-1 h-6 bg-termilo-primary rounded-full" />
                        )}

                        {/* Tooltip */}
                        <div className="absolute left-16 bg-termilo-sidebar text-termilo-primary px-2 py-1 rounded text-sm
                                      opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none
                                      whitespace-nowrap z-50 border border-termilo-border">
                            {item.title}
                        </div>
                    </div>
                ))}
            </div>

            {/* Info Button at Bottom */}
            <div className="px-2 mt-auto">
                <div
                    onClick={() => onViewChange('info')}
                    className={`
                        w-12 h-12 rounded-lg cursor-pointer
                        flex items-center justify-center relative group
                        ${activeView === 'info'
                        ? 'text-white bg-termilo-primary/20 border border-termilo-primary'
                        : 'text-termilo-secondary border border-termilo-border hover:text-termilo-primary hover:bg-termilo-border/50'
                    }
                    `}
                    title="App Info"
                >
                    <Info className="w-6 h-6" />

                    {/* Active indicator */}
                    {activeView === 'info' && (
                        <div className="absolute -right-1 top-1/2 -translate-y-1/2 w-1 h-6 bg-termilo-primary rounded-full" />
                    )}

                    {/* Tooltip */}
                    <div className="absolute left-16 bg-termilo-sidebar text-termilo-primary px-2 py-1 rounded text-sm
                                  opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none
                                  whitespace-nowrap z-50 border border-termilo-border">
                        App Info
                    </div>
                </div>
            </div>
        </div>
    );
}