import * as React from 'react';

import { cn } from '@/lib/utils';

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<'input'>>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex h-12 w-full rounded-xl border-0 bg-secondary/50 px-4 py-2 text-base shadow-inner backdrop-blur-sm transition-all placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
          // Mobile-specific styles
          'touch-manipulation caret-blue-500',
          '[&::-webkit-search-cancel-button]:appearance-none [&::-webkit-search-decoration]:appearance-none',
          className
        )}
        ref={ref}
        // Improve mobile accessibility
        inputMode={type === 'email' ? 'email' : type === 'tel' ? 'tel' : 'text'}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck="false"
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';

export { Input };
