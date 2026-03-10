import * as React from 'react';

import { cn } from '@/lib/utils';

type ButtonVariant = 'default' | 'secondary' | 'outline' | 'ghost' | 'destructive';
type ButtonSize = 'default' | 'sm' | 'lg';

const variantClasses: Record<ButtonVariant, string> = {
  default:
    'bg-zinc-950 text-white shadow-[0_10px_25px_rgba(15,23,42,0.18)] hover:bg-zinc-800 focus-visible:ring-zinc-400',
  secondary:
    'bg-teal-600 text-white shadow-[0_10px_25px_rgba(13,148,136,0.22)] hover:bg-teal-500 focus-visible:ring-teal-300',
  outline:
    'border border-zinc-200 bg-white text-zinc-900 hover:bg-zinc-50 focus-visible:ring-zinc-300',
  ghost: 'bg-transparent text-zinc-700 hover:bg-zinc-100 focus-visible:ring-zinc-300',
  destructive:
    'bg-rose-600 text-white shadow-[0_10px_25px_rgba(225,29,72,0.22)] hover:bg-rose-500 focus-visible:ring-rose-300',
};

const sizeClasses: Record<ButtonSize, string> = {
  default: 'h-10 px-4 py-2',
  sm: 'h-9 rounded-md px-3',
  lg: 'h-11 rounded-xl px-6 text-sm',
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = 'default', size = 'default', type = 'button', ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-lg text-sm font-medium transition-colors outline-none focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50',
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      {...props}
    />
  );
});
