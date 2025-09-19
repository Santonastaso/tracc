import React, { useEffect } from 'react';
import { Routes, Route, Outlet, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import SideNav from './components/layout/SideNav';
import HomePage from './pages/HomePage';
import SilosPage from './pages/SilosPage';
import MerceInPage from './pages/MerceInPage';
import MerceOutPage from './pages/MerceOutPage';
import ReportsPage from './pages/ReportsPage';
import ArchivePage from './pages/ArchivePage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import ErrorBoundary from './components/ErrorBoundary';
import ProtectedRoute from './auth/ProtectedRoute';
import { useAuth } from './auth/AuthContext';

// This component creates the main layout with the sidebar
const AppLayout = () => {
  const { user, signOut } = useAuth();
  
  return (
    <div className="flex h-screen bg-gray-200 overflow-hidden">
      <SideNav />
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-20 bg-navy-800 border-b border-navy-700 px-2 py-3 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-white text-lg font-semibold">Molino Rossetto - Sistema Tracciabilità Molino</h1>
            </div>
            <div className="flex items-center space-x-4">
              {user && (
                <>
                  <span className="text-[10px] text-navy-200">{user.email}</span>
                  <button 
                    onClick={signOut}
                    className="px-3 py-1.5 text-[10px] font-medium text-navy-200 hover:text-white hover:bg-navy-700 rounded transition-colors"
                  >
                    Sign out
                  </button>
                </>
              )}
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-auto pt-0 min-w-0">
          <Outlet />
        </main>
      </div>
      <Toaster 
        position="top-right"
        richColors
        closeButton
        duration={4000}
      />
    </div>
  );
};

function App() {
  // Handle GitHub Pages SPA redirect
  useEffect(() => {
    // Check if we're on GitHub Pages and have a redirect parameter
    const searchParams = new URLSearchParams(window.location.search);
    const redirectPath = searchParams.get('/');
    
    if (redirectPath) {
      // Clean up the URL and navigate to the correct path
      const cleanPath = redirectPath.replace(/~and~/g, '&');
      window.history.replaceState({}, '', cleanPath);
    }
  }, []);

  return (
    <ErrorBoundary>
      <Routes>
        {/* Public authentication routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        
        {/* Protected application routes */}
        <Route path="/" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
          {/* Define the component for the home page */}
          <Route index element={<HomePage />} />
          
          {/* Add routes for the mill tracing system */}
          <Route path="silos" element={<SilosPage />} />
          <Route path="merce-in" element={<MerceInPage />} />
          <Route path="merce-out" element={<MerceOutPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="archive" element={<ArchivePage />} />
        </Route>
        
        {/* Catch-all route for unmatched paths */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ErrorBoundary>
  );
}

export default App;
