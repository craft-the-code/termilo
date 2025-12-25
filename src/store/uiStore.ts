import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UIState {
    hasCompletedOnboarding: boolean;
    completeOnboarding: () => void;

    // Theme preferences could go here later
    theme: 'dark' | 'light' | 'system';
    setTheme: (theme: 'dark' | 'light' | 'system') => void;

    // Appearance
    fontSize: number;
    fontFamily: string;
    lineHeight: number;
    setFontSize: (size: number) => void;
    setFontFamily: (font: string) => void;
    setLineHeight: (height: number) => void;
}

export const useUIStore = create<UIState>()(
    persist(
        (set) => ({
            hasCompletedOnboarding: false,
            completeOnboarding: () => set({ hasCompletedOnboarding: true }),

            theme: 'dark',
            setTheme: (theme) => set({ theme }),

            fontSize: 14,
            fontFamily: 'JetBrains Mono',
            lineHeight: 1.5,
            setFontSize: (fontSize) => set({ fontSize }),
            setFontFamily: (fontFamily) => set({ fontFamily }),
            setLineHeight: (lineHeight) => set({ lineHeight }),
        }),
        {
            name: 'termilo-ui-storage',
        }
    )
);
