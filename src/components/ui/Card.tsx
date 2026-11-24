import React from 'react';
import { cn } from '@/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  hoverable?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, className, hoverable = false, ...props }) => {
  return (
    <div
      className={cn(
        'bg-white dark:bg-hub-card-dark rounded-hub border border-hub-border dark:border-hub-border-dark shadow-hub p-5 md:p-6 transition-all duration-200',
        hoverable && 'hover:shadow-hub-lg hover:border-hub-primary/30',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
