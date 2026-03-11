import { JobHistoryEntry } from '../_lib/sync-types';

function formatHistoryTime(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

export function JobHistory({
  entries,
  title = 'Execution History',
}: {
  entries: JobHistoryEntry[];
  title?: string;
}) {
  if (entries.length === 0) return null;

  return (
    <section className='rounded-3xl border border-zinc-200 bg-white px-5 py-4 shadow-[0_12px_30px_rgba(15,23,42,0.04)]'>
      <p className='text-sm font-semibold text-zinc-900'>{title}</p>
      <div className='mt-3 space-y-2'>
        {entries.map((entry) => (
          <div
            key={entry.id}
            className='rounded-2xl border border-zinc-100 bg-zinc-50/80 px-3 py-2 text-xs text-zinc-700'
          >
            <div className='flex items-center justify-between gap-3'>
              <span className='font-medium text-zinc-900'>{entry.label}</span>
              <span className='shrink-0 text-zinc-500'>{formatHistoryTime(entry.at)}</span>
            </div>
            {entry.detail ? <p className='mt-1 text-zinc-600'>{entry.detail}</p> : null}
          </div>
        ))}
      </div>
    </section>
  );
}
