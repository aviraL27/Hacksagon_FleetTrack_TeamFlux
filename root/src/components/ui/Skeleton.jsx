import React from 'react';
import { cn } from '../../utils/cn';

export default function Skeleton({ className, ...props }) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-2xl [background:var(--skeleton-sheen)] bg-[length:200%_100%]',
        className
      )}
      {...props}
    />
  );
}
