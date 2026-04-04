import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../../utils/cn';

const sizeClasses = {
  sm: 'max-w-lg',
  md: 'max-w-2xl',
  lg: 'max-w-4xl',
};

export default function Modal({
  children,
  className,
  description,
  footer,
  onClose,
  open,
  size = 'md',
  title,
}) {
  useEffect(() => {
    if (!open || typeof document === 'undefined') {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose?.();
      }
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose, open]);

  if (!open || typeof document === 'undefined') {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-[1200] flex items-center justify-center p-4 sm:p-6">
      <button
        type="button"
        aria-label="Close modal"
        className="absolute inset-0 bg-[rgba(8,12,18,0.72)] backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          'relative z-10 flex max-h-[calc(100vh-2rem)] w-full flex-col overflow-hidden rounded-3xl border border-[var(--border-strong)] [background:var(--card-bg)] shadow-[0_32px_80px_rgba(0,0,0,0.32)]',
          sizeClasses[size],
          className
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-[var(--border)] px-6 py-5">
          <div>
            <h3 className="font-headline text-xl font-bold text-[var(--text)]">{title}</h3>
            {description ? <p className="font-subheading mt-1 text-sm text-[var(--text-muted)]">{description}</p> : null}
          </div>
          <button
            type="button"
            aria-label="Close modal"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--surface-subtle)] text-[var(--text-muted)] transition duration-200 hover:bg-[var(--surface-hover)] hover:text-[var(--text)]"
            onClick={onClose}
          >
            <span className="material-symbols-outlined text-base">close</span>
          </button>
        </div>
        <div className="overflow-y-auto px-6 py-5">{children}</div>
        {footer ? <div className="border-t border-[var(--border)] px-6 py-4">{footer}</div> : null}
      </div>
    </div>,
    document.body
  );
}
