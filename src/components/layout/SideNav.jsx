import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';

function SideNav() {
  const { user } = useAuth();
  const location = useLocation();
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
    { href: '/', label: 'Home' },
    { 
      section: 'silos', 
      label: 'Silos',
      subLinks: [
        { href: '/silos/list', label: 'Lista Silos' },
        { href: '/silos/new', label: 'Nuovo Silos' }
      ]
    },
    { 
      section: 'operators', 
      label: 'Operatori',
      subLinks: [
        { href: '/operators/list', label: 'Lista Operatori' },
        { href: '/operators/new', label: 'Nuovo Operatore' }
      ]
    },
    { 
      section: 'materials', 
      label: 'Materiali',
      subLinks: [
        { href: '/materials/list', label: 'Lista Materiali' },
        { href: '/materials/new', label: 'Nuovo Materiale' }
      ]
    },
    { 
      section: 'suppliers', 
      label: 'Fornitori',
      subLinks: [
        { href: '/suppliers/list', label: 'Lista Fornitori' },
        { href: '/suppliers/new', label: 'Nuovo Fornitore' }
      ]
    },
    { 
      section: 'merceIn', 
      label: 'Merce IN',
      subLinks: [
        { href: '/merce-in/list', label: 'Lista Movimenti' },
        { href: '/merce-in/new', label: 'Nuovo Movimento' }
      ]
    },
    { 
      section: 'merceOut', 
      label: 'Merce OUT',
      subLinks: [
        { href: '/merce-out/list', label: 'Lista Prelievi' },
        { href: '/merce-out/new', label: 'Nuovo Prelievo' }
      ]
    },
    { href: '/reports', label: 'Report' },
    { href: '/archive', label: 'Archivio Analisi' }
  ];

  if (!user) {
    return (
      <nav className="w-64 bg-white border-r border-gray-200 h-screen flex flex-col">
        <div className="p-3 border-b border-gray-200">
          <Link to="/login" className="flex items-center justify-center">
            <img src="/trace.svg" alt="TRACC" className="h-8 w-auto" />
          </Link>
        </div>
        
        <div className="flex-1 p-1">
          <h3 className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2">NAVIGATION</h3>
          <div className="space-y-2">
            <Link to="/login" className="block px-3 py-1 text-gray-700 hover:bg-gray-100 rounded-md">
              <span>Accedi</span>
            </Link>
            <Link to="/signup" className="block px-3 py-1 text-gray-700 hover:bg-gray-100 rounded-md">
              <span>Registrati</span>
            </Link>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="w-48 bg-navy-800 border-r border-navy-700 h-screen flex flex-col flex-shrink-0 sticky left-0 z-30">
      {/* Logo */}
      <div className="p-3 border-b border-navy-700">
        <Link to="/" className="flex items-center justify-center">
          <img src="/trace.svg" alt="TRACC" className="h-8 w-auto" />
        </Link>
      </div>

      {/* Navigation */}
      <div className="flex-1 p-1">
        <h3 className="text-[10px] font-semibold text-navy-200 uppercase tracking-wider mb-3">NAVIGATION</h3>
        <div className="space-y-1">
          {navLinks.map((link) => {
            if (link.section) {
              // Expandable section with sub-links
              const isExpanded = expandedSections[link.section];
              const hasActiveSubLink = link.subLinks.some(subLink => location.pathname === subLink.href);
              
              return (
                <div key={link.section}>
                  <button
                    onClick={() => toggleSection(link.section)}
                    className={`w-full flex items-center justify-between px-1 py-1.5 rounded text-[10px] font-medium ${
                      hasActiveSubLink 
                        ? 'bg-navy-600 text-white' 
                        : 'text-navy-200 hover:bg-navy-700'
                    }`}
                  >
                    <span className="flex items-center">
                      {link.label}
                    </span>
                    <span className={`transform transition-transform ${isExpanded ? 'rotate-90' : ''}`}>
                      ▶
                    </span>
                  </button>
                  
                  {isExpanded && (
                    <div className="ml-3 mt-1 space-y-1">
                      {link.subLinks.map((subLink) => {
                        const isActive = location.pathname === subLink.href;
                        return (
                          <Link
                            key={subLink.href}
                            to={subLink.href}
                            className={`block px-1 py-1 rounded text-[9px] font-medium ${
                              isActive 
                                ? 'bg-navy-500 text-white' 
                                : 'text-navy-300 hover:bg-navy-600 hover:text-white'
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
              
              return (
                <Link
                  key={link.href}
                  to={link.href}
                  className={`block px-1 py-1.5 rounded text-[10px] font-medium ${
                    isActive 
                      ? 'bg-navy-600 text-white' 
                      : 'text-navy-200 hover:bg-navy-700'
                  }`}
                >
                  <span className="flex items-center">
                    {link.label}
                  </span>
                </Link>
              );
            }
          })}
        </div>
      </div>
    </nav>
  );
}

export default SideNav;
