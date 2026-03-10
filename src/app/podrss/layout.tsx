import type { ReactNode } from 'react';
import { Toaster } from 'react-hot-toast';

import { ConsoleShell } from '@/app/_components/console-shell';

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <>
      <Toaster
        position='top-right'
        toastOptions={{
          style: {
            fontSize: '14px',
          },
        }}
      />
      <ConsoleShell>{children}</ConsoleShell>
    </>
  );
}
