import React from 'react';
import { Button } from './Button';

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
}) => {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 sm:p-12 border-2 border-dashed border-hub-border dark:border-hub-border-dark rounded-hub bg-hub-bg/50 dark:bg-hub-card-dark/40">
      <div className="w-14 h-14 rounded-2xl bg-hub-primary/10 dark:bg-hub-primary/20 text-hub-primary flex items-center justify-center mb-4">
        {icon}
      </div>
      <h4 className="text-base font-semibold text-hub-text dark:text-hub-text-dark mb-1">{title}</h4>
      <p className="text-sm text-hub-muted dark:text-hub-muted-dark max-w-sm mb-5">{description}</p>
      {actionLabel && onAction && (
        <Button onClick={onAction} size="sm">
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
