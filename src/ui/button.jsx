import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cn } from '../lib/cn';
import { buttonVariants } from './button-variants';

function Button({ className, variant, size, asChild = false, type = 'button', ...props }) {
  const Comp = asChild ? Slot : 'button';
  return (
    <Comp
      data-slot="button"
      type={asChild ? undefined : type}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

Button.displayName = 'Button';

export { Button, buttonVariants };
