import { toast } from 'sonner';

/**
 * Unified toast notification system
 * Combines the best features from both tracc and scheduler_demo
 */

/**
 * Show a validation error toast with formatted error messages
 * @param {string|Array} errors - Error message(s) to display
 */
export const showValidationError = (errors: string | string[]) => {
  if (!errors || (Array.isArray(errors) && errors.length === 0)) {
    return;
  }
  
  let errorMessage: string;
  
  if (Array.isArray(errors)) {
    // Filter out empty errors and format nicely
    const validErrors = errors.filter(error => error && error.trim().length > 0);
    
    if (validErrors.length === 0) {
      return;
    }
    
    if (validErrors.length === 1) {
      errorMessage = validErrors[0];
    } else {
      errorMessage = `There are ${validErrors.length} validation errors:\n\n• ${validErrors.join('\n• ')}`;
    }
  } else {
    errorMessage = errors;
  }
  
  toast.error(errorMessage, {
    duration: 10000, // Validation errors stay longer
    position: 'top-right',
    style: {
      maxWidth: '400px',
      whiteSpace: 'pre-line'
    }
  });
};

// Standard toast functions
export const showSuccess = (message: string) => {
  toast.success(message);
};

export const showError = (message: string) => {
  toast.error(message);
};

export const showWarning = (message: string) => {
  toast.warning(message);
};

export const showInfo = (message: string) => {
  toast.info(message);
};

// Advanced toast functions
export const showToast = toast;
export const dismissAll = toast.dismiss;
export const dismiss = toast.dismiss;
