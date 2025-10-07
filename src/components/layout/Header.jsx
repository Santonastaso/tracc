import React from 'react';
import { Menu, Bell, Search, User } from 'lucide-react';
import { useAuth } from '../../auth/AuthContext';
import { useSidebar } from '../../hooks/useSidebar';
import { ThemeToggle } from '../ui/theme-toggle';

export function Header() {
  const { user, signOut } = useAuth();
  const { toggle } = useSidebar();

  return (
    <header className="bg-secondary shadow-sm border-b border-border">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center">
          <button
            onClick={toggle}
            className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent focus:outline-none focus:ring-2 focus:ring-inset focus:ring-ring"
          >
            <Menu className="h-6 w-6" />
          </button>
          <h1 className="ml-4 text-xl font-semibold text-secondary-foreground">
            Molino Rossetto - Sistema Tracciabilità Molino
          </h1>
        </div>

        <div className="flex items-center space-x-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-muted-foreground" />
            </div>
            <input
              type="text"
              placeholder="Search..."
              className="block w-full pl-10 pr-3 py-2 border border-input rounded-md leading-5 bg-background placeholder-muted-foreground focus:outline-none focus:placeholder-muted-foreground focus:ring-1 focus:ring-ring focus:border-ring sm:text-sm"
            />
          </div>

          <button className="p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-md">
            <Bell className="h-6 w-6" />
          </button>

          <ThemeToggle />

          <div className="relative">
            <button className="flex items-center space-x-2 p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-md">
              <User className="h-6 w-6" />
              <span className="text-sm font-medium text-secondary-foreground">
                {user?.email?.split('@')[0] || 'User'}
              </span>
            </button>
          </div>

          <button
            onClick={signOut}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}
