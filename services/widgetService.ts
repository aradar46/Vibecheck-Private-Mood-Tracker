import { Capacitor, registerPlugin } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';
import { MOODS } from '../constants.ts';


/**
 * Widget Bridge Service
 * Handles communication between the native Android widget and the Capacitor app
 */

const WIDGET_PREFS_KEY = 'VibeCheckWidget';

interface WidgetData {
    streak: number;
    lastMood: string;
    lastMoodTimestamp: number;
}

interface PendingWidgetMood {
    mood: number;
    timestamp: number;
}

/**
 * Update widget data from app
 * This syncs the streak and last mood to the widget via SharedPreferences
 */
export async function updateWidgetData(streak: number, lastMood?: string): Promise<void> {
    if (!Capacitor.isNativePlatform()) {
        console.log('Widget sync: Not on native platform');
        return;
    }

    try {
        // Store in Capacitor Preferences (which uses SharedPreferences on Android)
        const promises = [
            Preferences.set({
                key: 'widget_streak',
                value: streak.toString(),
            }),
            Preferences.set({
                key: 'widget_lastUpdate',
                value: Date.now().toString(),
            })
        ];

        if (lastMood) {
            promises.push(Preferences.set({
                key: 'widget_lastMood',
                value: lastMood,
            }));
        }

        await Promise.all(promises);

        // Trigger widget refresh via broadcast
        // This requires the native bridge to be set up
        await triggerWidgetRefresh();

    } catch (error) {
        console.error('Failed to update widget data:', error);
    }
}

/**
 * Check for pending mood from widget tap
 */
export async function getPendingWidgetMood(): Promise<PendingWidgetMood | null> {
    if (!Capacitor.isNativePlatform()) {
        return null;
    }

    try {
        const [
            { value: moodValue },
            { value: timestamp },
            { value: openEntryForm }
        ] = await Promise.all([
            Preferences.get({ key: 'widget_pendingMood' }),
            Preferences.get({ key: 'widget_pendingMoodTimestamp' }),
            Preferences.get({ key: 'widget_openEntryForm' })
        ]);

        // Check if we should open entry form (from widget click)
        if (openEntryForm === 'true' || (moodValue && timestamp)) {
            const mood = moodValue ? parseInt(moodValue) : 3; // Default to 'Okay'
            const ts = timestamp ? parseInt(timestamp) : Date.now();

            // Only process if within last 5 minutes OR openEntryForm is set
            if (openEntryForm === 'true' || Date.now() - ts < 5 * 60 * 1000) {
                // Clear the pending data
                await clearPendingWidgetMood();

                return {
                    mood,
                    timestamp: ts,
                };
            }
        }
    } catch (error) {
        console.error('Failed to get pending widget mood:', error);
    }

    return null;
}

/**
 * Clear pending widget mood after processing
 */
export async function clearPendingWidgetMood(): Promise<void> {
    try {
        await Promise.all([
            Preferences.remove({ key: 'widget_pendingMood' }),
            Preferences.remove({ key: 'widget_pendingMoodTimestamp' }),
            Preferences.remove({ key: 'widget_openEntryForm' })
        ]);
    } catch (error) {
        console.error('Failed to clear pending widget mood:', error);
    }
}

/**
 * Trigger native widget refresh
 * This sends a broadcast to update all widget instances
 */
async function triggerWidgetRefresh(): Promise<void> {
    // On Android, we need to send a broadcast to refresh the widget
    // This can be done through a custom Capacitor plugin or the capacitor-android-intents plugin

    if (Capacitor.getPlatform() === 'android') {
        try {
            // Use the App plugin to check if we can send intents
            // For now, we rely on the widget's periodic update (every hour per widget_info.xml)
            // or when the user opens the app, the data is synced via SharedPreferences
            console.log('Widget data synced to SharedPreferences');
        } catch (error) {
            console.error('Failed to trigger widget refresh:', error);
        }
    }
}

/**
 * Initialize widget sync on app start
 */
export async function initializeWidgetSync(streak: number, lastMoodEmoji?: string): Promise<void> {
    await updateWidgetData(streak, lastMoodEmoji);
}

/**
 * Get mood emoji from mood value
 */
export function getMoodEmoji(moodValue: number): string {
    const moodObj = MOODS.find(m => m.value === moodValue);
    return moodObj ? moodObj.emoji : '😐';
}
