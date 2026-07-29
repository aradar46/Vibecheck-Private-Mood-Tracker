import { Entry, Tag, Category } from '../types';
import { MOCK_ENTRIES_KEY, DEFAULT_TAGS, DEFAULT_CATEGORIES } from '../constants';
import { Preferences } from '@capacitor/preferences';
import {
    USER_NAME_KEY,
    ONBOARDING_DONE_KEY,
    CUSTOM_TAGS_KEY,
    HIDDEN_DEFAULTS_KEY,
    NOTIFICATIONS_KEY,
    THEME_PREF_KEY,
    TAG_FREQUENCY_KEY,
    HIDDEN_SYMPTOMS_KEY,
    NAV_LABELS_KEY,
    TAG_COLORS_KEY,
    CUSTOM_CATEGORIES_KEY,
    CUSTOM_MOODS_KEY,
} from './storageKeys';
import { CustomMood } from '../types';

// Optional: per-user label overrides for default tags
const DEFAULT_TAG_LABEL_OVERRIDES_KEY = 'default_tag_label_overrides';

export const getEntries = async (): Promise<Entry[]> => {
    try {
        const { value } = await Preferences.get({ key: MOCK_ENTRIES_KEY });
        // Sort Newest First (Descending) to ensure slice(0, 5) gets the most recent days
        return value ? JSON.parse(value).sort((a: Entry, b: Entry) => b.timestamp - a.timestamp) : [];
    } catch (e) {
        console.error("Failed to load entries", e);
        return [];
    }
};

export const saveEntry = async (entry: Entry): Promise<Entry[]> => {
    const current = await getEntries();
    const existingIndex = current.findIndex(e => e.id === entry.id);

    let updated;
    if (existingIndex >= 0) {
        // Update existing
        updated = [...current];
        updated[existingIndex] = entry;
    } else {
        // Create new
        updated = [entry, ...current];
    }

    // Always resort
    updated.sort((a, b) => b.timestamp - a.timestamp);
    await Preferences.set({ key: MOCK_ENTRIES_KEY, value: JSON.stringify(updated) });
    return updated;
};

export const deleteEntryFromStorage = async (id: string): Promise<Entry[]> => {
    const current = await getEntries();
    const updated = current.filter(e => e.id !== id);
    await Preferences.set({ key: MOCK_ENTRIES_KEY, value: JSON.stringify(updated) });
    return updated;
}

export const clearData = async () => {
    await Preferences.remove({ key: MOCK_ENTRIES_KEY });
    await Preferences.remove({ key: CUSTOM_TAGS_KEY });
    await Preferences.remove({ key: HIDDEN_DEFAULTS_KEY });
    await Preferences.remove({ key: NOTIFICATIONS_KEY });
    await Preferences.remove({ key: THEME_PREF_KEY });
}

// Onboarding
export const getOnboardingDone = async (): Promise<boolean> => {
    const { value } = await Preferences.get({ key: ONBOARDING_DONE_KEY });
    return value === 'true';
};

export const setOnboardingDone = async () => {
    await Preferences.set({ key: ONBOARDING_DONE_KEY, value: 'true' });
};

export const getUserName = async (): Promise<string> => {
    const { value } = await Preferences.get({ key: USER_NAME_KEY });
    return value || 'Friend';
}

export const saveUserName = async (name: string) => {
    await Preferences.set({ key: USER_NAME_KEY, value: name });
}

// Theme Management
export const getThemePref = async (): Promise<string> => {
    const { value } = await Preferences.get({ key: THEME_PREF_KEY });
    return value || 'ocean';
}

export const saveThemePref = async (theme: string) => {
    await Preferences.set({ key: THEME_PREF_KEY, value: theme });
}

// Notification Management
export const getNotificationTimes = async (): Promise<string[]> => {
    try {
        const { value } = await Preferences.get({ key: NOTIFICATIONS_KEY });
        return value ? JSON.parse(value) : [];
    } catch (e) {
        return [];
    }
}

export const saveNotificationTimes = async (times: string[]) => {
    await Preferences.set({ key: NOTIFICATIONS_KEY, value: JSON.stringify(times) });
}

// Tag Management
export const getCustomTags = async (): Promise<Tag[]> => {
    try {
        const { value } = await Preferences.get({ key: CUSTOM_TAGS_KEY });
        return value ? JSON.parse(value) : [];
    } catch (e) {
        return [];
    }
};

export const getHiddenDefaults = async (): Promise<string[]> => {
    try {
        const { value } = await Preferences.get({ key: HIDDEN_DEFAULTS_KEY });
        return value ? JSON.parse(value) : [];
    } catch (e) {
        return [];
    }
}

// Insert or update a custom tag by id (no duplicates)
export const upsertCustomTag = async (tag: Tag) => {
    const current = await getCustomTags();
    const idx = current.findIndex(t => t.id === tag.id);
    let updated: Tag[];
    if (idx >= 0) {
        updated = [...current];
        updated[idx] = { ...current[idx], ...tag };
    } else {
        updated = [...current, tag];
    }
    await Preferences.set({ key: CUSTOM_TAGS_KEY, value: JSON.stringify(updated) });
    return updated;
};

