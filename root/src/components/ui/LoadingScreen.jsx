import React from 'react';

export default function LoadingScreen({ label = 'Preparing your workspace' }) {
  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-sm rounded-[32px] border border-[var(--border)] [background:var(--card-bg)] p-8 text-center shadow-[var(--shadow-soft)]">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[22px] border border-[var(--accent-border)] bg-[var(--accent-soft)] text-[var(--accent)]">
          <span className="material-symbols-outlined animate-spin text-[28px]">progress_activity</span>
        </div>
        <p className="font-subheading mt-5 text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--text-dim)]">FleetTrack</p>
        <h1 className="mt-3 font-headline text-2xl font-bold text-[var(--text)]">{label}</h1>
        <p className="mt-2 text-sm text-[var(--text-muted)]">Loading your latest fleet data and access state.</p>
      </div>
    </div>
  );
}
