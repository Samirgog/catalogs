import { toast } from 'sonner';
import { showRequestError } from '@/business/utils/request-feedback';

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
    showRequestError(message, {
      retryLabel: 'Обновить',
      onRetry: () => window.location.reload(),
    });
  }

  static showSuccess(message: string): void {
    toast.success(message, { id: 'categories-editor-toast', duration: 1800 });
  }
}
