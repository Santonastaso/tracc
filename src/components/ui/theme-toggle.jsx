import React from 'react'
import { Moon, Sun } from 'lucide-react'
import { Button } from './button'
import { useTheme } from '../../hooks/useTheme'

export function ThemeToggle() {
  const { toggleTheme, isDark } = useTheme()

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className="h-9 w-9"
    >
      {isDark ? (
        <Sun className="h-4 w-4" />
      ) : (
        <Moon className="h-4 w-4" />
      )}
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}
