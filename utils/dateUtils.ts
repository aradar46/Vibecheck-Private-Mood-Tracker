/**
 * Shared utility functions for date/time formatting
 */

/**
 * Format a Date object as YYYY-MM-DD for input fields
 */
export function formatDateForInput(date: Date): string {
    const offset = date.getTimezoneOffset();
    const localDate = new Date(date.getTime() - (offset * 60 * 1000));
    return localDate.toISOString().split('T')[0];
}

/**
 * Format a date for display (e.g., "Mon, Jan 25")
 */
export function formatDateShort(date: Date): string {
    return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
    });
}

/**
 * Format time as HH:MM
 */
export function formatTime(date: Date): string {
    return date.toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
    });
}

/**
 * Format a date relative to today (e.g., "Today", "Yesterday", "3 days ago")
 */
export function formatRelativeDate(date: Date): string {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const targetDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const diffDays = Math.floor((today.getTime() - targetDate.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} week${diffDays >= 14 ? 's' : ''} ago`;
    return formatDateShort(date);
}

/**
 * Get the start of day for a given date
 */
export function startOfDay(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
}

/**
 * Get the end of day for a given date
 */
export function endOfDay(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
}

/**
 * Check if two dates are the same day
 */
export function isSameDay(date1: Date, date2: Date): boolean {
    return (
        date1.getFullYear() === date2.getFullYear() &&
        date1.getMonth() === date2.getMonth() &&
        date1.getDate() === date2.getDate()
    );
}

/**
 * Get time of day label
 */
export function getTimeOfDay(hour: number): string {
    if (hour >= 5 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 21) return 'evening';
    return 'night';
}

/**
 * Parse a time string (HH:MM) into hours and minutes
 */
export function parseTimeString(timeStr: string): { hours: number; minutes: number } {
    if (!timeStr || typeof timeStr !== 'string') {
        return { hours: 0, minutes: 0 };
    }
    const [hours, minutes] = timeStr.split(':').map(Number);
    return { hours: hours || 0, minutes: minutes || 0 };
}

/**
 * Format a timestamp as a full datetime string
 */
export function formatDateTime(timestamp: number): string {
    const date = new Date(timestamp);
    return `${formatDateShort(date)} at ${formatTime(date)}`;
}
