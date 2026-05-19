let confirmImpl = null;

export function registerConfirm(fn) {
  confirmImpl = fn;
}

/**
 * @param {string} message
 * @param {{ title?: string; confirmLabel?: string; cancelLabel?: string; variant?: 'default' | 'destructive' }} [options]
 * @returns {Promise<boolean>}
 */
export function confirmAction(message, options = {}) {
  if (confirmImpl) {
    return confirmImpl({
      title: options.title ?? 'Conferma',
      message,
      confirmLabel: options.confirmLabel ?? 'OK',
      cancelLabel: options.cancelLabel ?? 'Annulla',
      variant: options.variant ?? 'default',
    });
  }
  return Promise.resolve(window.confirm(message));
}

/**
 * @param {string} [label]
 * @returns {Promise<boolean>}
 */
export function confirmDelete(label = 'questo elemento') {
  return confirmAction(`Sei sicuro di voler eliminare ${label}?`, {
    title: 'Conferma eliminazione',
    confirmLabel: 'Elimina',
    variant: 'destructive',
  });
}
