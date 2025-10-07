import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useThemeStore = create(
  persist(
    (set) => ({
      theme: 'light',
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
  
  return {
    theme,
    setTheme,
    toggleTheme,
    isDark: theme === 'dark'
  }
}
