export function ProgressBar({ value }: Readonly<{ value: number }>) {
  return (
    <div className='mt-4 h-2.5 w-full overflow-hidden rounded-full bg-zinc-200/80'>
      <div
        className='h-full rounded-full bg-gradient-to-r from-teal-500 via-emerald-500 to-cyan-500 transition-all duration-300'
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  );
}
