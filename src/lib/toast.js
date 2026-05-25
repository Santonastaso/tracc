import { toast } from 'sonner';

export const showSuccess = (message) => toast.success(message);
export const showError = (message) => toast.error(message);
