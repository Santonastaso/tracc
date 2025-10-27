import React from 'react';
import { useAuth } from '../../auth/AuthContext';
import { ExactHeader } from '@santonastaso/shared';

export function Header() {
  const { user, signOut } = useAuth();

  const navigationItems = [
    { label: 'Dashboard', to: '/', isActive: true },
    { label: 'Machines', to: '/machines' },
    { label: 'Orders', to: '/orders' },
    { label: 'Reports', to: '/reports' },
  ];

  return (
    <ExactHeader
      title="Tracc"
      navigationItems={navigationItems}
      user={{
        name: user?.email?.split('@')[0] || 'User',
        email: user?.email,
        avatar: user?.avatar_url
      }}
      onLogout={() => signOut()}
      onRefresh={() => window.location.reload()}
    />
  );
}
