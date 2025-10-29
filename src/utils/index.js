// Re-export from shared utils
export { 
  showSuccess, 
  showError, 
  showWarning, 
  showInfo, 
  showValidationError,
  formatUtcDate,
  formatUtcDateTime
} from '@santonastaso/shared';

// Unified confirmation (sync wrapper for now)
export const confirmAction = (message) => {
  return window.confirm(message);
};