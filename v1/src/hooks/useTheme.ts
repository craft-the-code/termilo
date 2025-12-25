import { useState, useEffect } from 'react';
import {
    ThemeVariant,
    setTheme,
    getCurrentTheme,
    initializeTheme,
    availableThemes
} from '../theme';

export function useTheme() {
    const [currentTheme, setCurrentTheme] = useState<ThemeVariant>(() => getCurrentTheme());

    // Initialize theme on mount
    useEffect(() => {
        initializeTheme();
    }, []);

    // Change theme function
    const changeTheme = (variant: ThemeVariant) => {
        setCurrentTheme(variant);
        setTheme(variant);
    };

    return {
        currentTheme,
        changeTheme,
        availableThemes,
    };
}