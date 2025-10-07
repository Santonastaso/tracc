import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { useSidebar } from '../../hooks/useSidebar';
import { 
  Home, 
  Package, 
  Users, 
  Truck, 
  TruckIcon, 
  FileText, 
  Archive,
  ChevronRight,
  Building2
} from 'lucide-react';

function SideNav() {
  const { user } = useAuth();
  const location = useLocation();
  const { isOpen } = useSidebar();
  const [expandedSections, setExpandedSections] = useState({
    merceIn: location.pathname.startsWith('/merce-in'),
    merceOut: location.pathname.startsWith('/merce-out'),
    operators: location.pathname.startsWith('/operators'),
    silos: location.pathname.startsWith('/silos'),
    materials: location.pathname.startsWith('/materials'),
    suppliers: location.pathname.startsWith('/suppliers')
  });

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const navLinks = [
    { href: '/', label: 'Dashboard', icon: Home },
    { 
      section: 'silos', 
      label: 'Silos',
      icon: Package,
      subLinks: [
        { href: '/silos/list', label: 'Lista Silos' },
        { href: '/silos/new', label: 'Nuovo Silos' }
      ]
    },
    { 
      section: 'operators', 
      label: 'Operatori',
      icon: Users,
      subLinks: [
        { href: '/operators/list', label: 'Lista Operatori' },
        { href: '/operators/new', label: 'Nuovo Operatore' }
      ]
    },
    { 
      section: 'materials', 
      label: 'Materiali',
      icon: Package,
      subLinks: [
        { href: '/materials/list', label: 'Lista Materiali' },
        { href: '/materials/new', label: 'Nuovo Materiale' }
      ]
    },
    { 
      section: 'suppliers', 
      label: 'Fornitori',
      icon: Building2,
      subLinks: [
        { href: '/suppliers/list', label: 'Lista Fornitori' },
        { href: '/suppliers/new', label: 'Nuovo Fornitore' }
      ]
    },
    { 
      section: 'merceIn', 
      label: 'Merce IN',
      icon: Truck,
      subLinks: [
        { href: '/merce-in/list', label: 'Lista Movimenti' },
        { href: '/merce-in/new', label: 'Nuovo Movimento' }
      ]
    },
    { 
      section: 'merceOut', 
      label: 'Merce OUT',
      icon: TruckIcon,
      subLinks: [
        { href: '/merce-out/list', label: 'Lista Prelievi' },
        { href: '/merce-out/new', label: 'Nuovo Prelievo' }
      ]
    },
    { href: '/reports', label: 'Report', icon: FileText },
    { href: '/archive', label: 'Archivio Analisi', icon: Archive }
  ];

  if (!user) {
    return (
      <nav className="w-64 bg-background shadow-sm border-r border-border h-screen flex flex-col">
        <div className="p-4 border-b border-border">
          <Link to="/login" className="flex items-center justify-center">
            <img src={`${import.meta.env.BASE_URL}trace.svg`} alt="TRACC" className="h-8 w-auto" />
          </Link>
        </div>
        
        <div className="flex-1 p-4">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">NAVIGATION</h3>
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
      <div className="w-16 bg-background shadow-sm border-r border-border min-h-screen">
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
    <nav className="w-64 bg-background shadow-sm border-r border-border h-screen flex flex-col flex-shrink-0 sticky left-0 z-30">
      {/* Logo */}
      <div className="p-4 border-b border-border">
        <Link to="/" className="flex items-center justify-center">
          <img src={`${import.meta.env.BASE_URL}trace.svg`} alt="TRACC" className="h-8 w-auto" />
        </Link>
      </div>

      {/* Navigation */}
      <div className="flex-1 p-4">
        <h2 className="text-lg font-semibold text-foreground mb-6">Navigation</h2>
        <nav className="space-y-2">
          {navLinks.map((link) => {
            if (link.section) {
              // Expandable section with sub-links
              const isExpanded = expandedSections[link.section];
              const hasActiveSubLink = link.subLinks.some(subLink => location.pathname === subLink.href);
              const Icon = link.icon;
              
              return (
                <div key={link.section}>
                  <button
                    onClick={() => toggleSection(link.section)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${
                      hasActiveSubLink 
                        ? 'bg-primary/10 text-primary' 
                        : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <Icon className="h-5 w-5" />
                      <span className="font-medium">{link.label}</span>
                    </div>
                    <ChevronRight className={`h-4 w-4 transform transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                  </button>
                  
                  {isExpanded && (
                    <div className="ml-6 mt-2 space-y-1">
                      {link.subLinks.map((subLink) => {
                        const isActive = location.pathname === subLink.href;
                        return (
                          <Link
                            key={subLink.href}
                            to={subLink.href}
                            className={`block px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                              isActive 
                                ? 'bg-primary/5 text-primary' 
                                : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                            }`}
                          >
                            {subLink.label}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            } else {
              // Regular link
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
                  <span className="font-medium">{link.label}</span>
                </Link>
              );
            }
          })}
        </nav>
      </div>
    </nav>
  );
}

export default SideNav;
