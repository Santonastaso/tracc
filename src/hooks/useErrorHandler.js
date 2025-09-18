import { useCallback } from 'react';
import { showError } from '../utils/toast';

/**
 * Simplified error handler for the tracc project
 */
export const useErrorHandler = (context = '') => {
  
  /**
   * Handle errors with consistent logging and user feedback
   */
  const handleError = useCallback((error, options = {}) => {
    const {
      showUserAlert = true,
      fallbackMessage = 'An unexpected error occurred'
    } = options;

    const errorMessage = error?.message || fallbackMessage;
    
    if (showUserAlert) {
      showError(errorMessage);
    }

    console.error(`[${context}] Error:`, error);
    
    return {
      message: errorMessage,
      originalError: error
    };
  }, [context]);

  /**
   * Handle async operations with automatic error handling
   */
  const handleAsync = useCallback(async (asyncOperation, options = {}) => {
    const {
      showUserAlert = true,
      fallbackMessage = 'Operation failed'
    } = options;

    try {
      return await asyncOperation();
    } catch (error) {
      const appError = handleError(error, {
        showUserAlert,
        fallbackMessage
      });
      throw appError;
    }
  }, [handleError]);

  return {
    handleError,
    handleAsync
  };
};

export default useErrorHandler;