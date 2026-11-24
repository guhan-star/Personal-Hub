import React from 'react';
import { cn } from '@/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helperText, leftIcon, id, ...props }, ref) => {
    const inputId = id || props.name;

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-semibold text-hub-muted dark:text-hub-muted-dark uppercase tracking-wider mb-1.5">
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-hub-muted">
              {leftIcon}
            </div>
          )}
          <input
            id={inputId}
            ref={ref}
            className={cn(
              'w-full px-3.5 py-2.5 rounded-hub-sm bg-hub-bg dark:bg-hub-card-subtle-dark border border-hub-border dark:border-hub-border-dark text-hub-text dark:text-hub-text-dark placeholder:text-hub-muted/70 text-sm focus:outline-none focus:ring-2 focus:ring-hub-primary/30 focus:border-hub-primary transition-all duration-200',
              leftIcon && 'pl-10',
              error && 'border-hub-negative focus:ring-hub-negative/30 focus:border-hub-negative',
              className
            )}
            {...props}
          />
        </div>
        {error && <p className="mt-1 text-xs text-hub-negative">{error}</p>}
        {helperText && !error && <p className="mt-1 text-xs text-hub-muted">{helperText}</p>}
      </div>
    );
  }
);
Input.displayName = 'Input';
