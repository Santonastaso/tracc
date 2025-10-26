import React from 'react';
import { Menu, LogOut } from 'lucide-react';
import { useAuth } from '../../auth/AuthContext';
import { useSidebar } from '../../hooks/useSidebar';
import { ThemeSwitch, Button } from '@andrea/crm-ui';

export function Header() {
  const { user, signOut } = useAuth();
  const { toggle } = useSidebar();

  return (
    <header className="bg-secondary shadow-sm border-b border-border">
      <div className="flex items-center justify-between px-4 py-2">
        <div className="flex items-center">
          <button
            onClick={toggle}
            className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent focus:outline-none focus:ring-2 focus:ring-inset focus:ring-ring"
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>

        <div className="flex items-center space-x-4">
          <ThemeSwitch />
          <span className="text-sm text-muted-foreground">
            {user?.email?.split('@')[0] || 'User'}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => signOut()}
            className="flex items-center gap-2"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>
      </div>
    </header>
  );
}
