import { ReactNode } from 'react';

import { ConsoleShell } from '../_components/console-shell';

export default function SyncLayout({ children }: Readonly<{ children: ReactNode }>) {
  return <ConsoleShell>{children}</ConsoleShell>;
}
