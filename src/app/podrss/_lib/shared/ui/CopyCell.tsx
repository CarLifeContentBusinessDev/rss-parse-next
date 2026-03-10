import { useState } from 'react';
import { Check, Copy } from 'lucide-react';

import { Button } from '@/components/ui/button';

interface CopyCellProps {
  value: string;
}

export const CopyCell = ({ value }: CopyCellProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className='group flex items-center justify-center gap-2'>
      <span className='max-w-60 truncate font-medium text-zinc-700'>{value}</span>
      {value ? (
        <Button
          type='button'
          variant='ghost'
          size='sm'
          onClick={handleCopy}
          className='h-7 px-2 opacity-0 transition group-hover:opacity-100'
        >
          {copied ? (
            <Check className='h-3.5 w-3.5 text-emerald-600' />
          ) : (
            <Copy className='h-3.5 w-3.5' />
          )}
        </Button>
      ) : null}
    </div>
  );
};
