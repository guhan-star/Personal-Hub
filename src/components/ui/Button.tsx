import React from 'react';
import { cn } from '@/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'destructive' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading = false, children, disabled, ...props }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center font-medium rounded-hub-sm transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none focus:outline-none focus:ring-2 focus:ring-hub-primary/30';

    const variants = {
      primary: 'bg-hub-primary hover:bg-hub-secondary text-white shadow-sm',
      secondary: 'bg-gray-100 hover:bg-gray-200 dark:bg-hub-card-subtle-dark dark:hover:bg-gray-700 text-hub-text dark:text-hub-text-dark',
      destructive: 'bg-hub-negative hover:bg-red-600 text-white shadow-sm',
      outline: 'bg-transparent border border-hub-border dark:border-hub-border-dark hover:bg-gray-50 dark:hover:bg-hub-card-subtle-dark text-hub-text dark:text-hub-text-dark',
      ghost: 'bg-transparent hover:bg-gray-100 dark:hover:bg-hub-card-subtle-dark text-hub-text dark:text-hub-text-dark',
    };

    const sizes = {
      sm: 'px-3 py-1.5 text-xs gap-1.5',
      md: 'px-4 py-2 text-sm gap-2',
      lg: 'px-5 py-2.5 text-base gap-2.5',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {isLoading && (
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        )}
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';
