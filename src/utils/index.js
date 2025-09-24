import { toast } from 'sonner';

export const showSuccess = (message) => {
  toast.success(message);
};

export const showError = (message) => {
  toast.error(message);
};

export const showWarning = (message) => {
  toast.warning(message);
};

export const showInfo = (message) => {
  toast.info(message);
};

export const showValidationError = (errors) => {
  if (Array.isArray(errors)) {
    errors.forEach(error => toast.error(error));
  } else {
    toast.error(errors);
  }
};

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