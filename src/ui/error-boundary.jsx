import React from 'react';
import { generateId } from '../lib/generate-id';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.handleRetry = () => {
      const maxRetries = this.props.maxRetries || 3;
      if (this.state.retryCount < maxRetries) {
        this.setState({
          hasError: false,
          error: null,
          errorInfo: null,
          errorId: null,
          retryCount: this.state.retryCount + 1,
        });
      }
    };
    this.handleReset = () => {
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        errorId: null,
        retryCount: 0,
      });
    };
    this.handleReportIssue = () => {
      const subject = encodeURIComponent(`App Error Report - ${this.state.errorId}`);
      const body = encodeURIComponent(`
Error Report Details:
- Error ID: ${this.state.errorId}
- Error: ${this.state.error?.message || 'Unknown error'}
- URL: ${window.location.href}
- User Agent: ${navigator.userAgent}
- Timestamp: ${new Date().toISOString()}

Please describe what you were doing when this error occurred:
    `);
      window.open(`mailto:support@company.com?subject=${subject}&body=${body}`);
    };
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      error,
      errorId: generateId(),
    };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      errorInfo,
      errorId: this.state.errorId || generateId(),
    });
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
    if (import.meta.env.DEV) {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.state.errorInfo, {
          retry: this.handleRetry,
          reset: this.handleReset,
          retryCount: this.state.retryCount,
          maxRetries: this.props.maxRetries || 3,
        });
      }
      return (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="max-w-md w-full bg-card shadow-lg rounded-lg p-6 border">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 text-destructive text-2xl">🚨</div>
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-foreground">Something went wrong</h3>
              </div>
            </div>
            <div className="mb-4">
              <p className="text-sm text-muted-foreground">
                We&apos;re sorry, but something unexpected happened. Our team has been notified and is
                working to fix this issue.
              </p>
              {this.state.errorId && (
                <p className="text-xs text-muted-foreground mt-2">
                  Error ID: <code className="bg-muted px-1 rounded">{this.state.errorId}</code>
                </p>
              )}
            </div>
            <div className="flex space-x-3 mb-4">
              {this.state.retryCount < (this.props.maxRetries || 3) && (
                <button
                  type="button"
                  onClick={this.handleRetry}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Try Again ({this.state.retryCount + 1}/{(this.props.maxRetries || 3) + 1})
                </button>
              )}
              <button
                type="button"
                onClick={this.handleReset}
                className="flex-1 bg-gray-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Reset
              </button>
            </div>
            <button
              type="button"
              onClick={this.handleReportIssue}
              className="w-full bg-gray-100 text-gray-900 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 border border-gray-300"
            >
              📧 Report Issue
            </button>
            {this.state.error && (
              <details className="mt-4">
                <summary className="text-sm text-muted-foreground cursor-pointer hover:text-foreground">
                  Technical Details (Development)
                </summary>
                <div className="mt-2 p-3 bg-muted rounded text-xs font-mono text-foreground overflow-auto max-h-40">
                  <div className="mb-2">
                    <strong>Error:</strong> {this.state.error.message}
                  </div>
                  {this.state.errorInfo?.componentStack && (
                    <div className="mb-2">
                      <strong>Component Stack:</strong>
                      <pre className="whitespace-pre-wrap text-xs">{this.state.errorInfo.componentStack}</pre>
                    </div>
                  )}
                  {this.state.error.stack && (
                    <div>
                      <strong>Stack Trace:</strong>
                      <pre className="whitespace-pre-wrap text-xs">{this.state.error.stack}</pre>
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
