import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';

export type ConnectionType = 'aws' | 'vps' | 'iot' | 'local';

export interface Group {
    id: string;
    name: string;
    parentId?: string | null; // null means root level
}

export interface Profile {
    id: string;
    name: string;
    host: string;
    port: number;
    username: string;
    authType: 'password' | 'key';
    password?: string;
    keyPath?: string;
    type: ConnectionType;
    tags: string[];
    groupId?: string | null; // Link to a group
    lastActive?: string;
    status: 'live' | 'error' | 'unknown';
    isTemporary?: boolean;
}

interface ProfileState {
    profiles: Profile[];
    groups: Group[];
    addProfile: (profile: Omit<Profile, 'id' | 'lastActive' | 'status'> & { id?: string }) => void;
    updateProfile: (id: string, updates: Partial<Profile>) => void;
    deleteProfile: (id: string) => void;
    getProfile: (id: string) => Profile | undefined;

    // Group Actions
    addGroup: (group: Omit<Group, 'id'>) => void;
    updateGroup: (id: string, updates: Partial<Group>) => void;
    deleteGroup: (id: string) => void;
    moveProfile: (profileId: string, groupId: string | null) => void;
}

export const useProfileStore = create<ProfileState>()(
    persist(
        (set, get) => ({
            profiles: [],
            groups: [],
            addProfile: (newProfile) => set((state) => ({
                profiles: [
                    ...state.profiles,
                    {
                        ...newProfile,
                        id: newProfile.id || uuidv4(),
                        lastActive: 'Never',
                        status: 'unknown', // Default status for new connections
                    }
                ]
            })),
            updateProfile: (id, updates) => set((state) => ({
                profiles: state.profiles.map((p) =>
                    p.id === id ? { ...p, ...updates } : p
                ),
            })),
            deleteProfile: (id) => set((state) => ({
                profiles: state.profiles.filter((p) => p.id !== id),
            })),
            getProfile: (id) => get().profiles.find((p) => p.id === id),

            // Group Actions Implementation
            addGroup: (newGroup) => set((state) => ({
                groups: [...state.groups, { ...newGroup, id: uuidv4() }]
            })),
            updateGroup: (id, updates) => set((state) => ({
                groups: state.groups.map((g) =>
                    g.id === id ? { ...g, ...updates } : g
                )
            })),
            deleteGroup: (id) => set((state) => {
                // When deleting a group, move its children (profiles and subgroups) to the parent of the deleted group
                // Or we could choose to cascade delete. For now, let's move profiles to root (null) or keep them orphaned?
                // Better safety: Move profiles to null (Root)
                return {
                    groups: state.groups.filter(g => g.id !== id && g.parentId !== id), // Also naive delete of subgroups for now OR TODO: recursively handle subgroups
                    profiles: state.profiles.map(p =>
                        p.groupId === id ? { ...p, groupId: null } : p
                    )
                };
            }),
            moveProfile: (profileId, groupId) => set((state) => ({
                profiles: state.profiles.map(p =>
                    p.id === profileId ? { ...p, groupId } : p
                )
            })),
        }),
        {
            name: 'termilo-profiles', // unique name for localStorage
            version: 2, // Increment version for migration if we were doing real migration logic (zustand persist handles some)
        }
    )
);
