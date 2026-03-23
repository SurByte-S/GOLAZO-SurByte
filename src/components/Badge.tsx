import React from 'react';
import { cn } from '../lib/utils';

interface BadgeProps {
  variant?: 'success' | 'warning' | 'danger' | 'neutral';
  children: React.ReactNode;
  className?: string;
}

export function Badge({ variant = 'neutral', children, className }: BadgeProps) {
  const variants = {
    success: 'bg-sky-100 text-sky-700 border-sky-200',
    warning: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    danger: 'bg-red-100 text-red-700 border-red-200',
    neutral: 'bg-zinc-100 text-zinc-700 border-zinc-200',
  };

  return (
    <span className={cn('px-2.5 py-0.5 rounded-full text-xs font-semibold border', variants[variant], className)}>
      {children}
    </span>
  );
}
