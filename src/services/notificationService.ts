import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';

export type NotificationType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  message: string;
  type: NotificationType;
  duration?: number;
}

/**
 * Service for managing both in-app toasts and native notifications
 */
export class NotificationService {
  private static toastListeners: ((toast: Toast) => void)[] = [];
  private static toastId = 0;

  /**
   * Subscribe to toast notifications
   */
  static subscribe(listener: (toast: Toast) => void): () => void {
    this.toastListeners.push(listener);
    return () => {
      this.toastListeners = this.toastListeners.filter((l) => l !== listener);
    };
  }

  /**
   * Show an in-app toast notification
   */
  static showToast(message: string, type: NotificationType = 'info', duration = 3000) {
    const id = `toast-${this.toastId++}`;
    const toast: Toast = { id, message, type, duration };
    this.toastListeners.forEach((listener) => listener(toast));
  }

  /**
   * Show a success toast
   */
  static success(message: string, duration?: number) {
    this.showToast(message, 'success', duration);
  }

  /**
   * Show an error toast
   */
  static error(message: string, duration?: number) {
    this.showToast(message, 'error', duration || 5000);
  }

  /**
   * Show an info toast
   */
  static info(message: string, duration?: number) {
    this.showToast(message, 'info', duration);
  }

  /**
   * Show a warning toast
   */
  static warning(message: string, duration?: number) {
    this.showToast(message, 'warning', duration);
  }

  /**
   * Request notification permissions (iOS/Android)
   */
  static async requestPermissions() {
    if (!Capacitor.isNativePlatform()) {
      return { display: 'granted' };
    }

    try {
      const result = await LocalNotifications.requestPermissions();
      return result;
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      return { display: 'denied' };
    }
  }

  /**
   * Schedule a local notification
   */
  static async scheduleNotification(options: {
    title: string;
    body: string;
    id?: number;
    schedule?: {
      at?: Date;
      repeats?: boolean;
      every?: 'minute' | 'hour' | 'day' | 'week' | 'month' | 'year';
    };
    smallIcon?: string;
    largeBody?: string;
  }) {
    if (!Capacitor.isNativePlatform()) {
      // For web, just show a toast
      this.showToast(`${options.title}: ${options.body}`, 'info');
      return { notifications: [] };
    }

    try {
      const result = await LocalNotifications.schedule({
        notifications: [
          {
            id: options.id || Math.floor(Math.random() * 10000),
            title: options.title,
            body: options.body,
            schedule: options.schedule,
            smallIcon: options.smallIcon,
            largeBody: options.largeBody,
          },
        ],
      });
      console.log('Notification scheduled:', result);
      return result;
    } catch (error) {
      console.error('Error scheduling notification:', error);
      // Fallback to toast on error
      this.showToast(`${options.title}: ${options.body}`, 'info');
      return { notifications: [] };
    }
  }

  /**
   * Cancel a scheduled notification
   */
  static async cancelNotification(id: number) {
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    try {
      await LocalNotifications.cancel({ notifications: [{ id }] });
    } catch (error) {
      console.error('Error canceling notification:', error);
    }
  }

  /**
   * Cancel all notifications
   */
  static async cancelAllNotifications() {
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    try {
      await LocalNotifications.cancelAll();
    } catch (error) {
      console.error('Error canceling all notifications:', error);
    }
  }

  /**
   * Get pending notifications
   */
  static async getPendingNotifications() {
    if (!Capacitor.isNativePlatform()) {
      return { notifications: [] };
    }

    try {
      const result = await LocalNotifications.getPending();
      return result;
    } catch (error) {
      console.error('Error getting pending notifications:', error);
      return { notifications: [] };
    }
  }

  /**
   * Send a reminder notification for daily mood check-in
   */
  static async scheduleMoodReminder(hour: number = 20, minute: number = 0) {
    const tomorrow = new Date();
    tomorrow.setHours(hour, minute, 0, 0);

    return this.scheduleNotification({
      title: '🌙 Time for your daily check-in',
      body: 'How are you feeling today? Tap to log your mood.',
      id: 1001,
      schedule: {
        at: tomorrow,
        repeats: true,
        every: 'day',
      },
    });
  }

  /**
   * Send a milestone achievement notification
   */
  static async notifyMilestone(milestoneName: string) {
    this.success(`🎉 Milestone Unlocked: ${milestoneName}!`, 5000);

    return this.scheduleNotification({
      title: '🎉 Achievement Unlocked!',
      body: `Congratulations! You've reached: ${milestoneName}`,
      schedule: { at: new Date() },
    });
  }

  /**
   * Send a journaling reminder notification
   */
  static async scheduleJournalReminder(hour: number = 21, minute: number = 0) {
    const tomorrow = new Date();
    tomorrow.setHours(hour, minute, 0, 0);

    return this.scheduleNotification({
      title: '📝 Time to journal',
      body: 'Reflect on your day. Write down your thoughts and feelings.',
      id: 1002,
      schedule: {
        at: tomorrow,
        repeats: true,
        every: 'day',
      },
    });
  }

  /**
   * Send an encouragement message notification
   */
  static async sendEncouragementMessage(message: string) {
    this.showToast(message, 'info', 5000);

    return this.scheduleNotification({
      title: '💪 Daily Encouragement',
      body: message,
      schedule: { at: new Date() },
    });
  }
}
