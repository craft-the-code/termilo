import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';

export interface Script {
    id: string;
    name: string;
    description?: string;
    content: string;
    isBuiltin?: boolean;
}

interface ScriptState {
    scripts: Script[];
    addScript: (script: Omit<Script, 'id'>) => void;
    updateScript: (id: string, updates: Partial<Script>) => void;
    deleteScript: (id: string) => void;
    getScript: (id: string) => Script | undefined;
}

const BUILTIN_SCRIPTS: Script[] = [
    {
        id: 'builtin-1',
        name: 'System Info',
        description: 'Check CPU, Memory, and Disk usage',
        content: 'echo "--- System Info ---"; uptime; echo ""; echo "--- Memory ---"; free -h; echo ""; echo "--- Disk Usage ---"; df -h',
        isBuiltin: true
    },
    {
        id: 'builtin-2',
        name: 'Docker Stats',
        description: 'List running containers and their status',
        content: 'docker ps --format "table {{.ID}}\\t{{.Image}}\\t{{.Status}}\\t{{.Names}}"',
        isBuiltin: true
    },
    {
        id: 'builtin-3',
        name: 'OS Release',
        description: 'Check Linux distribution details',
        content: 'cat /etc/os-release',
        isBuiltin: true
    }
];

export const useScriptStore = create<ScriptState>()(
    persist(
        (set, get) => ({
            scripts: BUILTIN_SCRIPTS,

            addScript: (newScript) => set((state) => ({
                scripts: [
                    ...state.scripts,
                    {
                        ...newScript,
                        id: uuidv4(),
                        isBuiltin: false
                    }
                ]
            })),

            updateScript: (id, updates) => set((state) => ({
                scripts: state.scripts.map((s) =>
                    s.id === id ? { ...s, ...updates, isBuiltin: s.isBuiltin } : s
                ),
            })),

            deleteScript: (id) => set((state) => ({
                scripts: state.scripts.filter((s) => s.id !== id),
            })),

            getScript: (id) => get().scripts.find((s) => s.id === id),
        }),
        {
            name: 'termilo-scripts',
            version: 1,
            // Ensure built-ins are always present/merged if we wanted, 
            // but for now simple persistence is fine.
            // We might want logic to restore built-ins if missing.
            onRehydrateStorage: () => (state) => {
                if (state) {
                    // Check if built-ins are missing and add them back if needed
                    const currentIds = new Set(state.scripts.map(s => s.id));
                    const missingBuiltins = BUILTIN_SCRIPTS.filter(b => !currentIds.has(b.id));
                    if (missingBuiltins.length > 0) {
                        state.scripts = [...state.scripts, ...missingBuiltins];
                    }
                }
            }
        }
    )
);
