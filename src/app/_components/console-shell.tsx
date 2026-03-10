import { ReactNode } from 'react';

import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

import { LogoutButton } from './auth/logout-button';
import { GlobalAudioBar } from './global-audio-bar';
import { UploadModeNav } from './upload-mode-nav';

export function ConsoleShell({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <main className='mx-auto flex min-h-screen w-full max-w-[1700px] flex-col gap-6 px-5 py-10 pb-28 sm:px-8 xl:px-10'>
      <Card className='relative overflow-hidden p-6'>
        <div className='pointer-events-none absolute -top-12 -right-8 h-36 w-36 rounded-full bg-cyan-200/60 blur-2xl' />
        <div className='pointer-events-none absolute -bottom-16 -left-10 h-40 w-40 rounded-full bg-teal-200/60 blur-2xl' />
        <div className='relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between'>
          <div>
            <Badge variant='secondary'>오디오 콘솔</Badge>
            <h1 className='mt-3 text-3xl font-semibold tracking-tight text-zinc-900'>
              RSS 동기화와 PodRSS 작업
            </h1>
            <p className='mt-2 max-w-2xl text-sm leading-relaxed text-zinc-600'>
              RSS와 Excel 동기화 작업을 실행하고, 콘텐츠 데이터를 확인하고, PodRSS 조회 도구를
              하나의 공통 콘솔에서 사용할 수 있습니다.
            </p>
          </div>
          <div className='flex items-center gap-3'>
            <LogoutButton />
          </div>
        </div>
      </Card>

      <section className='grid grid-cols-1 gap-6 xl:grid-cols-[292px_minmax(0,1fr)]'>
        <UploadModeNav />
        <div className='min-w-0'>{children}</div>
      </section>
      <GlobalAudioBar />
    </main>
  );
}
