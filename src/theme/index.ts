// Simple Theme System for Modern Tailwind
export type ThemeVariant = 'default' | 'dark' | 'ocean';

// Theme switching function
export function setTheme(theme: ThemeVariant): void {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('termilo-theme', theme);
}

// Get current theme
export function getCurrentTheme(): ThemeVariant {
    const stored = localStorage.getItem('termilo-theme') as ThemeVariant;
    return stored || 'default';
}

// Initialize theme on app load
export function initializeTheme(): void {
    const currentTheme = getCurrentTheme();
    setTheme(currentTheme);
}

// Available themes for UI
export const availableThemes: { value: ThemeVariant; label: string }[] = [
    { value: 'default', label: 'Default (Soft)' },
    { value: 'dark', label: 'Dark' },
    { value: 'ocean', label: 'Ocean' },
];