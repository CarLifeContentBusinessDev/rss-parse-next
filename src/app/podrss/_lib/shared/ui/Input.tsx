import * as React from 'react';
import { X } from 'lucide-react';

import { Input as BaseInput } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, onChange, value, ...props }, ref) {
    const handleClear = () => {
      onChange?.({
        target: { value: '' },
      } as React.ChangeEvent<HTMLInputElement>);
    };

    return (
      <div className='relative'>
        <BaseInput
          ref={ref}
          value={value}
          onChange={onChange}
          className={cn(value ? 'pr-10' : undefined, className)}
          {...props}
        />
        {value ? (
          <button
            type='button'
            onClick={handleClear}
            className='absolute top-1/2 right-3 -translate-y-1/2 text-zinc-400 transition hover:text-zinc-700'
          >
            <X className='h-4 w-4' />
          </button>
        ) : null}
      </div>
    );
  },
);
