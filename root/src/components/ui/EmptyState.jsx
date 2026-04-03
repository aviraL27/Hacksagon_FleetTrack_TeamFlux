import React from 'react';
import { cn } from '../../utils/cn';

export default function EmptyState({
  action,
  className,
  description,
  icon = 'inbox',
  title,
}) {
  return (
    <div
      className={cn(
        'rounded-[28px] border border-dashed border-[var(--border-strong)] [background:var(--chart-shell-bg)] px-6 py-10 text-center [box-shadow:inset_0_1px_0_var(--surface-border-soft)]',
        className
      )}
    >
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] text-[var(--accent)]">
        <span className="material-symbols-outlined text-[26px]">{icon}</span>
      </div>
      <h3 className="mt-5 font-headline text-xl font-bold text-[var(--text)]">{title}</h3>
      {description ? <p className="mx-auto mt-2 max-w-md text-sm text-[var(--text-muted)]">{description}</p> : null}
      {action ? <div className="mt-6 flex justify-center">{action}</div> : null}
    </div>
  );
}
