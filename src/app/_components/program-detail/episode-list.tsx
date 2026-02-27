import { useState } from 'react';
import type { AudioControls, AudioState } from 'react-global-audio';

import { EpisodeItem } from './types';
const AUDIO_TITLE_MAP_KEY = 'globalAudioTitleMap';

type EpisodePatch = {
  title?: string | null;
  date?: string | null;
  duration?: string | null;
  audio_file?: string | null;
  img_url?: string | null;
};

type EpisodeListProps = {
  episodes: EpisodeItem[];
  loading: boolean;
  audioState: AudioState;
  controls: AudioControls;
  processingEpisodeId: number | null;
  savingEpisodeId: number | null;
  deletingEpisodeId: number | null;
  onReprocessEpisode: (episodeId: number) => Promise<void>;
  onSaveEpisode: (episodeId: number, patch: EpisodePatch) => Promise<void>;
  onDeleteEpisode: (episodeId: number) => Promise<void>;
};

export function EpisodeList({
  episodes,
  loading,
  audioState,
  controls,
  processingEpisodeId,
  savingEpisodeId,
  deletingEpisodeId,
  onReprocessEpisode,
  onSaveEpisode,
  onDeleteEpisode,
}: EpisodeListProps) {
  const [editingEpisodeId, setEditingEpisodeId] = useState<number | null>(null);
  const [draft, setDraft] = useState<EpisodePatch>({
    title: '',
    date: '',
    duration: '',
    audio_file: '',
    img_url: '',
  });

  if (episodes.length === 0) {
    return <p className='text-sm text-zinc-500'>{loading ? 'Loading episodes...' : 'No episodes found.'}</p>;
  }

  return (
    <div className='space-y-3'>
      {episodes.map((episode) => (
        <article
          key={episode.id}
          className='rounded-xl border border-zinc-200 bg-white p-3 shadow-[0_4px_12px_rgba(0,0,0,0.03)]'
        >
          <div className='min-w-0'>
            <p className='truncate text-sm font-semibold text-zinc-900'>{episode.title}</p>

            <div className='mt-2 flex flex-wrap gap-2 text-xs text-zinc-600'>
              <span className='rounded-md bg-zinc-100 px-2 py-1'>id: {episode.id}</span>
              <span className='rounded-md bg-zinc-100 px-2 py-1'>date: {episode.date ?? '-'}</span>
              <span className='rounded-md bg-zinc-100 px-2 py-1'>duration: {episode.duration ?? '-'}</span>
            </div>

            <div className='mt-3 flex flex-wrap gap-2'>
              {episode.audio_file ? (
                (() => {
                  const audioSrc = episode.audio_file;
                  return (
                    <>
                      <button
                        type='button'
                        onClick={() => {
                          if (audioState.src === audioSrc && audioState.isPlaying) {
                            controls.pause();
                            return;
                          }
                          if (typeof window !== 'undefined') {
                            const raw = window.sessionStorage.getItem(AUDIO_TITLE_MAP_KEY);
                            const parsed = raw ? (JSON.parse(raw) as Record<string, string>) : {};
                            parsed[audioSrc] = episode.title;
                            window.sessionStorage.setItem(AUDIO_TITLE_MAP_KEY, JSON.stringify(parsed));
                          }
                          void controls.play(audioSrc);
                        }}
                        className='cursor-pointer rounded-lg bg-teal-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-teal-500'
                      >
                        {audioState.src === audioSrc && audioState.isPlaying ? 'Pause' : 'Play'}
                      </button>
                      <a
                        href={audioSrc}
                        target='_blank'
                        rel='noreferrer'
                        className='rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm font-semibold text-zinc-700 hover:bg-zinc-50'
                      >
                        Open URL
                      </a>
                      <button
                        type='button'
                        onClick={() => {
                          void onReprocessEpisode(episode.id);
                        }}
                        disabled={processingEpisodeId === episode.id}
                        className='cursor-pointer rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60'
                      >
                        {processingEpisodeId === episode.id ? 'Processing...' : 'Reprocess'}
                      </button>
                      <button
                        type='button'
                        onClick={() => {
                          setEditingEpisodeId(episode.id);
                          setDraft({
                            title: episode.title ?? '',
                            date: episode.date ?? '',
                            duration: episode.duration ?? '',
                            audio_file: episode.audio_file ?? '',
                            img_url: episode.img_url ?? '',
                          });
                        }}
                        className='cursor-pointer rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm font-semibold text-zinc-700 hover:bg-zinc-50'
                      >
                        Edit
                      </button>
                      <button
                        type='button'
                        onClick={() => {
                          if (!window.confirm(`Delete episode ${episode.id}?`)) return;
                          void onDeleteEpisode(episode.id);
                        }}
                        disabled={deletingEpisodeId === episode.id}
                        className='cursor-pointer rounded-lg border border-rose-300 bg-rose-50 px-3 py-1.5 text-sm font-semibold text-rose-700 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60'
                      >
                        {deletingEpisodeId === episode.id ? 'Deleting...' : 'Delete'}
                      </button>
                    </>
                  );
                })()
              ) : (
                <span className='rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-sm text-zinc-500'>
                  No audio URL
                </span>
              )}
            </div>

            {editingEpisodeId === episode.id ? (
              <div className='mt-3 rounded-lg border border-zinc-200 bg-zinc-50 p-3'>
                <p className='text-xs font-semibold text-zinc-700'>Manual Edit</p>
                <div className='mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2'>
                  <input
                    value={draft.title ?? ''}
                    onChange={(event) => setDraft((prev) => ({ ...prev, title: event.target.value }))}
                    placeholder='Title'
                    className='rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm'
                  />
                  <input
                    value={draft.date ?? ''}
                    onChange={(event) => setDraft((prev) => ({ ...prev, date: event.target.value }))}
                    placeholder='Date'
                    className='rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm'
                  />
                  <input
                    value={draft.duration ?? ''}
                    onChange={(event) => setDraft((prev) => ({ ...prev, duration: event.target.value }))}
                    placeholder='Duration'
                    className='rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm'
                  />
                  <input
                    value={draft.img_url ?? ''}
                    onChange={(event) => setDraft((prev) => ({ ...prev, img_url: event.target.value }))}
                    placeholder='Image URL'
                    className='rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm'
                  />
                  <input
                    value={draft.audio_file ?? ''}
                    onChange={(event) => setDraft((prev) => ({ ...prev, audio_file: event.target.value }))}
                    placeholder='Audio URL'
                    className='rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm sm:col-span-2'
                  />
                </div>
                {(() => {
                  const normalizedOriginal = {
                    title: episode.title ?? '',
                    date: episode.date ?? '',
                    duration: episode.duration ?? '',
                    audio_file: episode.audio_file ?? '',
                    img_url: episode.img_url ?? '',
                  };
                  const normalizedDraft = {
                    title: draft.title ?? '',
                    date: draft.date ?? '',
                    duration: draft.duration ?? '',
                    audio_file: draft.audio_file ?? '',
                    img_url: draft.img_url ?? '',
                  };
                  const hasChanges =
                    normalizedOriginal.title !== normalizedDraft.title ||
                    normalizedOriginal.date !== normalizedDraft.date ||
                    normalizedOriginal.duration !== normalizedDraft.duration ||
                    normalizedOriginal.audio_file !== normalizedDraft.audio_file ||
                    normalizedOriginal.img_url !== normalizedDraft.img_url;

                  return (
                    <div className='mt-2 flex gap-2'>
                      <button
                        type='button'
                        onClick={() => {
                          void onSaveEpisode(episode.id, draft);
                        }}
                        disabled={savingEpisodeId === episode.id || !hasChanges}
                        className='rounded-lg bg-zinc-900 px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-60'
                      >
                        {savingEpisodeId === episode.id ? 'Saving...' : 'Save'}
                      </button>
                      <button
                        type='button'
                        onClick={() => setEditingEpisodeId(null)}
                        className='cursor-pointer rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm font-semibold text-zinc-700'
                      >
                        Cancel
                      </button>
                    </div>
                  );
                })()}
              </div>
            ) : null}
          </div>
        </article>
      ))}
    </div>
  );
}