// Backward-compat shim for older calls
export const saveCustomTag = upsertCustomTag;

export const deleteTag = async (id: string) => {
    // Check if it's a default tag
    const isDefault = DEFAULT_TAGS.some(t => t.id === id);

    if (isDefault) {
        // Add to hidden list
        const hidden = await getHiddenDefaults();
        if (!hidden.includes(id)) {
            await Preferences.set({ key: HIDDEN_DEFAULTS_KEY, value: JSON.stringify([...hidden, id]) });
        }
    } else {
        // Soft-delete custom tag -> mark hidden instead of removing
        const current = await getCustomTags();
        const idx = current.findIndex(t => t.id === id);
        if (idx >= 0) {
            const updated = [...current];
            updated[idx] = { ...updated[idx], isHidden: true };
            await Preferences.set({ key: CUSTOM_TAGS_KEY, value: JSON.stringify(updated) });
        }
    }
};

// Label override helpers for default tags
const getDefaultLabelOverrides = async (): Promise<Record<string, string>> => {
    try {
        const { value } = await Preferences.get({ key: DEFAULT_TAG_LABEL_OVERRIDES_KEY });
        return value ? JSON.parse(value) : {};
    } catch {
        return {};
    }
};

const setDefaultLabelOverride = async (id: string, label?: string) => {
    const overrides = await getDefaultLabelOverrides();
    if (label && label.trim().length > 0) {
        overrides[id] = label.trim();
    } else {
        delete overrides[id];
    }
    await Preferences.set({ key: DEFAULT_TAG_LABEL_OVERRIDES_KEY, value: JSON.stringify(overrides) });
};

// Returns defaults (with hidden/label overrides) + custom; filter hidden unless showHidden=true
export const getAllTags = async (showHidden: boolean = false): Promise<Tag[]> => {
    const custom = await getCustomTags();
    const hiddenDefaults = await getHiddenDefaults();
    const overrides = await getDefaultLabelOverrides();

    const defaults: Tag[] = DEFAULT_TAGS.map(t => ({
        ...t,
        label: overrides[t.id] ?? t.label,
        isHidden: hiddenDefaults.includes(t.id),
    }));

    const merged = [...defaults, ...custom];
    return showHidden ? merged : merged.filter(t => !t.isHidden);
};

// Update only the label of a tag (default -> override; custom -> stored tag)
export const updateTagLabel = async (id: string, label: string) => {
    const isDefault = DEFAULT_TAGS.some(t => t.id === id);
    if (isDefault) {
        await setDefaultLabelOverride(id, label);
    } else {
        const current = await getCustomTags();
        const idx = current.findIndex(t => t.id === id);
        if (idx >= 0) {
            const updated = [...current];
            updated[idx] = { ...updated[idx], label };
            await Preferences.set({ key: CUSTOM_TAGS_KEY, value: JSON.stringify(updated) });
        }
    }
};

// Toggle hidden state (default -> hidden list; custom -> isHidden field)
export const toggleTagHidden = async (id: string, hidden: boolean) => {
    const isDefault = DEFAULT_TAGS.some(t => t.id === id);
    if (isDefault) {
        const list = await getHiddenDefaults();
        const exists = list.includes(id);
        const next = hidden ? (exists ? list : [...list, id]) : list.filter(x => x !== id);
        await Preferences.set({ key: HIDDEN_DEFAULTS_KEY, value: JSON.stringify(next) });
    } else {
        const current = await getCustomTags();
        const idx = current.findIndex(t => t.id === id);
        if (idx >= 0) {
            const updated = [...current];
            updated[idx] = { ...updated[idx], isHidden: hidden };
            await Preferences.set({ key: CUSTOM_TAGS_KEY, value: JSON.stringify(updated) });
        }
    }
};

// Tag Frequency Tracking
export const getTagFrequency = async (): Promise<Record<string, number>> => {
    try {
        const { value } = await Preferences.get({ key: TAG_FREQUENCY_KEY });
        return value ? JSON.parse(value) : {};
    } catch (e) {
        return {};
    }
};

export const updateTagFrequency = async (tagIds: string[]) => {
    const frequency = await getTagFrequency();
    tagIds.forEach(tagId => {
        frequency[tagId] = (frequency[tagId] || 0) + 1;
    });
    await Preferences.set({ key: TAG_FREQUENCY_KEY, value: JSON.stringify(frequency) });
};

// Navigation Labels Preference
export const getNavLabelsEnabled = async (): Promise<boolean> => {
    try {
        const { value } = await Preferences.get({ key: NAV_LABELS_KEY });
        return value ? JSON.parse(value) : false;
    } catch (e) {
        return false;
    }
};

export const setNavLabelsEnabled = async (enabled: boolean) => {
    await Preferences.set({ key: NAV_LABELS_KEY, value: JSON.stringify(enabled) });
};

