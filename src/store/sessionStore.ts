import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';

export interface Session {
    id: string;
    profileId: string;
    title: string;
    status: 'connecting' | 'connected' | 'disconnected';
    timestamp: number;
    isConnected: boolean;
    isConnecting: boolean;
}

interface SessionState {
    sessions: Session[];
    activeSessionId: string | null;
    currentView: 'dashboard' | 'terminal';

    addSession: (profileId: string, title: string) => void;
    removeSession: (id: string) => void;
    setActiveSession: (id: string | null) => void;
    setView: (view: 'dashboard' | 'terminal') => void;
    updateSession: (id: string, updates: Partial<Session>) => void;

    // Actions using current state
    connect: (profileId: string, title: string) => void;
    disconnect: (id: string) => void;
}

export const useSessionStore = create<SessionState>((set) => ({
    sessions: [],
    activeSessionId: null,
    currentView: 'dashboard',

    addSession: (profileId, title) => set((state) => {
        const newSession: Session = {
            id: uuidv4(),
            profileId,
            title,
            status: 'connecting',
            timestamp: Date.now(),
            isConnected: false,
            isConnecting: false,
        };
        return {
            sessions: [...state.sessions, newSession],
            activeSessionId: newSession.id, // Auto-switch to new session
            currentView: 'terminal',
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

    setActiveSession: (id) => set({ activeSessionId: id, currentView: 'terminal' }),

    setView: (view) => set({ currentView: view }),

    updateSession: (id, updates) => set((state) => ({
        sessions: state.sessions.map(s => s.id === id ? { ...s, ...updates } : s)
    })),

    connect: (profileId, title) => {
        // Alias for addSession for semantics
        return set((state) => {
            const newSession: Session = {
                id: uuidv4(),
                profileId,
                title,
                status: 'connecting',
                timestamp: Date.now(),
                isConnected: false,
                isConnecting: false,
            };
            return {
                sessions: [...state.sessions, newSession],
                activeSessionId: newSession.id,
                currentView: 'terminal',
            };
        });
    },

    disconnect: (id) => {
        // Alias for removeSession for now
        // In real app, we would kill the SSH socket here first
        set((state) => {
            const remaining = state.sessions.filter(s => s.id !== id);
            let nextActive = state.activeSessionId;
            // If the closed session was active, switch to another
            if (state.activeSessionId === id) {
                nextActive = remaining.length > 0 ? remaining[remaining.length - 1].id : null;
            }
            return {
                sessions: remaining,
                activeSessionId: nextActive,
                // If no sessions left, go to dashboard
                currentView: remaining.length === 0 ? 'dashboard' : state.currentView
            };
        });
    }
}));
