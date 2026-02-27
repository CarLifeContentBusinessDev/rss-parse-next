import { ProgramDetail } from '../_types/types';

type ProgramSummaryCardProps = {
  program: ProgramDetail;
};

export function ProgramSummaryCard({ program }: ProgramSummaryCardProps) {
  return (
    <div className='grid grid-cols-1 gap-4 sm:grid-cols-[120px_minmax(0,1fr)]'>
      <div className='h-[120px] w-[120px] overflow-hidden rounded-xl bg-zinc-100'>
        {program.img_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={program.img_url} alt={program.title} className='h-full w-full object-cover' />
        ) : (
          <div className='flex h-full w-full items-center justify-center text-xs text-zinc-500'>No Image</div>
        )}
      </div>

      <div>
        <h2 className='text-lg font-semibold text-zinc-900'>{program.title}</h2>
        {program.subtitle ? <p className='mt-1 text-sm text-zinc-600'>{program.subtitle}</p> : null}
        <div className='mt-3 flex flex-wrap gap-2 text-xs text-zinc-700'>
          <span className='rounded-md bg-zinc-100 px-2 py-1'>id: {program.id}</span>
          <span className='rounded-md bg-zinc-100 px-2 py-1'>rank: {program.popularOrder ?? '-'}</span>
          <span className='rounded-md bg-zinc-100 px-2 py-1'>theme: {program.popularThemeId ?? '-'}</span>
          <span className='rounded-md bg-zinc-100 px-2 py-1'>duration: {program.latestDuration ?? '-'}</span>
          {program.type ? <span className='rounded-md bg-zinc-100 px-2 py-1'>{program.type}</span> : null}
          {program.language ? (
            <span className='rounded-md bg-zinc-100 px-2 py-1'>
              {Array.isArray(program.language) ? program.language.join(', ') : program.language}
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}
