import { Download } from 'lucide-react';

import type { PodcastResult } from '@/app/podrss/_lib/entities/types';
import { getColumnsByType } from '@/app/podrss/_lib/entities/config/columns';
import { downloadExcel } from '@/app/podrss/_lib/shared/utils/downloadExcel';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { cn } from '@/lib/utils';

import { CopyButton } from './CopyButton';
import { CopyCell } from './CopyCell';

interface ResultTableProps {
  results: PodcastResult[];
  fileName?: string;
  type?: 'manualAppleId' | 'manualChannel' | 'excel' | 'topPodcast';
}

const COPYABLE_KEYS: (keyof PodcastResult)[] = ['channelName', 'appleId', 'rssUrl'];

export const ResultTable = ({
  results,
  fileName = 'result.xlsx',
  type = 'excel',
}: ResultTableProps) => {
  const handleDownloadExcel = () => {
    downloadExcel(results, fileName, type);
  };

  const columns = getColumnsByType(type);

  return (
    <Card>
      <CardHeader className='flex flex-row items-center justify-between gap-3 border-b border-zinc-200 pb-4'>
        <div className='text-sm font-medium text-zinc-600'>총 {results.length}건</div>
        <Button type='button' variant='secondary' size='sm' onClick={handleDownloadExcel}>
          <Download className='h-4 w-4' />
          엑셀 다운로드
        </Button>
      </CardHeader>
      <CardContent className='px-0 pb-0'>
        <div className='max-h-[520px] overflow-auto'>
          <table className='w-full border-collapse text-sm'>
            <thead className='sticky top-0 bg-white'>
              <tr className='border-b border-zinc-200'>
                {columns.map(({ key, label }) => (
                  <th
                    key={key}
                    className='px-4 py-3 text-center text-xs font-semibold tracking-[0.18em] text-zinc-500 uppercase'
                  >
                    <div className='flex items-center justify-center gap-2'>
                      <span>{label}</span>
                      {COPYABLE_KEYS.includes(key) ? (
                        <CopyButton text={results.map((row) => String(row[key] ?? '')).join('\n')} />
                      ) : null}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {results.map((row, rowIndex) => (
                <tr key={rowIndex} className='border-b border-zinc-100 odd:bg-zinc-50/60'>
                  {columns.map(({ key }) => (
                    <td
                      key={String(key)}
                      className={cn(
                        'px-4 py-3 text-center align-middle text-zinc-600',
                        key === 'status' &&
                          (row.status === 'SUCCESS'
                            ? 'font-semibold text-emerald-700'
                            : 'font-semibold text-rose-700'),
                      )}
                    >
                      {COPYABLE_KEYS.includes(key) ? (
                        <CopyCell value={String(row[key] ?? '')} />
                      ) : (
                        String(row[key] ?? '')
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};
