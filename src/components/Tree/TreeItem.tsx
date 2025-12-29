import { Profile } from "@/store/profileStore";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";

interface TreeItemProps {
    profile: Profile;
    isActive?: boolean;
    onClick?: () => void;
    level?: number;
    onMove?: (profile: Profile) => void;
    onDelete?: (profile: Profile) => void;
}

export function TreeItem({ profile, isActive, onClick, level = 0, onMove, onDelete }: TreeItemProps) {
    return (
        <div className="relative group/item">
            <Button
                variant="ghost"
                onClick={onClick}
                className={cn(
                    "w-full justify-start h-8 px-2 text-sm font-normal text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/50 pr-8",
                    isActive && "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                )}
                style={{ paddingLeft: `${(level * 12) + 8}px` }}
            >
                <span className="material-symbols-outlined text-[16px] mr-2 opacity-70">
                    {profile.type === 'aws' ? 'cloud_queue' :
                        profile.type === 'vps' ? 'dns' :
                            profile.type === 'iot' ? 'router' :
                                'terminal'}
                </span>
                <span className="truncate">{profile.name}</span>
                {profile.status === 'live' && (
                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-green-500" title="Active"></span>
                )}
            </Button>

            <div className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover/item:opacity-100 transition-opacity">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-6 w-6 p-0 hover:bg-sidebar-accent">
                            <span className="material-symbols-outlined text-[14px]">more_horiz</span>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onClick?.(); }}>
                            <span className="material-symbols-outlined text-[16px] mr-2">bolt</span>
                            Connect
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onMove?.(profile); }}>
                            <span className="material-symbols-outlined text-[16px] mr-2">drive_file_move</span>
                            Move...
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            className="text-red-500 focus:text-red-500"
                            onClick={(e) => { e.stopPropagation(); onDelete?.(profile); }}
                        >
                            <span className="material-symbols-outlined text-[16px] mr-2">delete</span>
                            Delete
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    );
}
