import { MoonIcon, SunIcon } from '@heroicons/react/24/outline';
import { useState } from 'react';

const getTheme = () => document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';

export default function ThemeToggle({ className = '' }) {
    const [theme, setTheme] = useState(getTheme);
    const nextTheme = theme === 'light' ? 'dark' : 'light';

    const toggleTheme = () => {
        document.documentElement.dataset.theme = nextTheme;
        localStorage.setItem('isdalog-theme', nextTheme);
        setTheme(nextTheme);
    };

    return (
        <button
            type="button"
            onClick={toggleTheme}
            className={`isd-theme-toggle ${className}`}
            aria-label={`Switch to ${nextTheme} theme`}
            title={`Switch to ${nextTheme} theme`}
        >
            {theme === 'light' ? <MoonIcon aria-hidden="true" /> : <SunIcon aria-hidden="true" />}
            <span>{theme === 'light' ? 'Dark theme' : 'Light theme'}</span>
        </button>
    );
}
