interface NavigationProps {
    activeView: 'ssh' | 'todo' | 'automation' | 'info';
    onViewChange: (view: 'ssh' | 'todo' | 'automation' | 'info') => void;
}

export default function Navigation({ activeView, onViewChange }: NavigationProps) {
    const navItems = [
        {
            id: 'ssh' as const,
            icon: '🖥️',
            title: 'SSH Sessions',
        },
        {
            id: 'todo' as const,
            icon: '📝',
            title: 'Todo Notes',
        },
        {
            id: 'automation' as const,
            icon: '⚙️',
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
            <div className="flex-1">
                {navItems.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => onViewChange(item.id)}
                        className={`
                            w-12 h-12 mx-2 mb-3 rounded-lg flex items-center justify-center text-2xl
                            transition-all duration-200 relative group border
                            ${activeView === item.id
                            ? 'text-white border-termilo-primary transform scale-105'
                            : 'text-termilo-secondary hover:bg-termilo-border hover:text-termilo-primary hover:scale-105 border-termilo-border'
                        }
                        `}
                        title={item.title}
                    >
                        {item.icon}

                        {/* Active indicator */}
                        {activeView === item.id && (
                            <div className="absolute -right-1 top-1/2 transform -translate-y-1/2 w-1 h-6 bg-termilo-primary rounded-full" />
                        )}

                        {/* Tooltip */}
                        <div className="absolute left-16 bg-termilo-sidebar text-termilo-primary px-2 py-1 rounded text-sm
                                      opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none
                                      whitespace-nowrap z-50 border border-termilo-border">
                            {item.title}
                        </div>
                    </button>
                ))}
            </div>

            {/* Info Button at Bottom */}
            <div className="px-2 mt-auto">
                <button
                    onClick={() => onViewChange('info')}
                    className={`
                        w-12 h-12 rounded-lg flex items-center justify-center text-xl
                        transition-all duration-200 relative group border
                        ${activeView === 'info'
                        ? 'text-white border-termilo-primary transform scale-105'
                        : 'text-termilo-secondary hover:bg-termilo-border hover:text-termilo-primary hover:scale-105 border-termilo-border'
                    }
                    `}
                    title="App Info"
                >
                    ℹ️

                    {/* Active indicator */}
                    {activeView === 'info' && (
                        <div className="absolute -right-1 top-1/2 transform -translate-y-1/2 w-1 h-6 bg-termilo-primary rounded-full" />
                    )}

                    {/* Tooltip */}
                    <div className="absolute left-16 bg-termilo-sidebar text-termilo-primary px-2 py-1 rounded text-sm
                                  opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none
                                  whitespace-nowrap z-50 border border-termilo-border">
                        App Info
                    </div>
                </button>
            </div>
        </div>
    );
}