import React, { useEffect } from 'react';
import { Routes, Route, Outlet, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import SideNav from './components/layout/SideNav';
import { Header } from './components/layout/Header';
import HomePage from './pages/HomePage';
import SilosPage from './pages/SilosPage';
import SilosListPage from './pages/SilosListPage';
import SilosFormPage from './pages/SilosFormPage';
import OperatorsListPage from './pages/OperatorsListPage';
import OperatorsPage from './pages/OperatorsPage';
import MaterialsListPage from './pages/MaterialsListPage';
import MaterialsPage from './pages/MaterialsPage';
import SuppliersListPage from './pages/SuppliersListPage';
import SuppliersPage from './pages/SuppliersPage';
import MerceInListPage from './pages/MerceInListPage';
import MerceInPage from './pages/MerceInPage';
import MerceOutListPage from './pages/MerceOutListPage';
import MerceOutPage from './pages/MerceOutPage';
import ReportsPage from './pages/ReportsPage';
import ArchivePage from './pages/ArchivePage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import ErrorBoundary from './components/ErrorBoundary';
import ProtectedRoute from './auth/ProtectedRoute';
import { useAuth } from './auth/AuthContext';
import { useStoreSync } from './hooks';
import { ThemeProvider } from './components/ThemeProvider';

// This component creates the main layout with the sidebar
const AppLayout = () => {
  const { user, signOut } = useAuth();
  
  // Sync React Query data with Zustand stores
  useStoreSync();
  
  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <SideNav />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="flex-1 overflow-auto bg-background min-w-0">
          <div className="p-4">
            <Outlet />
          </div>
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
  return (
    <ThemeProvider>
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
            
            {/* Silos routes */}
            <Route path="silos" element={<SilosPage />} />
            <Route path="silos/list" element={<SilosListPage />} />
            <Route path="silos/new" element={<SilosFormPage />} />
            <Route path="silos/edit/:id" element={<SilosFormPage />} />
            
            {/* Operators routes */}
            <Route path="operators/list" element={<OperatorsListPage />} />
            <Route path="operators/new" element={<OperatorsPage />} />
            <Route path="operators/edit/:id" element={<OperatorsPage />} />
            
            {/* Materials routes */}
            <Route path="materials/list" element={<MaterialsListPage />} />
            <Route path="materials/new" element={<MaterialsPage />} />
            <Route path="materials/edit/:id" element={<MaterialsPage />} />
            
            {/* Suppliers routes */}
            <Route path="suppliers/list" element={<SuppliersListPage />} />
            <Route path="suppliers/new" element={<SuppliersPage />} />
            <Route path="suppliers/edit/:id" element={<SuppliersPage />} />
            
            {/* Merce IN routes */}
            <Route path="merce-in/list" element={<MerceInListPage />} />
            <Route path="merce-in/new" element={<MerceInPage />} />
            <Route path="merce-in/edit/:id" element={<MerceInPage />} />
            
            {/* Merce OUT routes */}
            <Route path="merce-out/list" element={<MerceOutListPage />} />
            <Route path="merce-out/new" element={<MerceOutPage />} />
            <Route path="merce-out/edit/:id" element={<MerceOutPage />} />
            
            <Route path="reports" element={<ReportsPage />} />
            <Route path="archive" element={<ArchivePage />} />
          </Route>
          
          {/* Catch-all route for unmatched paths */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ErrorBoundary>
    </ThemeProvider>
  );
}

export default App;
