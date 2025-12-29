import { useProfileStore, Profile, Group } from "@/store/profileStore";
import { FolderItem } from "./FolderItem";
import { TreeItem } from "./TreeItem";

interface TreeViewProps {
    onProfileSelect?: (profile: Profile) => void;

    // Actions
    onDeleteGroup?: (group: Group) => void;
    onMoveProfile?: (profile: Profile) => void;
    onDeleteProfile?: (profile: Profile) => void;

    activeProfileId?: string;
    className?: string;
}

export function TreeView({
    onProfileSelect,
    onDeleteGroup,
    onMoveProfile,
    onDeleteProfile,
    activeProfileId,
    className
}: TreeViewProps) {
    const { groups, profiles } = useProfileStore();

    // Root items: Groups with no parentId (null or undefined)
    const rootGroups = groups.filter(g => !g.parentId);
    // Root profiles: Profiles with no groupId (null or undefined)
    const rootProfiles = profiles.filter(p => !p.groupId);

    return (
        <div className={className}>
            <div className="flex flex-col gap-0.5">
                {rootGroups.map(group => (
                    <FolderItem
                        key={group.id}
                        group={group}
                        allGroups={groups}
                        allProfiles={profiles}
                        activeProfileId={activeProfileId}
                        onProfileClick={onProfileSelect}
                        onDeleteGroup={onDeleteGroup}
                        onMoveProfile={onMoveProfile}
                        onDeleteProfile={onDeleteProfile}
                    />
                ))}

                {rootProfiles.map(profile => (
                    <TreeItem
                        key={profile.id}
                        profile={profile}
                        isActive={activeProfileId === profile.id}
                        onClick={() => onProfileSelect?.(profile)}
                        onMove={onMoveProfile}
                        onDelete={onDeleteProfile}
                    />
                ))}

                {rootGroups.length === 0 && rootProfiles.length === 0 && (
                    <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                        No connections found.
                    </div>
                )}
            </div>
        </div>
    );
}
