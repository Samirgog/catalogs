import { Loader2 } from 'lucide-react';

type SpinnerProps = {
  className?: string;
};

export function Spinner({ className = 'h-6 w-6' }: SpinnerProps) {
  return <Loader2 className={`${className} animate-spin`} />;
}
