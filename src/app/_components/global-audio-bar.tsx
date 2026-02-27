'use client';

import { useMemo, useState } from 'react';
import { useGlobalAudio } from 'react-global-audio';
import { CloseIcon, MinimizeIcon, PauseIcon, PlayIcon, ResetIcon } from './icons/audio-icons';

const AUDIO_TITLE_MAP_KEY = 'globalAudioTitleMap';

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return '00:00';
  const total = Math.floor(seconds);
  const min = Math.floor(total / 60);
  const sec = total % 60;
  return `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

function getTrackName(src: string | null) {
  if (!src) return 'No track selected';

  if (typeof window !== 'undefined') {
    const raw = window.sessionStorage.getItem(AUDIO_TITLE_MAP_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as Record<string, string>;
        const mapped = parsed[src];
        if (mapped) return mapped;
      } catch {
        // ignore cache parse errors
      }
    }
  }

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
  const [minimizedSrc, setMinimizedSrc] = useState<string | null>(null);

  const duration = Number.isFinite(state.duration) && state.duration > 0 ? state.duration : 0;
  const currentTime = useMemo(
    () => Math.min(Math.max(state.currentTime, 0), duration || state.currentTime || 0),
    [duration, state.currentTime],
  );
  const hasTrack = Boolean(state.src);
  const minimized = Boolean(state.src && minimizedSrc === state.src);

  if (!hasTrack) {
    return null;
  }

  if (minimized) {
    return (
      <div className='fixed right-4 bottom-4 z-50'>
        <button
          type='button'
          onClick={() => setMinimizedSrc(null)}
          className='inline-flex cursor-pointer items-center gap-2 rounded-full border border-zinc-200 bg-white/95 px-3 py-2 text-sm font-semibold text-zinc-700 shadow-[0_12px_24px_rgba(2,6,23,0.18)] backdrop-blur hover:bg-zinc-50'
          aria-label='Open player'
          title='Open player'
        >
          {state.isPlaying ? <PauseIcon /> : <PlayIcon />}
          <span className='text-xs'>{state.isPlaying ? 'Playing' : 'Paused'}</span>
        </button>
      </div>
    );
  }

  return (
    <div className='fixed right-4 bottom-4 left-4 z-50 rounded-2xl border border-zinc-200 bg-white/95 p-4 shadow-[0_20px_40px_rgba(2,6,23,0.18)] backdrop-blur'>
      <div className='flex items-start justify-between gap-2'>
        <div className='min-w-0 flex-1'>
          <p className='truncate text-sm font-semibold text-zinc-900'>{getTrackName(state.src)}</p>
          <p className='mt-0.5 text-xs text-zinc-500'>
            {state.isPlaying ? 'Now playing' : 'Paused'} · {formatTime(currentTime)} / {formatTime(duration)}
          </p>
        </div>
        <div className='flex items-center gap-1'>
          <button
            type='button'
            onClick={() => setMinimizedSrc(state.src)}
            className='inline-flex cursor-pointer items-center rounded-md border border-zinc-300 bg-white p-1.5 text-zinc-600 hover:bg-zinc-50'
            aria-label='Minimize audio bar'
            title='Minimize'
          >
            <MinimizeIcon />
          </button>
          <button
            type='button'
            onClick={() => {
              controls.stop();
              controls.setSource(null);
              setMinimizedSrc(null);
            }}
            className='inline-flex cursor-pointer items-center rounded-md border border-zinc-300 bg-white p-1.5 text-zinc-600 hover:bg-zinc-50'
            aria-label='Close audio bar'
            title='Close'
          >
            <CloseIcon />
          </button>
        </div>
      </div>

      <div className='mt-3 grid grid-cols-[44px_minmax(0,1fr)_44px] items-center gap-2 text-xs text-zinc-600'>
        <span>{formatTime(currentTime)}</span>
        <input
          type='range'
          min={0}
          max={duration || 0}
          step={0.1}
          value={duration ? currentTime : 0}
          onChange={(event) => controls.seek(Number(event.target.value))}
          disabled={!duration}
          className='w-full accent-teal-600 disabled:cursor-not-allowed'
        />
        <span className='text-right'>{formatTime(duration)}</span>
      </div>

      <div className='mt-3 flex flex-wrap items-center justify-center gap-2'>
        <button
          type='button'
          onClick={() => {
            if (state.isPlaying) {
              controls.pause();
              return;
            }
            void controls.play();
          }}
          className='inline-flex cursor-pointer items-center rounded-lg bg-zinc-900 p-2.5 text-white hover:bg-zinc-800'
          aria-label={state.isPlaying ? 'Pause' : 'Play'}
          title={state.isPlaying ? 'Pause' : 'Play'}
        >
          {state.isPlaying ? <PauseIcon /> : <PlayIcon />}
        </button>
        <button
          type='button'
          onClick={() => controls.stop()}
          className='inline-flex cursor-pointer items-center rounded-lg border border-zinc-300 bg-white p-2.5 text-zinc-700 hover:bg-zinc-50'
          aria-label='Reset'
          title='Reset'
        >
          <ResetIcon />
        </button>
      </div>
    </div>
  );
}
