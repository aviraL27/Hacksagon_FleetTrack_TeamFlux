import React from 'react';
import { cn } from '../../utils/cn';

const controlClasses =
  'w-full rounded-xl border border-[var(--border)] bg-[var(--panel-muted)] px-3.5 py-3 text-sm text-[var(--text)] placeholder:text-[var(--text-dim)] shadow-[inset_0_1px_0_rgba(255,255,255,0.02)] transition duration-200 hover:border-[var(--border-strong)] focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-ring)]';

export function Field({ children, className, hint, label, htmlFor }) {
  return (
    <label className={cn('block space-y-2.5', className)} htmlFor={htmlFor}>
      {label ? (
        <span className="font-subheading block text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--text-dim)]">
          {label}
        </span>
      ) : null}
      {children}
      {hint ? <span className="block text-xs text-[var(--text-dim)]">{hint}</span> : null}
    </label>
  );
}

export default function Input({
  as = 'input',
  className,
  endAdornment,
  icon,
  rows = 4,
  suffix,
  ...props
}) {
  const Component = as;
  const hasAdornment = Boolean(icon || suffix || endAdornment);
  const isTextarea = as === 'textarea';
  const isSelect = as === 'select';

  const control = (
    <Component
      rows={isTextarea ? rows : undefined}
      className={cn(
        controlClasses,
        icon && 'pl-10',
        suffix && 'pr-20',
        endAdornment && 'pr-12',
        isTextarea && 'min-h-[120px] resize-none',
        isSelect && 'appearance-none pr-10',
        className
      )}
      {...props}
    />
  );

  if (!hasAdornment && !isSelect) {
    return control;
  }

  return (
    <div className="relative">
      {icon ? (
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-dim)] transition duration-200">
          {icon}
        </span>
      ) : null}
      {control}
      {suffix ? (
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-[var(--text-dim)]">
          {suffix}
        </span>
      ) : null}
      {endAdornment ? (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {endAdornment}
        </div>
      ) : null}
      {isSelect ? (
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-dim)]">
          <span className="material-symbols-outlined text-base">expand_more</span>
        </span>
      ) : null}
    </div>
  );
}
