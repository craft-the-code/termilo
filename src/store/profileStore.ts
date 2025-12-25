import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';

export type ConnectionType = 'aws' | 'vps' | 'iot' | 'local';

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
    lastActive?: string;
    status: 'online' | 'offline' | 'unknown' | 'unreachable';
}

interface ProfileState {
    profiles: Profile[];
    addProfile: (profile: Omit<Profile, 'id' | 'lastActive' | 'status'>) => void;
    updateProfile: (id: string, updates: Partial<Profile>) => void;
    deleteProfile: (id: string) => void;
    getProfile: (id: string) => Profile | undefined;
}

export const useProfileStore = create<ProfileState>()(
    persist(
        (set, get) => ({
            profiles: [
                // Initial mock data to start with, can be removed later
                {
                    id: '1',
                    name: 'AWS Bastion Host',
                    host: 'bastion.aws',
                    port: 22,
                    username: 'ec2-user',
                    authType: 'key',
                    type: 'aws',
                    tags: ['AWS', 'Gateway'],
                    lastActive: 'Never',
                    status: 'unknown',
                },
                {
                    id: '2',
                    name: 'Personal VPS',
                    host: '10.0.0.5',
                    port: 22,
                    username: 'root',
                    authType: 'password',
                    type: 'vps',
                    tags: ['DigitalOcean', 'Personal'],
                    lastActive: '5d ago',
                    status: 'online',
                },
            ],
            addProfile: (newProfile) => set((state) => ({
                profiles: [
                    ...state.profiles,
                    {
                        ...newProfile,
                        id: uuidv4(),
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
        }),
        {
            name: 'termilo-profiles', // unique name for localStorage
        }
    )
);
