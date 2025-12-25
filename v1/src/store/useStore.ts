import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ServerProfile, Session } from '../types';

interface AppState {
    profiles: ServerProfile[];
    sessions: Session[];
    activeSessionId: string | null;

    // Profile actions
    addProfile: (profile: Omit<ServerProfile, 'id'>) => void;
    updateProfile: (id: string, profile: Partial<ServerProfile>) => void;
    deleteProfile: (id: string) => void;

    // Session actions
    createSession: (profileId: string) => void;
    closeSession: (sessionId: string) => void;
    setActiveSession: (sessionId: string) => void;
    updateSession: (sessionId: string, updates: Partial<Session>) => void;
}

export const useStore = create<AppState>()(
    persist(
        (set, get) => ({
            profiles: [],
            sessions: [],
            activeSessionId: null,

            addProfile: (profile) => set((state) => ({
                profiles: [...state.profiles, { ...profile, id: crypto.randomUUID() }]
            })),

            updateProfile: (id, updates) => set((state) => ({
                profiles: state.profiles.map(p => p.id === id ? { ...p, ...updates } : p)
            })),

            deleteProfile: (id) => set((state) => ({
                profiles: state.profiles.filter(p => p.id !== id),
                sessions: state.sessions.filter(s => s.profileId !== id)
            })),

            createSession: (profileId) => {
                const profile = get().profiles.find(p => p.id === profileId);
                if (!profile) return;

                const session: Session = {
                    id: crypto.randomUUID(),
                    profileId,
                    profileName: profile.name,
                    isConnected: false,
                    isConnecting: false,
                };

                set((state) => ({
                    sessions: [...state.sessions, session],
                    activeSessionId: session.id
                }));
            },

            closeSession: (sessionId) => set((state) => ({
                sessions: state.sessions.filter(s => s.id !== sessionId),
                activeSessionId: state.activeSessionId === sessionId
                    ? state.sessions.find(s => s.id !== sessionId)?.id || null
                    : state.activeSessionId
            })),

            setActiveSession: (sessionId) => set({ activeSessionId: sessionId }),

            updateSession: (sessionId, updates) => set((state) => ({
                sessions: state.sessions.map(s => s.id === sessionId ? { ...s, ...updates } : s)
            })),
        }),
        {
            name: 'termilo-storage',
            partialize: (state) => ({
                profiles: state.profiles,
                // Don't persist sessions as they're runtime-only
            }),
        }
    )
);