import React from 'react';
import { cn } from '@/utils';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'primary' | 'positive' | 'negative' | 'info' | 'warning' | 'neutral' | 'outline';
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'sm',
  className,
}) => {
  const variants = {
    primary: 'bg-hub-primary/10 text-hub-primary dark:bg-hub-primary/20',
    positive: 'bg-hub-positive/10 text-hub-positive dark:bg-hub-positive/20',
    negative: 'bg-hub-negative/10 text-hub-negative dark:bg-hub-negative/20',
    info: 'bg-hub-info/10 text-hub-info dark:bg-hub-info/20',
    warning: 'bg-hub-warning/10 text-hub-warning dark:bg-hub-warning/20',
    neutral: 'bg-gray-100 text-gray-700 dark:bg-hub-card-subtle-dark dark:text-gray-300',
    outline: 'border border-hub-border dark:border-hub-border-dark text-hub-muted',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-xs font-medium rounded-md',
    md: 'px-2.5 py-1 text-xs font-semibold rounded-lg',
  };

  return (
    <span className={cn('inline-flex items-center gap-1 uppercase tracking-wider', variants[variant], sizes[size], className)}>
      {children}
    </span>
  );
};
