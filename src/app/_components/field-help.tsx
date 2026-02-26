import { ReactNode } from 'react';

export function FieldHelp({ children }: Readonly<{ children: ReactNode }>) {
  return <p className='mt-1 text-xs leading-relaxed text-zinc-500'>{children}</p>;
}
