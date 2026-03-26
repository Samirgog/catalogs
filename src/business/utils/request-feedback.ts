import { toast } from 'sonner';

export const showRequestError = (
  message: string,
  options?: {
    retryLabel?: string;
    onRetry?: () => void;
  }
) => {
  toast.error(message, {
    duration: 4000,
    action: options?.onRetry
      ? {
          label: options.retryLabel || 'Повторить',
          onClick: options.onRetry,
        }
      : undefined,
  });
};
