import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { cn } from '../../utils/cn';

export default function ThemeToggle({ className }) {
  const { isLightTheme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      aria-label={isLightTheme ? 'Switch to dark theme' : 'Switch to light smoky theme'}
      aria-pressed={isLightTheme}
      className={cn(
        'group inline-flex h-12 w-12 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface-elevated)] text-[var(--text)] shadow-[var(--shadow-soft)] backdrop-blur transition duration-200 hover:-translate-y-0.5 hover:border-[var(--border-strong)] hover:bg-[var(--surface-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-ring)] focus:ring-offset-2 focus:ring-offset-[var(--app-bg)]',
        className
      )}
      onClick={toggleTheme}
    >
      <span className="sr-only">{isLightTheme ? 'Enable dark mode' : 'Enable light mode'}</span>
      <span
        className={cn(
          'material-symbols-outlined text-[20px] transition duration-200 group-hover:scale-110',
          isLightTheme ? 'text-[var(--accent)]' : 'text-[var(--text)]'
        )}
      >
        {isLightTheme ? 'dark_mode' : 'light_mode'}
      </span>
    </button>
  );
}
