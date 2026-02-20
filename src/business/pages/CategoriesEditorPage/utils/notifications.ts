export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  duration?: number;
}

export class NotificationManager {
  private static listeners: Array<(notifications: Notification[]) => void> = [];
  private static notifications: Notification[] = [];

  static subscribe(listener: (notifications: Notification[]) => void): () => void {
    this.listeners.push(listener);
    
    // Send current notifications to new listener
    listener(this.notifications);

    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  static show(type: NotificationType, message: string, duration: number = 3000): void {
    const id = Math.random().toString(36).substr(2, 9);
    const notification: Notification = { id, type, message, duration };

    this.notifications = [...this.notifications, notification];
    this.notifyListeners();

    // Auto-remove after duration
    if (duration > 0) {
      setTimeout(() => {
        this.remove(id);
      }, duration);
    }
  }

  static success(message: string, duration?: number): void {
    this.show('success', message, duration);
  }

  static error(message: string, duration?: number): void {
    this.show('error', message, duration);
  }

  static warning(message: string, duration?: number): void {
    this.show('warning', message, duration);
  }

  static info(message: string, duration?: number): void {
    this.show('info', message, duration);
  }

  static remove(id: string): void {
    this.notifications = this.notifications.filter(n => n.id !== id);
    this.notifyListeners();
  }

  static clearAll(): void {
    this.notifications = [];
    this.notifyListeners();
  }

  private static notifyListeners(): void {
    this.listeners.forEach(listener => listener([...this.notifications]));
  }
}

// Error handler utility
export class ErrorHandler {
  static handle(error: unknown, defaultMessage: string = 'An error occurred'): string {
    if (error instanceof Error) {
      console.error('Handled error:', error);
      return error.message;
    }
    
    console.error('Unknown error:', error);
    return defaultMessage;
  }

  static showError(error: unknown, defaultMessage: string = 'Operation failed'): void {
    const message = this.handle(error, defaultMessage);
    toast.error(message);
  }

  static showSuccess(message: string): void {
    toast.success(message);
  }
}
import { toast } from 'sonner';
