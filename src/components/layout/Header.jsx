import React from 'react';
import { Menu, LogOut } from 'lucide-react';
import { useAuth } from '../../auth/AuthContext';
import { AppHeader, useSidebar } from '@santonastaso/shared';

export function Header() {
  const { user, signOut } = useAuth();
  const { toggle } = useSidebar();

  return (
    <AppHeader
      title="Tracc"
      user={{
        name: user?.email?.split('@')[0] || 'User',
        email: user?.email,
        avatar: user?.avatar_url
      }}
      onLogout={() => signOut()}
      onRefresh={() => window.location.reload()}
      customMenuItems={
        <button
          onClick={toggle}
          className="flex items-center gap-2 px-2 py-1.5 text-sm cursor-pointer hover:bg-accent rounded-sm"
        >
          <Menu className="h-4 w-4" />
          Toggle Sidebar
        </button>
      }
    />
  );
}
