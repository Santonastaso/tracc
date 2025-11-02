import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { SimpleHeader, useSidebar } from '@santonastaso/shared';
import { ThemeSwitch } from '../ThemeSwitch';

export function Header() {
  const { user, signOut } = useAuth();
  const { toggle } = useSidebar();

  return (
    <div className="flex items-center justify-between w-full">
      <SimpleHeader
        title="Tracc"
        user={{
          name: user?.email?.split('@')[0] || 'User',
          email: user?.email,
          avatar: user?.avatar_url
        }}
        onLogout={() => signOut()}
        onRefresh={() => window.location.reload()}
        onToggleSidebar={toggle}
        LinkComponent={Link}
      />
      <div className="flex items-center gap-2 mr-4">
        <ThemeSwitch />
      </div>
    </div>
  );
}
