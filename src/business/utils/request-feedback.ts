import { toast } from 'sonner';

export const showRequestError = (
  message: string,
  options?: {
    retryLabel?: string;
    onRetry?: () => void;
    id?: string;
  }
) => {
  toast.error(message, {
    id: options?.id,
    duration: 4000,
    action: options?.onRetry
      ? {
          label: options.retryLabel || 'Повторить',
          onClick: options.onRetry,
        }
      : undefined,
  });
};
