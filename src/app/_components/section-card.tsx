import { ReactNode } from 'react';

export function SectionCard({
  title,
  subtitle,
  children,
}: Readonly<{ title: string; subtitle?: string; children: ReactNode }>) {
  return (
    <section className='rounded-2xl border border-zinc-200/80 bg-white/85 p-5 shadow-[0_8px_24px_rgba(0,0,0,0.04)] backdrop-blur'>
      <h2 className='text-base font-semibold tracking-tight text-zinc-900'>{title}</h2>
      {subtitle ? <p className='mt-1 text-xs text-zinc-500'>{subtitle}</p> : null}
      <div className='mt-4'>{children}</div>
    </section>
  );
}
