import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';

function SideNav() {
  const { user } = useAuth();
  const location = useLocation();

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/silos', label: 'Silos' },
    { href: '/merce-in', label: 'Merce IN' },
    { href: '/merce-out', label: 'Merce OUT' },
    { href: '/reports', label: 'Report' },
    { href: '/archive', label: 'Archivio Analisi' }
  ];

  if (!user) {
    return (
      <nav className="w-64 bg-white border-r border-gray-200 h-screen flex flex-col">
        <div className="p-3 border-b border-gray-200">
          <Link to="/login" className="text-[30px] font-bold text-gray-800">
            <span className="text-navy-800">TRACC</span>
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
          <div className="text-white text-2xl font-bold">
            TRACC
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <div className="flex-1 p-1">
        <h3 className="text-[10px] font-semibold text-navy-200 uppercase tracking-wider mb-3">NAVIGATION</h3>
        <div className="space-y-1">
          {navLinks.map((link) => {
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
                <span>{link.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

export default SideNav;
