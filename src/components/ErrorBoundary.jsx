import React from 'react';
import { ServiceError, ERROR_TYPES, handleReactError, logError } from '../services/errorHandling';

/**
 * Enhanced Error Boundary Component
 * Provides comprehensive error handling for React components
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error: error
    };
  }

  componentDidCatch(error, errorInfo) {
    // Create service error from React error
    const serviceError = new ServiceError(
      error.message || 'A React component error occurred',
      ERROR_TYPES.UI_ERROR,
      500,
      error,
      'ErrorBoundary',
      {
        details: {
          componentStack: errorInfo.componentStack,
          errorBoundary: errorInfo.errorBoundary
        },
        metadata: {
          reactError: true,
          errorBoundary: true,
          retryCount: this.state.retryCount
        }
      }
    );

    // Log the error
    logError(serviceError, {
      componentStack: errorInfo.componentStack,
      errorBoundary: errorInfo.errorBoundary,
      retryCount: this.state.retryCount
    });

    // Update state with error information
    this.setState({
      error: serviceError,
      errorInfo: errorInfo,
      errorId: serviceError.id
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(serviceError, errorInfo);
    }
  }

  handleRetry = () => {
    const maxRetries = this.props.maxRetries || 3;
    
    if (this.state.retryCount < maxRetries) {
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        errorId: null,
        retryCount: this.state.retryCount + 1
      });
    }
  };

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      retryCount: 0
    });
  };

  render() {
    if (this.state.hasError) {
      // Custom error UI
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.state.errorInfo, {
          retry: this.handleRetry,
          reset: this.handleReset,
          retryCount: this.state.retryCount,
          maxRetries: this.props.maxRetries || 3
        });
      }

      // Default error UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0">
                <svg className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-gray-900">
                  Something went wrong
                </h3>
              </div>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-600">
                {this.state.error?.userMessage || 'An unexpected error occurred. Please try again.'}
              </p>
              
              {this.state.errorId && (
                <p className="text-xs text-gray-500 mt-2">
                  Error ID: {this.state.errorId}
                </p>
              )}
            </div>

            <div className="flex space-x-3">
              {this.state.retryCount < (this.props.maxRetries || 3) && (
                <button
                  onClick={this.handleRetry}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Try Again ({this.state.retryCount + 1}/{(this.props.maxRetries || 3) + 1})
                </button>
              )}
              
              <button
                onClick={this.handleReset}
                className="flex-1 bg-gray-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Reset
              </button>
            </div>

            {process.env.NODE_ENV === 'development' && (
              <details className="mt-4">
                <summary className="text-sm text-gray-500 cursor-pointer hover:text-gray-700">
                  Technical Details
                </summary>
                <div className="mt-2 p-3 bg-gray-100 rounded text-xs font-mono text-gray-800 overflow-auto max-h-40">
                  <div className="mb-2">
                    <strong>Error Type:</strong> {this.state.error?.type}
                  </div>
                  <div className="mb-2">
                    <strong>Severity:</strong> {this.state.error?.severity}
                  </div>
                  <div className="mb-2">
                    <strong>Message:</strong> {this.state.error?.message}
                  </div>
                  {this.state.errorInfo?.componentStack && (
                    <div className="mb-2">
                      <strong>Component Stack:</strong>
                      <pre className="whitespace-pre-wrap text-xs">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </div>
                  )}
                  {this.state.error?.stack && (
                    <div>
                      <strong>Stack Trace:</strong>
                      <pre className="whitespace-pre-wrap text-xs">
                        {this.state.error.stack}
                      </pre>
                    </div>
                  )}
                </div>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Higher-order component for error boundary
 * @param {React.Component} WrappedComponent - Component to wrap
 * @param {Object} options - Error boundary options
 * @returns {React.Component} Wrapped component with error boundary
 */
export const withErrorBoundary = (WrappedComponent, options = {}) => {
  return function WithErrorBoundaryComponent(props) {
    return (
      <ErrorBoundary {...options}>
        <WrappedComponent {...props} />
      </ErrorBoundary>
    );
  };
};

/**
 * Hook for error boundary functionality
 * @returns {Object} Error boundary utilities
 */
export const useErrorBoundary = () => {
  const [error, setError] = React.useState(null);

  const resetError = React.useCallback(() => {
    setError(null);
  }, []);

  const captureError = React.useCallback((error) => {
    setError(error);
  }, []);

  React.useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);

  return { captureError, resetError };
};

export default ErrorBoundary;