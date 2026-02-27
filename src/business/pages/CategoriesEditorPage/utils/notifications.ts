import { toast } from 'sonner';

export class ErrorHandler {
  static handle(
    error: unknown,
    defaultMessage: string = 'Произошла ошибка'
  ): string {
    if (error instanceof Error) {
      return error.message;
    }
    return defaultMessage;
  }

  static showError(
    error: unknown,
    defaultMessage: string = 'Операция не выполнена'
  ): void {
    const message = this.handle(error, defaultMessage);
    toast.error(message, { id: 'categories-editor-toast', duration: 2200 });
  }

  static showSuccess(message: string): void {
    toast.success(message, { id: 'categories-editor-toast', duration: 1800 });
  }
}
