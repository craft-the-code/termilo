import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useSessionStore } from '@/store/sessionStore';
import { QuickConnectModal } from '@/components/Modals/QuickConnectModal';
import { SettingsModal } from '@/components/Modals/SettingsModal';
import { TreeView } from '@/components/Tree/TreeView';
import { NewGroupModal } from '@/components/Modals/NewGroupModal';
import { MoveToGroupModal } from '@/components/Modals/MoveToGroupModal';
import { ScriptManagerModal } from '@/components/Modals/ScriptManagerModal';
import { useProfileStore } from '@/store/profileStore';

export function Sidebar() {
    const [collapsed, setCollapsed] = useState(false);
    const [showQuickConnect, setShowQuickConnect] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [showNewGroup, setShowNewGroup] = useState(false);
    const [showScriptManager, setShowScriptManager] = useState(false);
    const [moveProfileId, setMoveProfileId] = useState<string | null>(null);
    const { setView, currentView, sessions } = useSessionStore();
    const { deleteGroup, deleteProfile } = useProfileStore(); // Need to import useProfileStore

    return (
        <div
            className={cn(
                "flex flex-col h-full bg-sidebar border-r border-sidebar-border transition-all duration-300",
                collapsed ? "w-[72px]" : "w-[280px]"
            )}
        >
            {/* Header / Logo */}
            <div className="h-14 flex items-center px-4 border-b border-sidebar-border">
                <div className="flex items-center gap-3 overflow-hidden">
                    <div className="flex-shrink-0 w-8 h-8 bg-primary/20 rounded-lg flex items-center justify-center text-primary">
                        <span className="material-symbols-outlined text-xl">terminal</span>
                    </div>
                    {!collapsed && (
                        <span className="font-bold text-sidebar-foreground truncate">Termilo</span>
                    )}
                </div>
            </div>

            {/* Quick Actions */}
            <div className="p-4 pb-0">
                <Button
                    className={cn(
                        "w-full gap-2 shadow-lg shadow-primary/10",
                        collapsed ? "px-0 justify-center" : ""
                    )}
                    onClick={() => setShowQuickConnect(true)}
                    title="Quick Connect"
                >
                    <span className="material-symbols-outlined text-[20px]">bolt</span>
                    {!collapsed && "Quick Connect"}
                </Button>
            </div>

            {/* Navigation */}
            <div className="flex-1 py-4 flex flex-col gap-1 px-2 overflow-y-auto">
                <NavItem
                    icon="grid_view"
                    label="Dashboard"
                    active={currentView === 'dashboard'}
                    collapsed={collapsed}
                    onClick={() => setView('dashboard')}
                />

                {sessions.length > 0 && (
                    <NavItem
                        icon="terminal"
                        label="Active Terminal"
                        active={currentView === 'terminal'}
                        collapsed={collapsed}
                        onClick={() => setView('terminal')}
                    />
                )}

                <Separator className="my-2 bg-sidebar-border" />

                {!collapsed ? (
                    <div className="flex-1 overflow-y-auto px-1">
                        <div className="px-2 mb-2 text-xs font-medium text-muted-foreground uppercase flex items-center justify-between group/header">
                            <span>Connections</span>
                            <div className="flex gap-1 opacity-0 group-hover/header:opacity-100 transition-opacity">
                                <span
                                    className="material-symbols-outlined text-[16px] cursor-pointer hover:text-foreground"
                                    title="New Folder"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setShowNewGroup(true);
                                    }}
                                >
                                    create_new_folder
                                </span>
                                <span className="material-symbols-outlined text-[16px] cursor-pointer hover:text-foreground" title="New Connection">add</span>
                            </div>
                        </div>
                        <TreeView
                            onProfileSelect={() => {
                                setView('dashboard');
                            }}
                            onDeleteGroup={(group) => {
                                if (confirm(`Are you sure you want to delete folder "${group.name}"? Contents will be moved to root.`)) {
                                    deleteGroup(group.id);
                                }
                            }}
                            onMoveProfile={(profile) => {
                                setMoveProfileId(profile.id);
                            }}
                            onDeleteProfile={(profile) => {
                                if (confirm(`Are you sure you want to delete connection "${profile.name}"?`)) {
                                    deleteProfile(profile.id);
                                }
                            }}
                        />
                    </div>
                ) : (
                    <NavItem icon="dns" label="Connections" collapsed={collapsed} onClick={() => setView('dashboard')} />
                )}

                <Separator className="my-2 bg-sidebar-border" />

                <div className={cn("px-2 mb-2 text-xs font-medium text-muted-foreground uppercase", collapsed && "hidden")}>
                    Settings
                </div>
                <NavItem
                    icon="settings"
                    label="Preferences"
                    collapsed={collapsed}
                    onClick={() => setShowSettings(true)}
                />
                <NavItem
                    icon="terminal"
                    label="Scripts"
                    collapsed={collapsed}
                    onClick={() => setShowScriptManager(true)}
                />
                <NavItem icon="key" label="Keybindings" collapsed={collapsed} />
            </div>

            {/* Footer / User */}
            <div className="p-2 border-t border-sidebar-border">
                <Button
                    variant="ghost"
                    size="icon"
                    className="w-full justify-start hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    onClick={() => setCollapsed(!collapsed)}
                >
                    <span className="material-symbols-outlined">
                        {collapsed ? 'chevron_right' : 'chevron_left'}
                    </span>
                    {!collapsed && <span className="ml-2">Collapse</span>}
                </Button>
            </div>

            <QuickConnectModal open={showQuickConnect} onOpenChange={setShowQuickConnect} />
            <SettingsModal open={showSettings} onOpenChange={setShowSettings} />
            <NewGroupModal open={showNewGroup} onOpenChange={setShowNewGroup} />
            <MoveToGroupModal
                open={!!moveProfileId}
                onOpenChange={(open) => !open && setMoveProfileId(null)}
                profileId={moveProfileId}
            />
            <ScriptManagerModal open={showScriptManager} onOpenChange={setShowScriptManager} />
        </div>
    );
}

interface NavItemProps {
    icon: string;
    label: string;
    active?: boolean;
    collapsed?: boolean;
    onClick?: () => void;
}

function NavItem({ icon, label, active, collapsed, onClick }: NavItemProps) {
    return (
        <Button
            variant={active ? "secondary" : "ghost"}
            onClick={onClick}
            className={cn(
                "w-full justify-start relative group",
                active ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium" : "text-muted-foreground hover:text-sidebar-foreground",
                collapsed ? "px-0 justify-center" : "px-4"
            )}
            title={collapsed ? label : undefined}
        >
            <span className={cn("material-symbols-outlined text-[20px]", active && "fill-1")}>
                {icon}
            </span>
            {!collapsed && (
                <span className="ml-3 truncate">{label}</span>
            )}
        </Button>
    );
}
