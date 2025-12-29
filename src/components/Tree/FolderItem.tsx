import { useState } from "react";
import { Group, Profile } from "@/store/profileStore";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { TreeItem } from "./TreeItem";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";

interface FolderItemProps {
    group: Group;
    allGroups: Group[];
    allProfiles: Profile[];
    level?: number;
    activeProfileId?: string;
    onProfileClick?: (profile: Profile) => void;
    onDeleteGroup?: (group: Group) => void;
    onMoveProfile?: (profile: Profile) => void;
    onDeleteProfile?: (profile: Profile) => void;
}

export function FolderItem({
    group,
    allGroups,
    allProfiles,
    level = 0,
    activeProfileId,
    onProfileClick,
    onDeleteGroup,
    onMoveProfile,
    onDeleteProfile
}: FolderItemProps) {
    const [isOpen, setIsOpen] = useState(false);

    // Get children
    const childGroups = allGroups.filter(g => g.parentId === group.id);
    const childProfiles = allProfiles.filter(p => p.groupId === group.id);

    return (
        <div className="flex flex-col select-none">
            <div className="relative group/folder">
                <Button
                    variant="ghost"
                    onClick={() => setIsOpen(!isOpen)}
                    className={cn(
                        "w-full justify-start h-8 px-2 text-sm font-medium text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-sidebar-accent/30 pr-8",
                    )}
                    style={{ paddingLeft: `${(level * 12) + 8}px` }}
                >
                    <span className={cn(
                        "material-symbols-outlined text-[18px] mr-1.5 transition-transform duration-200",
                        isOpen ? "rotate-90" : ""
                    )}>
                        chevron_right
                    </span>
                    <span className="material-symbols-outlined text-[18px] mr-2 text-blue-400">
                        {isOpen ? 'folder_open' : 'folder'}
                    </span>
                    <span className="truncate">{group.name}</span>
                    <span className="ml-auto text-[10px] text-muted-foreground opacity-70">
                        {childGroups.length + childProfiles.length}
                    </span>
                </Button>

                <div className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover/folder:opacity-100 transition-opacity">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-6 w-6 p-0 hover:bg-sidebar-accent">
                                <span className="material-symbols-outlined text-[14px]">more_horiz</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                            {/* <DropdownMenuItem>
                                <span className="material-symbols-outlined text-[16px] mr-2">edit</span>
                                Rename
                            </DropdownMenuItem> */}
                            <DropdownMenuItem
                                className="text-red-500 focus:text-red-500"
                                onClick={(e) => { e.stopPropagation(); onDeleteGroup?.(group); }}
                            >
                                <span className="material-symbols-outlined text-[16px] mr-2">delete</span>
                                Delete Folder
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {isOpen && (
                <div className="flex flex-col">
                    {childGroups.map(subGroup => (
                        <FolderItem
                            key={subGroup.id}
                            group={subGroup}
                            allGroups={allGroups}
                            allProfiles={allProfiles}
                            level={level + 1}
                            activeProfileId={activeProfileId}
                            onProfileClick={onProfileClick}
                            onDeleteGroup={onDeleteGroup}
                            onMoveProfile={onMoveProfile}
                            onDeleteProfile={onDeleteProfile}
                        />
                    ))}
                    {childProfiles.map(profile => (
                        <TreeItem
                            key={profile.id}
                            profile={profile}
                            isActive={activeProfileId === profile.id}
                            onClick={() => onProfileClick?.(profile)}
                            level={level + 1}
                            onMove={onMoveProfile}
                            onDelete={onDeleteProfile}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
