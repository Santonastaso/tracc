import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { useSidebar } from '@santonastaso/shared';
import { 
  Home, 
  Package, 
  Users, 
  Truck, 
  TruckIcon, 
  FileText, 
  Archive,
  Building2
} from 'lucide-react';

function SideNav() {
  const { user } = useAuth();
  const location = useLocation();
  const { isOpen } = useSidebar();

  const navLinks = [
    { href: '/', label: 'Dashboard', icon: Home },
    { href: '/silos/list', label: 'Silos', icon: Package },
    { href: '/operators/list', label: 'Operatori', icon: Users },
    { href: '/materials/list', label: 'Materiali', icon: Package },
    { href: '/suppliers/list', label: 'Fornitori', icon: Building2 },
    { href: '/merce-in/list', label: 'Merce IN', icon: Truck },
    { href: '/merce-out/list', label: 'Merce OUT', icon: TruckIcon },
    { href: '/reports', label: 'Report', icon: FileText },
    { href: '/archive', label: 'Archivio Analisi', icon: Archive }
  ];

  if (!user) {
    return (
      <nav className="w-64 bg-secondary shadow-sm border-r border-border h-screen flex flex-col">
        <div className="p-4 border-b border-border">
          <Link to="/login" className="flex items-center justify-center">
            <img src={`${import.meta.env.BASE_URL}trace.svg`} alt="TRACC" className="h-6 w-auto" />
          </Link>
        </div>
        
        <div className="flex-1 p-4">
          <h3 className="text-xs font-semibold text-secondary-foreground uppercase tracking-wider mb-4">NAVIGATION</h3>
          <div className="space-y-2">
            <Link to="/login" className="flex items-center space-x-3 px-3 py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
              <span className="font-medium">Accedi</span>
            </Link>
            <Link to="/signup" className="flex items-center space-x-3 px-3 py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
              <span className="font-medium">Registrati</span>
            </Link>
          </div>
        </div>
      </nav>
    );
  }

  if (!isOpen) {
    return (
      <div className="w-16 bg-secondary shadow-sm border-r border-border min-h-screen">
        <div className="flex flex-col items-center py-4 space-y-4">
          {navLinks.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.href
            return (
              <Link
                key={item.href || item.section}
                to={item.href || '#'}
                className={`p-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                }`}
                title={item.label}
              >
                <Icon className="h-6 w-6" />
              </Link>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <nav className="w-64 bg-secondary shadow-sm border-r border-border h-screen flex flex-col flex-shrink-0 sticky left-0 z-30">
      {/* Logo */}
      <div className="p-4 border-b border-border">
        <Link to="/" className="flex items-center justify-center">
          <img src={`${import.meta.env.BASE_URL}trace.svg`} alt="TRACC" className="h-6 w-auto" />
        </Link>
      </div>

      {/* Navigation */}
      <div className="flex-1 p-4">
        <h2 className="text-xl font-semibold text-secondary-foreground mb-6">Navigation</h2>
        <nav className="space-y-2">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.href;
            const Icon = link.icon;
            
            return (
              <Link
                key={link.href}
                to={link.href}
                className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                  isActive 
                    ? 'bg-primary/10 text-primary' 
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="text-sm font-medium">{link.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </nav>
  );
}

export default SideNav;
