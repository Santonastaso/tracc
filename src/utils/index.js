// Re-export from shared utils
export { 
  showSuccess, 
  showError, 
  showWarning, 
  showInfo, 
  showValidationError 
} from '@andrea/shared-utils';

// Date/Time formatting (UTC+0 always)
export const formatUtcDate = (isoString) => {
  if (!isoString) return '';
  const date = new Date(isoString);
  return date.toLocaleDateString('it-IT', {
    timeZone: 'UTC',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
};

export const formatUtcDateTime = (isoString) => {
  if (!isoString) return '';
  const date = new Date(isoString);
  return date.toLocaleString('it-IT', {
    timeZone: 'UTC',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Unified confirmation (sync wrapper for now)
export const confirmAction = (message) => {
  return window.confirm(message);
};