import React from 'react';
import { Menu, LogOut } from 'lucide-react';
import { useAuth } from '../../auth/AuthContext';
import { Header as SharedHeader, useSidebar } from '@santonastaso/shared-components';
import { ThemeSwitch, Button } from '@santonastaso/crm-ui';

export function Header() {
  const { user, signOut } = useAuth();
  const { toggle } = useSidebar();

  return (
    <SharedHeader
      user={user}
      onSignOut={() => signOut()}
      onToggleSidebar={toggle}
      ThemeSwitch={ThemeSwitch}
      Button={Button}
      MenuIcon={Menu}
      LogOutIcon={LogOut}
    />
  );
}
