import React from 'react';
import { cn } from '@/utils';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: SelectOption[];
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, options, id, ...props }, ref) => {
    const selectId = id || props.name;

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={selectId} className="block text-xs font-semibold text-hub-muted dark:text-hub-muted-dark uppercase tracking-wider mb-1.5">
            {label}
          </label>
        )}
        <select
          id={selectId}
          ref={ref}
          className={cn(
            'w-full px-3.5 py-2.5 rounded-hub-sm bg-hub-bg dark:bg-hub-card-subtle-dark border border-hub-border dark:border-hub-border-dark text-hub-text dark:text-hub-text-dark text-sm focus:outline-none focus:ring-2 focus:ring-hub-primary/30 focus:border-hub-primary transition-all duration-200 cursor-pointer',
            error && 'border-hub-negative focus:ring-hub-negative/30',
            className
          )}
          {...props}
        >
          {options.map(opt => (
            <option key={opt.value} value={opt.value} className="bg-white dark:bg-hub-card-dark text-hub-text dark:text-hub-text-dark">
              {opt.label}
            </option>
          ))}
        </select>
        {error && <p className="mt-1 text-xs text-hub-negative">{error}</p>}
      </div>
    );
  }
);
Select.displayName = 'Select';
