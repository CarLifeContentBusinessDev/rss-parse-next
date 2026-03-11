'use client';

import { AudioLines, ChevronDown, DatabaseZap, FileSpreadsheet, RadioTower, Rows3 } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useMemo, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

import { uploadModeMeta, uploadModes } from '../_lib/upload-modes';

const modeIcons = {
  rss: RadioTower,
  excel: FileSpreadsheet,
  'audio-refresh': AudioLines,
  contents: Rows3,
  podrss: DatabaseZap,
} as const;

export function UploadModeNav() {
  const pathname = usePathname();
  const hasActivePodrssChild = useMemo(
    () => uploadModeMeta.podrss.children?.some((child) => pathname === child.href) ?? false,
    [pathname],
  );
  const [isPodrssOpen, setIsPodrssOpen] = useState(pathname.startsWith('/podrss'));
  const showPodrssChildren = isPodrssOpen || pathname.startsWith('/podrss');

  return (
    <Card className='overflow-hidden'>
      <CardHeader className='pb-3'>
        <Badge variant='secondary' className='w-fit'>
          작업 메뉴
        </Badge>
        <CardTitle className='text-base'>콘솔 메뉴</CardTitle>
        <p className='text-xs leading-relaxed text-zinc-500'>
          RSS, Excel, 콘텐츠 조회, PodRSS 도구 화면을 전환합니다.
        </p>
      </CardHeader>
      <CardContent className='grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-1'>
        {uploadModes.map((mode) => {
          const meta = uploadModeMeta[mode];
          const Icon = modeIcons[mode];
          const active =
            pathname === meta.href ||
            (mode === 'podrss' && (pathname.startsWith('/podrss') || hasActivePodrssChild));

          if (mode === 'podrss') {
            return (
              <div
                key={mode}
                className={cn(
                  'rounded-2xl border px-4 py-3 transition',
                  active
                    ? 'border-teal-500 bg-teal-50/90 text-teal-950 shadow-[0_12px_24px_rgba(20,184,166,0.12)]'
                    : 'border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50',
                )}
              >
                <button
                  type='button'
                  onClick={() => setIsPodrssOpen((prev) => !prev)}
                  className='flex min-h-[84px] w-full items-start justify-between gap-3 text-left'
                >
                  <div className='flex gap-3'>
                    <div className='mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-current/10 bg-white/70'>
                      <Icon className='h-4 w-4' />
                    </div>
                    <div className='min-w-0'>
                      <p className='text-sm font-semibold'>{meta.title}</p>
                      <p className='mt-1 line-clamp-2 text-xs leading-relaxed text-zinc-500'>
                        {meta.description}
                      </p>
                    </div>
                  </div>
                  <div className='pt-1'>
                    <ChevronDown
                      className={`h-4 w-4 transition-transform ${showPodrssChildren ? 'rotate-180' : ''}`}
                    />
                  </div>
                </button>
                {showPodrssChildren && (
                  <div className='mt-3 space-y-1.5 border-t border-zinc-200/80 pt-3'>
                    {meta.children?.map((child) => {
                      const childActive =
                        pathname === child.href ||
                        (pathname === uploadModeMeta.podrss.href &&
                          child.href === '/podrss/excel-channel');
                      return (
                        <Link
                          key={child.href}
                          href={child.href}
                          aria-current={childActive ? 'page' : undefined}
                          className={cn(
                            'block rounded-xl px-3 py-2 text-xs transition',
                            childActive
                              ? 'bg-teal-100 text-teal-950'
                              : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900',
                          )}
                        >
                          {child.title}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

          return (
            <Link
              key={mode}
              href={meta.href}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'rounded-2xl border px-4 py-3 text-left transition',
                active
                  ? 'border-teal-500 bg-teal-50/90 text-teal-950 shadow-[0_12px_24px_rgba(20,184,166,0.12)]'
                  : 'border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50',
              )}
            >
              <div className='flex min-h-[84px] gap-3'>
                <div className='mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-current/10 bg-white/70'>
                  <Icon className='h-4 w-4' />
                </div>
                <div className='min-w-0'>
                  <p className='text-sm font-semibold'>{meta.title}</p>
                  <p className='mt-1 line-clamp-2 text-xs leading-relaxed text-zinc-500'>
                    {meta.description}
                  </p>
                </div>
              </div>
            </Link>
          );
        })}
      </CardContent>
    </Card>
  );
}
