import React, { useCallback, useEffect, useState } from 'react';
import { registerConfirm } from '../lib/confirm';
import { Button } from './button';
import { Card } from './card';

export function ConfirmProvider({ children }) {
  const [pending, setPending] = useState(null);

  const confirm = useCallback((options) => {
    return new Promise((resolve) => {
      setPending({ ...options, resolve });
    });
  }, []);

  useEffect(() => {
    registerConfirm(confirm);
    return () => registerConfirm(null);
  }, [confirm]);

  useEffect(() => {
    if (!pending) return;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        pending.resolve(false);
        setPending(null);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [pending]);

  const finish = (result) => {
    pending?.resolve(result);
    setPending(null);
  };

  return (
    <>
      {children}
      {pending && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 p-4"
          role="presentation"
          onClick={() => finish(false)}
        >
          <Card
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
            aria-describedby="confirm-message"
            className="w-full max-w-md gap-4 py-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 space-y-2">
              <h2 id="confirm-title" className="text-lg font-semibold text-foreground">
                {pending.title}
              </h2>
              <p id="confirm-message" className="text-sm text-muted-foreground">
                {pending.message}
              </p>
            </div>
            <div className="flex justify-end gap-2 px-6 pt-2">
              <Button type="button" variant="outline" onClick={() => finish(false)}>
                {pending.cancelLabel ?? 'Annulla'}
              </Button>
              <Button
                type="button"
                variant={pending.variant === 'destructive' ? 'destructive' : 'default'}
                onClick={() => finish(true)}
              >
                {pending.confirmLabel ?? 'OK'}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </>
  );
}
