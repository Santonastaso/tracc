import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { useEffect } from 'react'

const useThemeStore = create(
  persist(
    (set) => ({
      theme: 'system',
      setTheme: (theme) => set({ theme }),
      toggleTheme: () => set((state) => ({ 
        theme: state.theme === 'light' ? 'dark' : 'light' 
      })),
    }),
    {
      name: 'theme-storage',
    }
  )
)

export const useTheme = () => {
  const { theme, setTheme, toggleTheme } = useThemeStore()
  
  // Get system theme preference
  const getSystemTheme = () => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    }
    return 'light'
  }

  // Get effective theme (system resolves to actual light/dark)
  const getEffectiveTheme = () => {
    return theme === 'system' ? getSystemTheme() : theme
  }

  // Apply theme to document
  useEffect(() => {
    const effectiveTheme = getEffectiveTheme()
    const root = document.documentElement
    
    if (effectiveTheme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
  }, [theme])

  // Listen for system theme changes when using system theme
  useEffect(() => {
    if (theme !== 'system') return

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = () => {
      const effectiveTheme = getSystemTheme()
      const root = document.documentElement
      
      if (effectiveTheme === 'dark') {
        root.classList.add('dark')
      } else {
        root.classList.remove('dark')
      }
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [theme])
  
  return {
    theme,
    setTheme,
    toggleTheme,
    isDark: getEffectiveTheme() === 'dark',
    effectiveTheme: getEffectiveTheme()
  }
}
