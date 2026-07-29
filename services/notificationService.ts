/**
 * Notification Service - Best Practices Implementation
 * 
 * Android Notification Best Practices Applied:
 * 1. Separate channels for different notification types
 * 2. Proper importance levels (4 for mood, 5 for medication)
 * 3. allowWhileIdle for Doze mode compatibility
 * 4. Unique numeric IDs (Capacitor requires numbers, not strings)
 * 5. Proper cleanup before scheduling new notifications
 * 6. Using ScheduleEvery enum values correctly
 */

import { LocalNotifications, ActionPerformed, Channel, ScheduleEvery, LocalNotificationSchema } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';

// Supportive medication message for notification body
function getSupportiveMedicationMessage(): string {
  const messages = [
    "Time to take your meds! 💊",
    "Gentle nudge: medication time.",
    "Stay on track – take your medication!",
    "You got this! Meds help you shine.",
    "A little reminder for your well-being."
  ];
  return messages[Math.floor(Math.random() * messages.length)];
}

// Generate unique numeric ID from time string (HH:MM)
function timeToNotificationId(time: string, baseId: number): number {
  const [hours, minutes] = time.split(':').map(Number);
  return baseId + hours * 100 + minutes;
}

// Android: Setup channels for mood and medication
const setupChannels = async (): Promise<void> => {
  if (Capacitor.getPlatform() === 'android') {
    const channels: Channel[] = [
      {
        id: 'mood-log',
        name: 'Mood Log Reminders',
        description: 'Reminders to log your mood',
        importance: 4, // HIGH - makes sound and appears in status bar
        sound: 'default',
        visibility: 1, // PUBLIC
        vibration: true,
      },
      {
        id: 'medication',
        name: 'Medication Reminders',
        description: 'Reminders to take your medication',
        importance: 5, // MAX - persistent and makes sound
        sound: 'default', // Use default until custom sound is added
        visibility: 1, // PUBLIC
        vibration: true,
      }
    ];

    for (const channel of channels) {
      try {
        await LocalNotifications.createChannel(channel);
      } catch (error) {
        console.warn(`Channel ${channel.id} may already exist:`, error);
      }
    }
  }
};

/**
 * Request notification permissions
 * Best practice: Only request when user takes an action that requires notifications
 */
export const initializeNotifications = async (): Promise<boolean> => {
  try {
    await setupChannels();
    const permission = await LocalNotifications.requestPermissions();

    if (permission.display !== 'granted') {
      console.warn('Notification permission not granted');
      return false;
    }

    return true;
  } catch (error) {
    console.error('Failed to request notification permissions:', error);
    return false;
  }
};

/**
 * Get all pending notifications for cleanup
 */
const getPendingMoodNotificationIds = async (): Promise<number[]> => {
  try {
    const pending = await LocalNotifications.getPending();
    return pending.notifications
      .filter(n => n.id >= 2000 && n.id < 3000)
      .map(n => n.id);
  } catch (error) {
    return [];
  }
};

const getPendingMedicationNotificationIds = async (): Promise<number[]> => {
  try {
    const pending = await LocalNotifications.getPending();
    return pending.notifications
      .filter(n => n.id >= 3000 && n.id < 4000)
      .map(n => n.id);
  } catch (error) {
    return [];
  }
};

/**
 * Schedule mood log reminders
 * Best practices:
 * - Uses numeric IDs (2000-2999 range)
 * - Uses ScheduleEvery.Day enum
 * - Cleans up old notifications first
 * - Sets allowWhileIdle for Doze mode
 */
export const scheduleMoodNotifications = async (
  times: string[],
  message = "Quick check-in? 😊"
): Promise<void> => {
  try {
    // Clean up existing mood notifications
    const existingIds = await getPendingMoodNotificationIds();
    if (existingIds.length > 0) {
      await LocalNotifications.cancel({
        notifications: existingIds.map(id => ({ id }))
      });
    }

    if (times.length === 0) return;

    const notifications: LocalNotificationSchema[] = times.map((time, index) => {
      const [hours, minutes] = time.split(':').map(Number);
      const now = new Date();
      const scheduledTime = new Date();
      scheduledTime.setHours(hours, minutes, 0, 0);

      // If time has passed today, schedule for tomorrow
      if (scheduledTime <= now) {
        scheduledTime.setDate(scheduledTime.getDate() + 1);
      }

      return {
        id: 2000 + index,
        title: 'VibeCheck Check-in 🌙',
        body: message,
        channelId: 'mood-log',
        schedule: {
          at: scheduledTime,
          allowWhileIdle: true,
          repeats: true,
          every: 'day' as ScheduleEvery,
        },
        actionTypeId: 'mood-log-actions',
        smallIcon: 'ic_stat_notification',
        sound: 'default',
      };
    });

    await LocalNotifications.schedule({ notifications });
    console.log(`Scheduled ${notifications.length} mood notifications`);
  } catch (error) {
    console.error('Failed to schedule mood notifications:', error);
  }
};

/**
 * Schedule medication notifications
 * Best practices:
 * - Uses numeric IDs (3000-3999 range)
 * - Higher importance for critical reminders
 * - Action buttons for quick response
 */
