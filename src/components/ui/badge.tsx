import * as React from 'react';

import { cn } from '@/lib/utils';

type BadgeVariant = 'default' | 'secondary' | 'outline';

const badgeVariants: Record<BadgeVariant, string> = {
  default: 'border-transparent bg-zinc-900 text-white',
  secondary: 'border-transparent bg-teal-100 text-teal-900',
  outline: 'border-zinc-200 bg-white text-zinc-700',
};

export function Badge({
  className,
  variant = 'default',
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { variant?: BadgeVariant }) {
  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors',
        badgeVariants[variant],
        className,
      )}
      {...props}
    />
  );
}
