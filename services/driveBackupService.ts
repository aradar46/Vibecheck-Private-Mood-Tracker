import { Capacitor } from '@capacitor/core';
import { getEntries, getAllTags, getThemePref, getNotificationTimes, getUserName, getTagFrequency } from './storage';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

/**
 * Offline Data Backup Service
 * Handles 100% local device JSON backup exports and shares.
 * Zero internet connection required.
 */

interface BackupData {
    version: string;
    exportedAt: string;
    entries: any[];
    tags: any[];
    settings: {
        userName: string;
        theme: string;
        notificationTimes: string[];
        tagFrequency: Record<string, number>;
    };
}

/**
 * Collect all app data for offline backup
 */
export async function collectBackupData(): Promise<BackupData> {
    const [entries, tags, theme, notificationTimes, userName, tagFrequency] = await Promise.all([
        getEntries(),
        getAllTags(true), // Include hidden tags
        getThemePref(),
        getNotificationTimes(),
        getUserName(),
        getTagFrequency(),
    ]);

    return {
        version: '1.0',
        exportedAt: new Date().toISOString(),
        entries,
        tags,
        settings: {
            userName,
            theme,
            notificationTimes,
            tagFrequency,
        },
    };
}

/**
 * Export data as JSON string
 */
export async function exportToJson(): Promise<string> {
    const data = await collectBackupData();
    return JSON.stringify(data, null, 2);
}

/**
 * Save JSON backup to device storage and share locally
 */
export async function saveAndShareBackup(): Promise<void> {
    const jsonData = await exportToJson();
    const fileName = `vibecheck-backup-${new Date().toISOString().split('T')[0]}.json`;

    if (Capacitor.isNativePlatform()) {
        // Save to iOS local filesystem cache
        const result = await Filesystem.writeFile({
            path: fileName,
            data: jsonData,
            directory: Directory.Cache,
            encoding: Encoding.UTF8,
        });

        // Share the file via native iOS share sheet
        await Share.share({
            title: 'VibeCheck Offline Backup',
            text: 'Your VibeCheck local backup',
            url: result.uri,
            dialogTitle: 'Save or Share Local Backup',
        });
    } else {
        // Web fallback - download file locally
        const blob = new Blob([jsonData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
}

/**
 * Legacy stubs kept for compatibility if imported anywhere
 */
export function isGoogleDriveConfigured(): boolean {
    return false;
}

export function getGoogleAuthUrl(): string {
    return '';
}
