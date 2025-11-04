import React, { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { 
  ThemeSwitch, 
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Avatar,
  AvatarImage,
  AvatarFallback
} from '@santonastaso/shared';
import { RotateCw, LogOut, LoaderCircle } from 'lucide-react';

// RefreshButton Component - EXACT copy from scheduler_demo
const RefreshButton = ({ onRefresh, loading = false }) => {
  const handleRefresh = () => {
    if (onRefresh) {
      onRefresh();
    } else {
      window.location.reload();
    }
  };

  return (
    <Button
      onClick={handleRefresh}
      variant="ghost"
      size="icon"
      className="hidden sm:inline-flex"
    >
      {loading ? <LoaderCircle className="animate-spin" /> : <RotateCw />}
    </Button>
  );
};

// UserMenu Component - EXACT copy from scheduler_demo
const UserMenu = ({ user, onLogout }) => {
  const [open, setOpen] = useState(false);

  const handleToggleOpen = useCallback(() => {
    setOpen((prevOpen) => !prevOpen);
  }, []);

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    }
    setOpen(false);
  };

  return (
    <DropdownMenu open={open} onOpenChange={handleToggleOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="relative h-8 w-8 ml-2 rounded-full"
        >
          <Avatar className="h-8 w-8">
            <AvatarImage src={user?.avatar} role="presentation" />
            <AvatarFallback>{user?.name?.charAt(0) || 'U'}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">
              {user?.name || 'User'}
            </p>
            {user?.email && (
              <p className="text-xs text-muted-foreground">
                {user.email}
              </p>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
          <LogOut />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

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

          {/* Right Section: ThemeSwitch + RefreshButton + UserMenu - EXACT copy from scheduler_demo */}
          <div className="flex items-center">
            <ThemeSwitch />
            <RefreshButton onRefresh={() => window.location.reload()} loading={false} />
            <UserMenu 
              user={{
                name: user?.email?.split('@')[0] || 'User',
                email: user?.email,
                avatar: user?.avatar
              }} 
              onLogout={() => signOut()} 
            />
          </div>
        </div>
      </div>
    </header>
  );
}
