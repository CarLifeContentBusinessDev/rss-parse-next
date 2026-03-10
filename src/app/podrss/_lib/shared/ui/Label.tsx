import { ReactNode } from 'react';

import { Label as BaseLabel } from '@/components/ui/label';

export const Label = ({
  children,
  required,
  htmlFor,
}: {
  children: ReactNode;
  required?: boolean;
  htmlFor?: string;
}) => (
  <BaseLabel htmlFor={htmlFor} className='mb-1.5 block'>
    {children}
    {required ? <span className='ml-0.5 text-teal-600'>*</span> : null}
  </BaseLabel>
);
