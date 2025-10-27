import React from 'react';
import { useAuth } from '../../auth/AuthContext';
import { SimpleHeader, useSidebar } from '@santonastaso/shared';

export function Header() {
  const { user, signOut } = useAuth();
  const { toggle } = useSidebar();

  return (
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
    />
  );
}
