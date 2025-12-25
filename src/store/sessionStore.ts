import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';

export interface Session {
    id: string;
    profileId: string;
    title: string;
    status: 'connecting' | 'connected' | 'disconnected';
    timestamp: number;
}

interface SessionState {
    sessions: Session[];
    activeSessionId: string | null;

    addSession: (profileId: string, title: string) => void;
    removeSession: (id: string) => void;
    setActiveSession: (id: string | null) => void;

    // Actions using current state
    connect: (profileId: string, title: string) => void;
    disconnect: (id: string) => void;
}

export const useSessionStore = create<SessionState>((set) => ({
    sessions: [],
    activeSessionId: null,

    addSession: (profileId, title) => set((state) => {
        const newSession: Session = {
            id: uuidv4(),
            profileId,
            title,
            status: 'connecting',
            timestamp: Date.now(),
        };
        return {
            sessions: [...state.sessions, newSession],
            activeSessionId: newSession.id, // Auto-switch to new session
        };
    }),

    removeSession: (id) => set((state) => {
        const remaining = state.sessions.filter(s => s.id !== id);
        // If closing active session, switch to last available or null
        let nextActive = state.activeSessionId;
        if (state.activeSessionId === id) {
            nextActive = remaining.length > 0 ? remaining[remaining.length - 1].id : null;
        }
        return {
            sessions: remaining,
            activeSessionId: nextActive,
        };
    }),

    setActiveSession: (id) => set({ activeSessionId: id }),

    connect: (profileId, title) => {
        // Alias for addSession for semantics
        return set((state) => {
            const newSession: Session = {
                id: uuidv4(),
                profileId,
                title,
                status: 'connecting',
                timestamp: Date.now(),
            };
            return {
                sessions: [...state.sessions, newSession],
                activeSessionId: newSession.id,
            };
        });
    },

    disconnect: (id) => {
        // Alias for removeSession for now
        // In real app, we would kill the SSH socket here first
        set((state) => {
            const remaining = state.sessions.filter(s => s.id !== id);
            let nextActive = state.activeSessionId;
            if (state.activeSessionId === id) {
                nextActive = remaining.length > 0 ? remaining[remaining.length - 1].id : null;
            }
            return {
                sessions: remaining,
                activeSessionId: nextActive,
            };
        });
    }
}));
