import { useState, useCallback, useRef } from 'react';
import { 
  ServiceError, 
  ERROR_TYPES, 
  createServiceError, 
  logError, 
  getRecoveryStrategy, 
  RECOVERY_STRATEGIES,
  retryOperation,
  createErrorHandler
} from '../services/errorHandling';
import { showError, showWarning, showInfo } from '@andrea/shared-utils';

/**
 * Enhanced error handling hook
 * Provides comprehensive error handling capabilities for React components
 */
export const useErrorHandler = (options = {}) => {
  const {
    logErrors = true,
    showUserMessages = true,
    maxRetries = 3,
    retryDelay = 1000,
    onError = null,
    onRetry = null,
    onFallback = null
  } = options;

  const [errors, setErrors] = useState([]);
  const [isRetrying, setIsRetrying] = useState(false);
  const retryCountRef = useRef(0);

  /**
   * Handle error with comprehensive error management
   */
  const handleError = useCallback(async (error, context = '', customOptions = {}) => {
    // Convert to ServiceError if not already
    let serviceError = error;
    if (!(error instanceof ServiceError)) {
      serviceError = createServiceError(
        error.message || 'An unexpected error occurred',
        ERROR_TYPES.SERVER_ERROR,
        500,
        error,
        context
      );
    }

    // Add to errors state
    setErrors(prev => [...prev, {
      ...serviceError.toUserFriendly(),
      context,
      timestamp: new Date().toISOString()
    }]);

    // Log error if enabled
    if (logErrors) {
      logError(serviceError, { context, ...customOptions });
    }

    // Show user message if enabled
    if (showUserMessages) {
      const severity = serviceError.severity;
      const message = serviceError.userMessage;

      switch (severity) {
        case 'low':
          showWarning(message);
          break;
        case 'medium':
          showError(message);
          break;
        case 'high':
        case 'critical':
          showError(message);
          break;
        default:
          showError(message);
      }
    }

    // Call custom error handler if provided
    if (onError) {
      await onError(serviceError, context);
    }

    return serviceError;
  }, [logErrors, showUserMessages, onError]);

  /**
   * Handle async operations with automatic retry
   */
  const handleAsyncError = useCallback(async (asyncFn, context = '', retryOptions = {}) => {
    const {
      maxRetries: customMaxRetries = maxRetries,
      retryDelay: customRetryDelay = retryDelay,
      retryCondition = (error) => error.retryable,
      onRetry: customOnRetry = onRetry
    } = retryOptions;

    try {
      return await retryOperation(asyncFn, {
        maxRetries: customMaxRetries,
        baseDelay: customRetryDelay,
        retryCondition,
        onRetry: async (error, attempt, delay) => {
          setIsRetrying(true);
          retryCountRef.current = attempt;
          
          if (customOnRetry) {
            await customOnRetry(error, attempt, delay);
          }
          
          // Show retry message
          if (showUserMessages) {
            showInfo(`Retrying... (${attempt}/${customMaxRetries + 1})`);
          }
        }
      });
    } catch (error) {
      setIsRetrying(false);
      retryCountRef.current = 0;
      return await handleError(error, context);
    } finally {
      setIsRetrying(false);
      retryCountRef.current = 0;
    }
  }, [maxRetries, retryDelay, onRetry, showUserMessages, handleError]);

  /**
   * Handle specific error types
   */
  const handleValidationError = useCallback((message, details = {}) => {
    const error = createServiceError(
      message,
      ERROR_TYPES.VALIDATION_ERROR,
      400,
      null,
      'validation',
      { details }
    );
    return handleError(error, 'validation');
  }, [handleError]);

  const handleBusinessError = useCallback((message, details = {}) => {
    const error = createServiceError(
      message,
      ERROR_TYPES.BUSINESS_LOGIC_ERROR,
      422,
      null,
      'businessLogic',
      { details }
    );
    return handleError(error, 'businessLogic');
  }, [handleError]);

  const handleNotFoundError = useCallback((entity, id) => {
    const error = createServiceError(
      `${entity} with id ${id} not found`,
      ERROR_TYPES.NOT_FOUND,
      404,
      null,
      'notFound'
    );
    return handleError(error, 'notFound');
  }, [handleError]);

  const handleDuplicateError = useCallback((entity, field, value) => {
    const error = createServiceError(
      `${entity} with ${field} '${value}' already exists`,
      ERROR_TYPES.DUPLICATE_ERROR,
      409,
      null,
      'duplicate'
    );
    return handleError(error, 'duplicate');
  }, [handleError]);

  const handlePermissionError = useCallback((message = 'You do not have permission to perform this action') => {
    const error = createServiceError(
      message,
      ERROR_TYPES.PERMISSION_ERROR,
      403,
      null,
      'permission'
    );
    return handleError(error, 'permission');
  }, [handleError]);

  const handleNetworkError = useCallback((message = 'Network connection failed') => {
    const error = createServiceError(
      message,
      ERROR_TYPES.NETWORK_ERROR,
      500,
      null,
      'network'
    );
    return handleError(error, 'network');
  }, [handleError]);

  /**
   * Clear all errors
   */
  const clearErrors = useCallback(() => {
    setErrors([]);
  }, []);

  /**
   * Clear specific error by ID
   */
  const clearError = useCallback((errorId) => {
    setErrors(prev => prev.filter(error => error.id !== errorId));
  }, []);

  /**
   * Get errors by type
   */
  const getErrorsByType = useCallback((type) => {
    return errors.filter(error => error.type === type);
  }, [errors]);

  /**
   * Get errors by severity
   */
  const getErrorsBySeverity = useCallback((severity) => {
    return errors.filter(error => error.severity === severity);
  }, [errors]);

  /**
   * Check if there are any critical errors
   */
  const hasCriticalErrors = useCallback(() => {
    return errors.some(error => error.severity === 'critical');
  }, [errors]);

  /**
   * Get error summary
   */
  const getErrorSummary = useCallback(() => {
    const summary = {
      total: errors.length,
      byType: {},
      bySeverity: {
        low: 0,
        medium: 0,
        high: 0,
        critical: 0
      },
      recent: errors.filter(error => {
        const errorTime = new Date(error.timestamp);
        const now = new Date();
        return (now - errorTime) < 5 * 60 * 1000; // Last 5 minutes
      }).length
    };

    errors.forEach(error => {
      // Count by type
      summary.byType[error.type] = (summary.byType[error.type] || 0) + 1;
      
      // Count by severity
      if (summary.bySeverity[error.severity] !== undefined) {
        summary.bySeverity[error.severity]++;
      }
    });

    return summary;
  }, [errors]);

  /**
   * Create error handler for specific context
   */
  const createContextualErrorHandler = useCallback((context, options = {}) => {
    return createErrorHandler({
      onError: async (error) => {
        await handleError(error, context, options);
      },
      onRetry: onRetry,
      onFallback: onFallback,
      logErrors,
      showUserMessage: showUserMessages
    });
  }, [handleError, onRetry, onFallback, logErrors, showUserMessages]);

  return {
    // Error handling functions
    handleError,
    handleAsyncError,
    handleValidationError,
    handleBusinessError,
    handleNotFoundError,
    handleDuplicateError,
    handlePermissionError,
    handleNetworkError,
    
    // Error management
    clearErrors,
    clearError,
    getErrorsByType,
    getErrorsBySeverity,
    hasCriticalErrors,
    getErrorSummary,
    
    // Contextual error handler
    createContextualErrorHandler,
    
    // State
    errors,
    isRetrying,
    retryCount: retryCountRef.current,
    
    // Utilities
    getRecoveryStrategy,
    RECOVERY_STRATEGIES
  };
};

