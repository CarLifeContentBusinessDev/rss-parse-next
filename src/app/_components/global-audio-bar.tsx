'use client';

import { useMemo } from 'react';
import { useGlobalAudio } from 'react-global-audio';

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return '00:00';
  const total = Math.floor(seconds);
  const min = Math.floor(total / 60);
  const sec = total % 60;
  return `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

function getTrackName(src: string | null) {
  if (!src) return 'No track selected';
  try {
    const url = new URL(src);
    const last = url.pathname.split('/').filter(Boolean).pop();
    return last ?? src;
  } catch {
    return src;
  }
}

export function GlobalAudioBar() {
  const { state, controls } = useGlobalAudio({
    rememberProgress: true,
    storage: 'sessionStorage',
  });

  const duration = Number.isFinite(state.duration) && state.duration > 0 ? state.duration : 0;
  const currentTime = useMemo(
    () => Math.min(Math.max(state.currentTime, 0), duration || state.currentTime || 0),
    [duration, state.currentTime],
  );
  const hasTrack = Boolean(state.src);

  return (
    <div className='fixed right-4 bottom-4 left-4 z-50 rounded-2xl border border-zinc-200 bg-white/95 p-3 shadow-[0_20px_40px_rgba(2,6,23,0.18)] backdrop-blur'>
      <div className='flex flex-wrap items-center gap-2'>
        <button
          type='button'
          onClick={() => {
            if (!hasTrack) return;
            if (state.isPlaying) {
              controls.pause();
              return;
            }
            void controls.play();
          }}
          disabled={!hasTrack}
          className='rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40'
        >
          {state.isPlaying ? 'Pause' : 'Play'}
        </button>
        <button
          type='button'
          onClick={() => controls.pause()}
          disabled={!hasTrack}
          className='rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 disabled:cursor-not-allowed disabled:opacity-40'
        >
          Pause
        </button>
        <button
          type='button'
          onClick={() => controls.stop()}
          disabled={!hasTrack}
          className='rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 disabled:cursor-not-allowed disabled:opacity-40'
        >
          Reset
        </button>
        <p className='min-w-0 flex-1 truncate text-sm font-medium text-zinc-700'>{getTrackName(state.src)}</p>
      </div>

      <div className='mt-2 grid grid-cols-[56px_minmax(0,1fr)_56px] items-center gap-2 text-xs text-zinc-600'>
        <span>{formatTime(currentTime)}</span>
        <input
          type='range'
          min={0}
          max={duration || 0}
          step={0.1}
          value={duration ? currentTime : 0}
          onChange={(event) => controls.seek(Number(event.target.value))}
          disabled={!hasTrack || !duration}
          className='w-full accent-teal-600 disabled:cursor-not-allowed'
        />
        <span className='text-right'>{formatTime(duration)}</span>
      </div>
    </div>
  );
}
