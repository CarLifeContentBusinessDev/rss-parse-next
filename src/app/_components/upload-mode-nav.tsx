'use client';

import { ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useMemo, useState } from 'react';

import { uploadModeMeta, uploadModes } from '../_lib/upload-modes';

export function UploadModeNav() {
  const pathname = usePathname();
  const hasActivePodrssChild = useMemo(
    () => uploadModeMeta.podrss.children?.some((child) => pathname === child.href) ?? false,
    [pathname],
  );
  const [isPodrssOpen, setIsPodrssOpen] = useState(pathname.startsWith('/podrss'));

  return (
    <aside className='rounded-2xl border border-zinc-200/80 bg-white/85 p-4 shadow-[0_8px_24px_rgba(0,0,0,0.04)] backdrop-blur'>
      <h2 className='text-sm font-semibold text-zinc-900'>Console Menu</h2>
      <p className='mt-1 text-xs text-zinc-500'>Choose one workflow. Add more items here later.</p>
      <div className='mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-1'>
        {uploadModes.map((mode) => {
          const meta = uploadModeMeta[mode];
          const active =
            pathname === meta.href ||
            (mode === 'podrss' && (pathname.startsWith('/podrss') || hasActivePodrssChild));

          if (mode === 'podrss') {
            return (
              <div
                key={mode}
                className={`rounded-xl border px-3 py-2 transition ${
                  active
                    ? 'border-teal-600 bg-teal-50 text-teal-900'
                    : 'border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50'
                }`}
              >
                <button
                  type='button'
                  onClick={() => setIsPodrssOpen((prev) => !prev)}
                  className='flex w-full items-center justify-between text-left'
                >
                  <div>
                    <p className='text-sm font-semibold'>{meta.title}</p>
                    <p className='mt-1 text-xs text-zinc-500'>{meta.description}</p>
                  </div>
                  <ChevronDown
                    className={`h-4 w-4 transition-transform ${isPodrssOpen ? 'rotate-180' : ''}`}
                  />
                </button>
                {isPodrssOpen && (
                  <div className='mt-2 space-y-1 border-t border-zinc-200/80 pt-2'>
                    {meta.children?.map((child) => {
                      const childActive = pathname === child.href;
                      return (
                        <Link
                          key={child.href}
                          href={child.href}
                          aria-current={childActive ? 'page' : undefined}
                          className={`block rounded-lg px-2 py-1.5 text-xs transition ${
                            childActive
                              ? 'bg-teal-100 text-teal-900'
                              : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
                          }`}
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
              className={`rounded-xl border px-3 py-2 text-left transition ${
                active
                  ? 'border-teal-600 bg-teal-50 text-teal-900'
                  : 'border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50'
              }`}
            >
              <p className='text-sm font-semibold'>{meta.title}</p>
              <p className='mt-1 text-xs text-zinc-500'>{meta.description}</p>
            </Link>
          );
        })}
      </div>
    </aside>
  );
}
