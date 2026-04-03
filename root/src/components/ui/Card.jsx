import React from 'react';
import { cn } from '../../utils/cn';

export default function Card({ children, className, ...props }) {
  return (
    <section
      className={cn(
        'rounded-3xl border border-[var(--border)] [background:var(--card-bg)] shadow-[var(--shadow-soft)] transition duration-300 hover:border-[var(--border-strong)]',
        className
      )}
      {...props}
    >
      {children}
    </section>
  );
}

export function CardHeader({ children, className, ...props }) {
  return (
    <div className={cn('flex items-start justify-between gap-4 p-6 pb-5', className)} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className, ...props }) {
  return (
    <h3 className={cn('font-headline text-lg font-bold text-[var(--text)]', className)} {...props}>
      {children}
    </h3>
  );
}

export function CardDescription({ children, className, ...props }) {
  return (
    <p className={cn('font-subheading mt-1 text-sm leading-6 text-[var(--text-muted)]', className)} {...props}>
      {children}
    </p>
  );
}

export function CardContent({ children, className, ...props }) {
  return (
    <div className={cn('px-6 pb-6', className)} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({ children, className, ...props }) {
  return (
    <div
      className={cn('flex items-center justify-between gap-4 border-t border-[var(--border)] px-6 py-4', className)}
      {...props}
    >
      {children}
    </div>
  );
}