/**
 * Hook for handling form validation errors
 */
export const useValidationErrorHandler = () => {
  const { handleValidationError, clearErrors } = useErrorHandler({
    showUserMessages: false // Don't show toast for validation errors
  });

  const handleFieldError = useCallback((field, message) => {
    return handleValidationError(`Field '${field}': ${message}`, { field });
  }, [handleValidationError]);

  const handleRequiredFieldError = useCallback((field) => {
    return handleValidationError(`Field '${field}' is required`, { field, type: 'required' });
  }, [handleValidationError]);

  const handleFormatError = useCallback((field, expectedFormat) => {
    return handleValidationError(`Field '${field}' has invalid format. Expected: ${expectedFormat}`, { 
      field, 
      type: 'format',
      expectedFormat 
    });
  }, [handleValidationError]);

  const handleRangeError = useCallback((field, min, max) => {
    return handleValidationError(`Field '${field}' must be between ${min} and ${max}`, { 
      field, 
      type: 'range',
      min,
      max 
    });
  }, [handleValidationError]);

  return {
    handleFieldError,
    handleRequiredFieldError,
    handleFormatError,
    handleRangeError,
    clearErrors
  };
};

/**
 * Hook for handling API errors
 */
export const useApiErrorHandler = () => {
  const { handleAsyncError, handleNetworkError, handleError } = useErrorHandler();

  const handleApiError = useCallback(async (apiCall, context = '') => {
    return await handleAsyncError(apiCall, context, {
      maxRetries: 3,
      retryDelay: 1000,
      retryCondition: (error) => {
        return error.type === ERROR_TYPES.NETWORK_ERROR || 
               error.type === ERROR_TYPES.SERVER_ERROR ||
               error.type === ERROR_TYPES.TIMEOUT_ERROR;
      }
    });
  }, [handleAsyncError]);

  const handleApiResponseError = useCallback((response, context = '') => {
    const error = createServiceError(
      response.message || `API request failed with status ${response.status}`,
      response.status >= 500 ? ERROR_TYPES.SERVER_ERROR : ERROR_TYPES.API_ERROR,
      response.status,
      null,
      context,
      { details: { status: response.status, url: response.url } }
    );
    return handleError(error, context);
  }, [handleError]);

  return {
    handleApiError,
    handleApiResponseError,
    handleNetworkError
  };
};