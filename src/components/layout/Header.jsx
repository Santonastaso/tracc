import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { UnifiedHeader } from '@santonastaso/shared';

export function Header() {
  const { user, signOut } = useAuth();

  return (
    <UnifiedHeader
      title="TRACC"
      darkModeLogo="/trace.svg"
      lightModeLogo="/trace.svg"
      user={{
        name: user?.email?.split('@')[0] || 'User',
        email: user?.email,
        avatar: user?.avatar_url
      }}
      onLogout={() => signOut()}
      onRefresh={() => window.location.reload()}
      LinkComponent={Link}
    />
  );
}
