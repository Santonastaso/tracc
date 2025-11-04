import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { ThemeSwitch, Button } from '@santonastaso/shared';
import { RotateCw, LogOut } from 'lucide-react';

export function Header() {
  const { user, signOut } = useAuth();

  return (
    <header className="bg-secondary border-b border-border">
      <div className="px-4">
        <div className="flex justify-between items-center flex-1 h-12">
          {/* Left Section: Logo + Title */}
          <Link
            to="/"
            className="flex items-center gap-2 text-secondary-foreground no-underline"
          >
            <img className="h-6" src="/trace.svg" alt="TRACC" />
            <h1 className="text-xl font-semibold">TRACC</h1>
          </Link>

          {/* Right Section: ThemeSwitch + RefreshButton + UserMenu */}
          <div className="flex items-center gap-2">
            <ThemeSwitch />
            <Button
              onClick={() => window.location.reload()}
              variant="ghost"
              size="icon"
              className="hidden sm:inline-flex"
            >
              <RotateCw className="h-4 w-4" />
            </Button>
            <Button
              onClick={() => signOut()}
              variant="ghost"
              size="icon"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
