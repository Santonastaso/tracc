import React, { useEffect } from 'react'
import { useTheme } from '../hooks/useTheme'

export function ThemeProvider({ children }) {
  const { theme } = useTheme()

  useEffect(() => {
    const root = window.document.documentElement
    root.classList.remove('light', 'dark')
    root.classList.add(theme)
  }, [theme])

  return <>{children}</>
}

