import React from 'react';
import { cn } from '../../utils/cn';

const variantClasses = {
  primary:
    'bg-[var(--accent)] text-[var(--accent-foreground)] shadow-[0_18px_40px_rgba(0,0,0,0.28)] hover:bg-[var(--accent-hover)]',
  secondary:
    'border border-[var(--border-strong)] bg-[var(--panel-elevated)] text-[var(--text)] hover:border-[var(--accent)] hover:bg-[var(--panel-soft)]',
  ghost:
    'bg-transparent text-[var(--text-muted)] hover:bg-[var(--surface-muted)] hover:text-[var(--text)]',
  danger:
    'bg-[rgba(255,123,114,0.14)] text-[var(--danger)] ring-1 ring-[rgba(255,123,114,0.2)] hover:bg-[rgba(255,123,114,0.2)]',
};

const sizeClasses = {
  sm: 'h-9 px-3.5 text-sm',
  md: 'h-11 px-4 text-sm',
  lg: 'h-12 px-5 text-sm',
  icon: 'h-10 w-10',
};

export default function Button({
  children,
  className,
  loading = false,
  size = 'md',
  type = 'button',
  variant = 'primary',
  ...props
}) {
  return (
    <button
      type={type}
      aria-busy={loading}
      className={cn(
        'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl font-semibold transition duration-200 hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-[var(--accent-ring)] focus:ring-offset-2 focus:ring-offset-[var(--app-bg)] disabled:pointer-events-none disabled:translate-y-0 disabled:opacity-50',
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? (
        <span className="material-symbols-outlined animate-spin text-base">progress_activity</span>
      ) : null}
      {children}
    </button>
  );
}
