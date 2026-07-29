import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { Entry, Tag, Mood } from '../types';
import { getEntries, saveEntry, deleteEntryFromStorage, getAllTags, getTagFrequency, updateTagFrequency } from '../services/storage';
import { initializeWidgetSync, getMoodEmoji } from '../services/widgetService';

// State shape
interface AppState {
    entries: Entry[];
    tags: Tag[];
    tagFrequency: Record<string, number>;
    streak: number;
    isLoading: boolean;
}

// Action types
type AppAction =
    | { type: 'SET_ENTRIES'; payload: Entry[] }
    | { type: 'ADD_ENTRY'; payload: Entry }
    | { type: 'UPDATE_ENTRY'; payload: Entry }
    | { type: 'DELETE_ENTRY'; payload: string }
    | { type: 'SET_TAGS'; payload: Tag[] }
    | { type: 'SET_TAG_FREQUENCY'; payload: Record<string, number> }
    | { type: 'SET_STREAK'; payload: number }
    | { type: 'SET_LOADING'; payload: boolean }
    | { type: 'CLEAR_ALL' };

// Initial state
const initialState: AppState = {
    entries: [],
    tags: [],
    tagFrequency: {},
    streak: 0,
    isLoading: true,
};

// Reducer
function appReducer(state: AppState, action: AppAction): AppState {
    switch (action.type) {
        case 'SET_ENTRIES':
            return { ...state, entries: action.payload };
        case 'ADD_ENTRY':
            return { ...state, entries: [...state.entries, action.payload] };
        case 'UPDATE_ENTRY':
            return {
                ...state,
                entries: state.entries.map(e => e.id === action.payload.id ? action.payload : e),
            };
        case 'DELETE_ENTRY':
            return {
                ...state,
                entries: state.entries.filter(e => e.id !== action.payload),
            };
        case 'SET_TAGS':
            return { ...state, tags: action.payload };
        case 'SET_TAG_FREQUENCY':
            return { ...state, tagFrequency: action.payload };
        case 'SET_STREAK':
            return { ...state, streak: action.payload };
        case 'SET_LOADING':
            return { ...state, isLoading: action.payload };
        case 'CLEAR_ALL':
            return { ...initialState, isLoading: false };
        default:
            return state;
    }
}

// Context
interface AppContextType {
    state: AppState;
    dispatch: React.Dispatch<AppAction>;
    // Helper functions
    addEntry: (entry: Entry) => Promise<void>;
    updateEntry: (entry: Entry) => Promise<void>;
    deleteEntry: (id: string) => Promise<void>;
    refreshTags: () => Promise<void>;
    calculateStreak: (entries: Entry[]) => number;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Calculate streak from entries
function calculateStreakFromEntries(entries: Entry[]): number {
    if (entries.length === 0) return 0;

    const sorted = [...entries].sort((a, b) => b.timestamp - a.timestamp);
    const today = new Date().setHours(0, 0, 0, 0);
    const lastEntryDate = new Date(sorted[0].timestamp).setHours(0, 0, 0, 0);

    if (lastEntryDate < today - 86400000) return 0;

    const dates = new Set(sorted.map(e => new Date(e.timestamp).toDateString()));
    let checkDate = new Date();
    let currentStreak = 0;

    if (!dates.has(checkDate.toDateString())) {
        checkDate.setDate(checkDate.getDate() - 1);
    }

    while (dates.has(checkDate.toDateString())) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
    }

    return currentStreak;
}

// Provider
export function AppProvider({ children }: { children: ReactNode }) {
    const [state, dispatch] = useReducer(appReducer, initialState);

    // Initialize data on mount
    useEffect(() => {
        const initData = async () => {
            try {
                const [entries, tags, tagFrequency] = await Promise.all([
                    getEntries(),
                    getAllTags(),
                    getTagFrequency(),
                ]);

                dispatch({ type: 'SET_ENTRIES', payload: entries });
                dispatch({ type: 'SET_TAGS', payload: tags });
                dispatch({ type: 'SET_TAG_FREQUENCY', payload: tagFrequency });

                const streak = calculateStreakFromEntries(entries);
                dispatch({ type: 'SET_STREAK', payload: streak });

                // Sync to widget
                const lastEntry = entries[0];
                await initializeWidgetSync(streak, lastEntry ? getMoodEmoji(lastEntry.mood) : undefined);

                dispatch({ type: 'SET_LOADING', payload: false });
            } catch (error) {
                console.error('Failed to initialize app data:', error);
                dispatch({ type: 'SET_LOADING', payload: false });
            }
        };

        initData();
    }, []);

    // Helper functions
    const addEntry = async (entry: Entry) => {
        const updated = await saveEntry(entry);
        dispatch({ type: 'SET_ENTRIES', payload: updated });

        if (entry.tags.length > 0) {
            await updateTagFrequency(entry.tags);
            const newFrequency = await getTagFrequency();
            dispatch({ type: 'SET_TAG_FREQUENCY', payload: newFrequency });
        }

        const streak = calculateStreakFromEntries(updated);
        dispatch({ type: 'SET_STREAK', payload: streak });
    };

    const updateEntry = async (entry: Entry) => {
        const updated = await saveEntry(entry);
        dispatch({ type: 'SET_ENTRIES', payload: updated });
    };

    const deleteEntry = async (id: string) => {
        const updated = await deleteEntryFromStorage(id);
        dispatch({ type: 'SET_ENTRIES', payload: updated });

        const streak = calculateStreakFromEntries(updated);
        dispatch({ type: 'SET_STREAK', payload: streak });
    };

    const refreshTags = async () => {
        const tags = await getAllTags();
        dispatch({ type: 'SET_TAGS', payload: tags });
    };

    const calculateStreak = (entries: Entry[]) => {
        const streak = calculateStreakFromEntries(entries);
        dispatch({ type: 'SET_STREAK', payload: streak });
        return streak;
    };

    const value: AppContextType = {
        state,
        dispatch,
        addEntry,
        updateEntry,
        deleteEntry,
        refreshTags,
        calculateStreak,
    };

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

// Hook
export function useApp() {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error('useApp must be used within an AppProvider');
    }
    return context;
}

// Selector hooks for performance
export function useEntries() {
    const { state } = useApp();
    return state.entries;
}

export function useTags() {
    const { state } = useApp();
    return state.tags;
}

export function useStreak() {
    const { state } = useApp();
    return state.streak;
}

export function useIsLoading() {
    const { state } = useApp();
    return state.isLoading;
}
