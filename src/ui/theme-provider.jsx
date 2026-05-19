import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

const ThemeCtx = createContext(null);

function applyTheme(t) {
  const root = document.documentElement;
  const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const isDark = t === 'dark' || (t === 'system' && systemDark);
  root.classList.toggle('dark', isDark);
}

export function ThemeProvider({ defaultTheme = 'system', children }) {
  const [theme, setThemeState] = useState(defaultTheme);

  useEffect(() => {
    const stored = localStorage.getItem('theme') || defaultTheme;
    setThemeState(stored);
    applyTheme(stored);

    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => {
      const current = localStorage.getItem('theme') || 'system';
      if (current === 'system') applyTheme('system');
    };
    mq.addEventListener?.('change', onChange);
    return () => mq.removeEventListener?.('change', onChange);
  }, [defaultTheme]);

  const setTheme = (t) => {
    localStorage.setItem('theme', t);
    setThemeState(t);
    applyTheme(t);
  };

  const value = useMemo(() => ({ theme, setTheme }), [theme]);
  return <ThemeCtx.Provider value={value}>{children}</ThemeCtx.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeCtx);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