// Tag Colors Preference
export const getTagColorsEnabled = async (): Promise<boolean> => {
    try {
        const { value } = await Preferences.get({ key: TAG_COLORS_KEY });
        return value === null ? false : JSON.parse(value); // default off
    } catch (e) {
        return false;
    }
};

export const setTagColorsEnabled = async (enabled: boolean) => {
    await Preferences.set({ key: TAG_COLORS_KEY, value: JSON.stringify(enabled) });
};

// Export / Import functions have been removed

// Category Management
export const getCustomCategories = async (): Promise<Category[]> => {
    try {
        const { value } = await Preferences.get({ key: CUSTOM_CATEGORIES_KEY });
        return value ? JSON.parse(value) : [];
    } catch {
        return [];
    }
};

export const getCategories = async (): Promise<Category[]> => {
    const custom = await getCustomCategories();
    // Default categories that are always present
    // Type assertion to avoid issues
    const defaults = DEFAULT_CATEGORIES as Category[];

    // Merge: custom categories can override defaults if IDs match
    const customMap = new Map(custom.map(c => [c.id, c]));
    const merged = defaults.map(d => {
        const customCat = customMap.get(d.id);
        if (customCat) {
            customMap.delete(d.id);
            return customCat;
        }
        return d;
    });

    return [...merged, ...customMap.values()];
};

export const saveCategory = async (category: Category) => {
    const current = await getCustomCategories();
    const idx = current.findIndex(c => c.id === category.id);
    let updated;
    if (idx >= 0) {
        updated = [...current];
        updated[idx] = category;
    } else {
        updated = [...current, category];
    }
    await Preferences.set({ key: CUSTOM_CATEGORIES_KEY, value: JSON.stringify(updated) });
    return updated;
};

export const deleteCategory = async (id: string) => {
    const current = await getCustomCategories();
    const updated = current.filter(c => c.id !== id);
    await Preferences.set({ key: CUSTOM_CATEGORIES_KEY, value: JSON.stringify(updated) });
    return updated;
};

// Custom Mood Management
export const getCustomMoods = async (): Promise<CustomMood[]> => {
    try {
        const { value } = await Preferences.get({ key: CUSTOM_MOODS_KEY });
        return value ? JSON.parse(value) : [];
    } catch {
        return [];
    }
};

export const saveCustomMood = async (mood: CustomMood) => {
    const current = await getCustomMoods();
    const idx = current.findIndex(m => m.id === mood.id);
    let updated;
    if (idx >= 0) {
        updated = [...current];
        updated[idx] = mood;
    } else {
        updated = [...current, mood];
    }
    await Preferences.set({ key: CUSTOM_MOODS_KEY, value: JSON.stringify(updated) });
    return updated;
};

export const deleteCustomMood = async (id: string) => {
    const current = await getCustomMoods();
    const updated = current.filter(m => m.id !== id);
    await Preferences.set({ key: CUSTOM_MOODS_KEY, value: JSON.stringify(updated) });
    return updated;
};

// Restore data from backup
export const restoreBackupData = async (data: any): Promise<boolean> => {
    try {
        if (!data || !data.version || !data.entries || !data.settings) {
            console.error('Invalid backup data format');
            return false;
        }

        // Restore entries
        await Preferences.set({ key: MOCK_ENTRIES_KEY, value: JSON.stringify(data.entries) });

        // Restore tags
        if (data.tags) {
            const customTags: Tag[] = [];
            const hiddenDefaults: string[] = [];
            const labelOverrides: Record<string, string> = {};

            data.tags.forEach((tag: any) => {
                const isDefault = DEFAULT_TAGS.some(t => t.id === tag.id);
                if (isDefault) {
                    if (tag.isHidden) hiddenDefaults.push(tag.id);
                    const defaultTag = DEFAULT_TAGS.find(t => t.id === tag.id);
                    if (defaultTag && defaultTag.label !== tag.label) {
                        labelOverrides[tag.id] = tag.label;
                    }
                } else {
                    customTags.push(tag);
                }
            });

            await Preferences.set({ key: CUSTOM_TAGS_KEY, value: JSON.stringify(customTags) });
            await Preferences.set({ key: HIDDEN_DEFAULTS_KEY, value: JSON.stringify(hiddenDefaults) });
            await Preferences.set({ key: 'default_tag_label_overrides', value: JSON.stringify(labelOverrides) });
        }

        // Restore settings
        if (data.settings) {
            if (data.settings.userName) await saveUserName(data.settings.userName);
            if (data.settings.theme) await saveThemePref(data.settings.theme);
            if (data.settings.notificationTimes) await saveNotificationTimes(data.settings.notificationTimes);
            if (data.settings.tagFrequency) {
                await Preferences.set({ key: TAG_FREQUENCY_KEY, value: JSON.stringify(data.settings.tagFrequency) });
            }
        }

        return true;
    } catch (e) {
        console.error('Failed to restore backup', e);
        return false;
    }
};