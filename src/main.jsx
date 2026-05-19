import React, { lazy, Suspense } from 'react';
import ReactDOM from 'react-dom/client';

const DevtoolsLazy = lazy(() =>
  import('@tanstack/react-query-devtools').then((m) => ({
    default: () => <m.ReactQueryDevtools initialIsOpen={false} />,
  }))
);
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App';
import { AuthProvider } from './auth/AuthContext';
import { ConfirmProvider } from './ui/confirm-provider';
import './index.css';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter 
        basename={import.meta.env.BASE_URL}
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true
        }}
      >
        <AuthProvider>
          <ConfirmProvider>
            <App />
            {import.meta.env.DEV && (
              <Suspense fallback={null}>
                <DevtoolsLazy />
              </Suspense>
            )}
          </ConfirmProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
);
