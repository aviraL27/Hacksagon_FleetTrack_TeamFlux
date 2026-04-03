import React from 'react';
import { cn } from '../../utils/cn';

export function TableWrap({ children, className, ...props }) {
  return (
    <div
      className={cn(
        'overflow-x-auto rounded-3xl border border-[var(--border)] bg-[var(--surface-overlay)] [box-shadow:inset_0_1px_0_var(--surface-border-soft)]',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export default function Table({ children, className, ...props }) {
  return (
    <table className={cn('w-full border-collapse text-left', className)} {...props}>
      {children}
    </table>
  );
}

export function TableHeader({ children, className, ...props }) {
  return (
    <thead className={cn('bg-[var(--surface-subtle)]', className)} {...props}>
      {children}
    </thead>
  );
}

export function TableBody({ children, className, ...props }) {
  return (
    <tbody className={cn('divide-y divide-[var(--border)]', className)} {...props}>
      {children}
    </tbody>
  );
}

export function TableRow({ children, className, ...props }) {
  return (
    <tr className={cn('transition duration-200 hover:bg-[var(--surface-muted)]', className)} {...props}>
      {children}
    </tr>
  );
}

export function TableHead({ children, className, ...props }) {
  return (
    <th
      className={cn(
        'font-subheading px-5 py-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--text-dim)]',
        className
      )}
      {...props}
    >
      {children}
    </th>
  );
}

export function TableCell({ children, className, ...props }) {
  return (
    <td className={cn('px-5 py-4 align-middle text-sm leading-6 text-[var(--text)]', className)} {...props}>
      {children}
    </td>
  );
}
