import React from 'react';
import { useTheme } from './theme-provider';
import { cn } from '../lib/cn';

export function ThemeSwitch({ className }) {
  const { theme, setTheme } = useTheme();
  return (
    <div className="inline-flex gap-2 items-center">
      <select
        aria-label="Theme"
        value={theme}
        onChange={(e) => setTheme(e.target.value)}
        className={cn(
          "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input flex h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
          'w-36',
          className
        )}
      >
        <option value="light">Light</option>
        <option value="dark">Dark</option>
        <option value="system">System</option>
      </select>
    </div>
  );
}
