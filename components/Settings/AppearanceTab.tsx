import React from 'react';
import { Moon, Sun, Palette } from 'lucide-react';

interface AppearanceTabProps {
    isDarkMode: boolean;
    toggleDarkMode: () => void;
    currentTheme: string;
    onThemeChange: (theme: string) => void;
}

const themes = [
    { id: 'ocean', name: 'Ocean', color: '#7598a0' },
    { id: 'rose', name: 'Rose', color: '#FF6B6B' },
    { id: 'apricot', name: 'Apricot', color: '#ebb497ff' },
];

const AppearanceTab: React.FC<AppearanceTabProps> = ({
    isDarkMode,
    toggleDarkMode,
    currentTheme,
    onThemeChange,
}) => {
    return (
        <section className="bg-white dark:bg-navy-surface p-6 rounded-3xl shadow-sm border border-warmGray-light/50 dark:border-navy-border space-y-8">
            {/* Theme Picker */}
            <div>
                <h3 className="font-bold text-warmGray dark:text-nearWhite mb-4 flex items-center gap-2">
                    <Palette className="w-5 h-5" /> App Theme
                </h3>
                <div className="flex justify-between gap-2">
                    {themes.map((t) => (
                        <button
                            key={t.id}
                            onClick={() => onThemeChange(t.id)}
                            className={`flex flex-col items-center gap-2 p-2 rounded-xl transition-all ${currentTheme === t.id
                                    ? 'bg-warmGray-light/30 dark:bg-white/10 scale-105'
                                    : 'opacity-70 hover:opacity-100'
                                }`}
                        >
                            <div
                                className="w-10 h-10 rounded-full border-2 border-white dark:border-navy shadow-sm"
                                style={{ backgroundColor: t.color }}
                            />
                            <span className="text-xs font-bold text-warmGray-medium dark:text-warmGray-light">
                                {t.name}
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            <div className="h-px bg-warmGray-light/50 dark:bg-navy-border w-full" />

            {/* Dark Mode Toggle */}
            <div>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div
                            className={`p-2 rounded-full ${isDarkMode ? 'bg-navy text-lavender' : 'bg-brand-light text-brand'
                                }`}
                        >
                            {isDarkMode ? <Moon size={20} /> : <Sun size={20} />}
                        </div>
                        <div>
                            <p className="font-semibold text-warmGray dark:text-nearWhite">Dark Mode</p>
                            <p className="text-xs text-warmGray-medium dark:text-warmGray-light/70">
                                Easier on the eyes
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={toggleDarkMode}
                        className={`w-14 h-8 rounded-full transition-colors relative ${isDarkMode ? 'bg-brand' : 'bg-warmGray-light'
                            }`}
                    >
                        <div
                            className={`absolute top-1 left-1 bg-white w-6 h-6 rounded-full transition-transform ${isDarkMode ? 'translate-x-6' : 'translate-x-0'
                                }`}
                        />
                    </button>
                </div>
            </div>
        </section>
    );
};

export default AppearanceTab;
