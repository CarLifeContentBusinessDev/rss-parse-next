import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: 'RSS Parse Next',
  description: 'Run RSS sync jobs from a simple web UI',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='ko'>
      <body className='antialiased'>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