export const scheduleMedicationNotification = async (
  times: string[] | string
): Promise<void> => {
  try {
    const medTimes = Array.isArray(times) ? times : [times];

    // Clean up existing medication notifications
    const existingIds = await getPendingMedicationNotificationIds();
    if (existingIds.length > 0) {
      await LocalNotifications.cancel({
        notifications: existingIds.map(id => ({ id }))
      });
    }

    if (medTimes.length === 0 || (medTimes.length === 1 && !medTimes[0])) return;

    const notifications: LocalNotificationSchema[] = medTimes
      .filter(time => time && time.includes(':'))
      .map((time, index) => {
        const [hour, minute] = time.split(':').map(Number);
        const now = new Date();
        const scheduledTime = new Date();
        scheduledTime.setHours(hour, minute, 0, 0);

        if (scheduledTime <= now) {
          scheduledTime.setDate(scheduledTime.getDate() + 1);
        }

        return {
          id: 3000 + index,
          title: 'Medication Reminder 💊',
          body: getSupportiveMedicationMessage(),
          channelId: 'medication',
          schedule: {
            at: scheduledTime,
            allowWhileIdle: true,
            repeats: true,
            every: 'day' as ScheduleEvery,
          },
          actionTypeId: 'medication-actions',
          smallIcon: 'ic_stat_notification',
          sound: 'default',
          extra: { type: 'medication' }
        };
      });

    if (notifications.length > 0) {
      await LocalNotifications.schedule({ notifications });
      console.log(`Scheduled ${notifications.length} medication notifications`);
    }
  } catch (error) {
    console.error('Failed to schedule medication notification:', error);
  }
};

/**
 * Cancel all medication notifications
 */
export const cancelMedicationNotifications = async (): Promise<void> => {
  try {
    const existingIds = await getPendingMedicationNotificationIds();
    if (existingIds.length > 0) {
      await LocalNotifications.cancel({
        notifications: existingIds.map(id => ({ id }))
      });
    }
  } catch (error) {
    console.error('Failed to cancel medication notifications:', error);
  }
};

/**
 * Register notification action buttons
 * Best practice: Register once on app start
 */
import { MOODS } from '../constants';
import { saveEntry } from './storage';

export const registerNotificationActions = async (): Promise<void> => {
  if (Capacitor.getPlatform() === 'web') return;
  try {
    await LocalNotifications.registerActionTypes({
      types: [
        {
          id: 'mood-log-actions',
          actions: [
            { id: 'log-mood', title: 'Log Mood' },
            { id: 'snooze', title: 'Snooze 15m' }
          ]
        },
        {
          id: 'medication-actions',
          actions: [
            { id: 'taken', title: '✓ Taken' },
            { id: 'snooze', title: 'Snooze 15m' }
          ]
        }
      ]
    });
  } catch (error) {
    console.error('Failed to register notification actions:', error);
  }
};

/**
 * Log mood from notification quick action
 */
export const logMoodFromNotification = async (moodValue: number): Promise<void> => {
  const mood = MOODS.find(m => m.value === moodValue);
  if (!mood) return;

  const entry = {
    id: crypto.randomUUID(),
    timestamp: Date.now(),
    mood: mood.value,
    tags: [],
    note: '[Quick log from notification]'
  };

  await saveEntry(entry);
  console.log('Mood logged from notification:', mood.label);
};

/**
 * Handle notification action callbacks
 */
export const handleNotificationAction = (
  callback: (actionId: string, notification: any) => void
): void => {
  LocalNotifications.addListener(
    'localNotificationActionPerformed',
    (event: ActionPerformed) => {
      callback(event.actionId, event.notification);
    }
  );
};

/**
 * Snooze notification by rescheduling
 */
export const snoozeNotification = async (
  id: number,
  minutes = 15
): Promise<void> => {
  const snoozeTime = new Date();
  snoozeTime.setMinutes(snoozeTime.getMinutes() + minutes);

  await LocalNotifications.schedule({
    notifications: [{
      id: id + 100, // Use different ID for snooze
      title: 'Reminder',
      body: 'Just a gentle nudge! 😊',
      channelId: 'mood-log',
      schedule: {
        at: snoozeTime,
        allowWhileIdle: true,
        repeats: false,
      },
      smallIcon: 'ic_stat_notification',
      sound: 'default',
    }]
  });

  console.log(`Snoozed notification for ${minutes} minutes`);
};

/**
 * Cancel all notifications
 */
export const cancelAllNotifications = async (): Promise<void> => {
  try {
    const pending = await LocalNotifications.getPending();
    if (pending.notifications.length > 0) {
      await LocalNotifications.cancel({
        notifications: pending.notifications.map(n => ({ id: n.id }))
      });
    }
    console.log('Cancelled all notifications');
  } catch (error) {
    console.error('Failed to cancel notifications:', error);
  }
};

/**
 * Initialize notifications on app start
 * Best practice: Re-schedule notifications on every app start to ensure they persist
 */
export const initializeNotificationsOnAppStart = async (
  moodTimes: string[],
  medTimes?: string[]
): Promise<void> => {
  try {
    await setupChannels();
    await registerNotificationActions();

    // Re-schedule active notifications
    if (moodTimes && moodTimes.length > 0) {
      await scheduleMoodNotifications(moodTimes);
    }

    if (medTimes && medTimes.length > 0) {
      await scheduleMedicationNotification(medTimes);
    }

    console.log('Notifications initialized on app start');
  } catch (error) {
    console.error('Failed to initialize notifications on app start:', error);
  }
};

/**
 * Check if notifications are enabled
 */
export const areNotificationsEnabled = async (): Promise<boolean> => {
  try {
    const status = await LocalNotifications.checkPermissions();
    return status.display === 'granted';
  } catch (error) {
    return false;
  }
};

/**
 * Get count of pending notifications
 */
export const getPendingNotificationCount = async (): Promise<number> => {
  try {
    const pending = await LocalNotifications.getPending();
    return pending.notifications.length;
  } catch (error) {
    return 0;
  }
};
