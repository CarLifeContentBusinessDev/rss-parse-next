import { ChevronDown } from 'lucide-react';

import { cn } from '@/lib/utils';

type SelectOption = {
  label: string;
  value: string;
};

export function Select({
  value,
  onValueChange,
  options,
  className,
  disabled,
}: {
  value: string;
  onValueChange: (value: string) => void;
  options: SelectOption[];
  className?: string;
  disabled?: boolean;
}) {
  return (
    <div className={cn('relative', className)}>
      <select
        value={value}
        onChange={(event) => onValueChange(event.target.value)}
        disabled={disabled}
        className='flex h-11 w-full appearance-none rounded-xl border border-zinc-200 bg-white px-3 py-2 pr-10 text-sm text-zinc-900 shadow-sm outline-none transition focus-visible:border-teal-500 focus-visible:ring-4 focus-visible:ring-teal-100 disabled:cursor-not-allowed disabled:opacity-50'
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown className='pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-zinc-500' />
    </div>
  );
}
