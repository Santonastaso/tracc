import { toast } from 'sonner';

export function showValidationError(errors) {
  if (!errors || (Array.isArray(errors) && errors.length === 0)) return;

  let errorMessage;
  if (Array.isArray(errors)) {
    const validErrors = errors.filter((e) => e && e.trim().length > 0);
    if (validErrors.length === 0) return;
    errorMessage =
      validErrors.length === 1
        ? validErrors[0]
        : `There are ${validErrors.length} validation errors:\n\n• ${validErrors.join('\n• ')}`;
  } else {
    errorMessage = errors;
  }

  toast.error(errorMessage, {
    duration: 10000,
    position: 'top-right',
    style: { maxWidth: '400px', whiteSpace: 'pre-line' },
  });
}

export const showSuccess = (message) => toast.success(message);
export const showError = (message) => toast.error(message);
