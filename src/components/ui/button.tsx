import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap font-sans font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default:
          'bg-primary text-on-primary hover:bg-[#3d4d41] dark:hover:bg-primary-fixed-dim rounded-xl shadow-none',
        outline:
          'border border-outline-variant/50 bg-transparent text-on-surface hover:bg-surface-container rounded-xl',
        ghost:
          'bg-transparent text-on-surface hover:bg-surface-container rounded-lg',
        link: 'text-primary underline-offset-4 hover:underline p-0 h-auto',
        destructive:
          'bg-error text-on-error hover:bg-error/90 rounded-xl',
        secondary:
          'bg-surface-container text-on-surface hover:bg-surface-container-high rounded-xl',
      },
      size: {
        default: 'h-11 px-8 py-3 text-sm',
        sm: 'h-9 px-4 text-sm',
        lg: 'h-13 px-10 py-4 text-base',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
