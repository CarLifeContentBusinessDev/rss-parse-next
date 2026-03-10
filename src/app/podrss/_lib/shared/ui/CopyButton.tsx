import { useState } from 'react';
import { Check, Copy } from 'lucide-react';

import { Button } from '@/components/ui/button';

interface CopyButtonProps {
  text: string;
}

export const CopyButton = ({ text }: CopyButtonProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <Button type='button' variant='ghost' size='sm' onClick={handleCopy} className='h-7 px-2'>
      {copied ? <Check className='h-3.5 w-3.5 text-emerald-600' /> : <Copy className='h-3.5 w-3.5' />}
    </Button>
  );
};
