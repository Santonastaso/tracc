import React, { useState, useEffect } from 'react';
import { useErrorHandler } from '../hooks/useErrorHandler';
import { ERROR_TYPES } from '../services/errorHandling';

/**
 * Error Monitor Component
 * Provides real-time error monitoring and management interface
 */
const ErrorMonitor = ({ isOpen, onClose }) => {
  const { 
    errors, 
    clearErrors, 
    clearError, 
    getErrorsByType, 
    getErrorsBySeverity, 
    getErrorSummary,
    hasCriticalErrors 
  } = useErrorHandler();

  const [filter, setFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [expandedErrors, setExpandedErrors] = useState(new Set());

  const errorSummary = getErrorSummary();

  const filteredErrors = errors.filter(error => {
    if (filter !== 'all' && error.type !== filter) return false;
    if (severityFilter !== 'all' && error.severity !== severityFilter) return false;
    return true;
  });

  const toggleErrorExpansion = (errorId) => {
    const newExpanded = new Set(expandedErrors);
    if (newExpanded.has(errorId)) {
      newExpanded.delete(errorId);
    } else {
      newExpanded.add(errorId);
    }
    setExpandedErrors(newExpanded);
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'low': return 'text-yellow-600 bg-yellow-100';
      case 'medium': return 'text-orange-600 bg-orange-100';
      case 'high': return 'text-red-600 bg-red-100';
      case 'critical': return 'text-red-800 bg-red-200';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case ERROR_TYPES.VALIDATION_ERROR:
      case ERROR_TYPES.REQUIRED_FIELD_ERROR:
      case ERROR_TYPES.INVALID_FORMAT_ERROR:
        return '📝';
      case ERROR_TYPES.NOT_FOUND:
        return '🔍';
      case ERROR_TYPES.DUPLICATE_ERROR:
        return '🔄';
      case ERROR_TYPES.PERMISSION_ERROR:
      case ERROR_TYPES.AUTHENTICATION_ERROR:
      case ERROR_TYPES.AUTHORIZATION_ERROR:
        return '🔒';
      case ERROR_TYPES.BUSINESS_LOGIC_ERROR:
        return '⚖️';
      case ERROR_TYPES.NETWORK_ERROR:
      case ERROR_TYPES.CONNECTION_ERROR:
        return '🌐';
      case ERROR_TYPES.SERVER_ERROR:
      case ERROR_TYPES.DATABASE_ERROR:
        return '🖥️';
      case ERROR_TYPES.UI_ERROR:
        return '🖼️';
      default:
        return '❌';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gray-50 px-6 py-4 border-b">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Error Monitor</h2>
              <p className="text-sm text-gray-600">
                {errorSummary.total} errors • {errorSummary.recent} recent
              </p>
            </div>
            <div className="flex items-center space-x-2">
              {hasCriticalErrors() && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                  Critical Errors
                </span>
              )}
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="px-6 py-4 border-b bg-gray-50">
          <div className="flex space-x-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Types</option>
                {Object.values(ERROR_TYPES).map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Severity</label>
              <select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Severities</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={clearErrors}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                Clear All
              </button>
            </div>
          </div>
        </div>

        {/* Error Summary */}
        <div className="px-6 py-4 border-b">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{errorSummary.total}</div>
              <div className="text-sm text-gray-600">Total Errors</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{errorSummary.bySeverity.critical}</div>
              <div className="text-sm text-gray-600">Critical</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{errorSummary.bySeverity.high}</div>
              <div className="text-sm text-gray-600">High</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{errorSummary.bySeverity.medium}</div>
              <div className="text-sm text-gray-600">Medium</div>
            </div>
          </div>
        </div>

        {/* Error List */}
        <div className="flex-1 overflow-y-auto">
          {filteredErrors.length === 0 ? (
            <div className="px-6 py-8 text-center text-gray-500">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No errors found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {filter === 'all' && severityFilter === 'all' 
                  ? 'No errors have occurred yet.' 
                  : 'No errors match the current filters.'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredErrors.map((error) => (
                <div key={error.id} className="px-6 py-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      <span className="text-lg">{getTypeIcon(error.type)}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSeverityColor(error.severity)}`}>
                            {error.severity}
                          </span>
                          <span className="text-sm text-gray-500">{error.type}</span>
                        </div>
                        <p className="mt-1 text-sm text-gray-900">{error.message}</p>
                        <div className="mt-1 flex items-center space-x-4 text-xs text-gray-500">
                          <span>{new Date(error.timestamp).toLocaleString()}</span>
                          {error.context && <span>Context: {error.context}</span>}
                          {error.retryable && <span className="text-blue-600">Retryable</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => toggleErrorExpansion(error.id)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <svg 
                          className={`w-4 h-4 transform transition-transform ${expandedErrors.has(error.id) ? 'rotate-180' : ''}`} 
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      <button
                        onClick={() => clearError(error.id)}
                        className="text-gray-400 hover:text-red-600"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  
                  {expandedErrors.has(error.id) && (
                    <div className="mt-3 pl-8">
                      <div className="bg-gray-100 rounded-md p-3">
                        <div className="text-xs text-gray-600 space-y-1">
                          <div><strong>Error ID:</strong> {error.id}</div>
                          <div><strong>Timestamp:</strong> {new Date(error.timestamp).toISOString()}</div>
                          {error.context && <div><strong>Context:</strong> {error.context}</div>}
                          <div><strong>Retryable:</strong> {error.retryable ? 'Yes' : 'No'}</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Showing {filteredErrors.length} of {errors.length} errors
            </div>
            <div className="text-sm text-gray-500">
              Last updated: {new Date().toLocaleTimeString()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ErrorMonitor;
