'use client';

import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { useGlobalAudio } from 'react-global-audio';

import { EpisodeList } from '../program-detail/episode-list';
import { ProgramSummaryCard } from '../program-detail/program-summary-card';
import { DetailResponse, EpisodeItem, ProgramDetail } from '../program-detail/types';
import { SectionCard } from '../section-card';

export function ProgramDetailPageClient() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();

  const id = params?.id;
  const country = (searchParams.get('country') ?? 'KO').toUpperCase();
  const tablePreset = searchParams.get('tablePreset') === 'test' ? 'test' : 'main';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [processingEpisodeId, setProcessingEpisodeId] = useState<number | null>(null);
  const [savingEpisodeId, setSavingEpisodeId] = useState<number | null>(null);
  const [deletingEpisodeId, setDeletingEpisodeId] = useState<number | null>(null);
  const [program, setProgram] = useState<ProgramDetail | null>(null);
  const [episodes, setEpisodes] = useState<EpisodeItem[]>([]);
  const { state: audioState, controls } = useGlobalAudio({
    rememberProgress: true,
    storage: 'sessionStorage',
  });

  const fetchDetail = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/content/program/${encodeURIComponent(id)}?country=${encodeURIComponent(
          country,
        )}&tablePreset=${encodeURIComponent(tablePreset)}`,
      );
      const json = (await response.json()) as DetailResponse;

      if (!json.ok || !json.data) {
        setError(json.error?.message ?? 'Failed to fetch detail');
        setProgram(null);
        setEpisodes([]);
        return;
      }

      setProgram(json.data.program);
      setEpisodes(json.data.episodes);
    } catch (detailError) {
      const message = detailError instanceof Error ? detailError.message : 'Network error';
      setError(message);
      setProgram(null);
      setEpisodes([]);
    } finally {
      setLoading(false);
    }
  }, [country, id, tablePreset]);

  useEffect(() => {
    void fetchDetail();
  }, [fetchDetail]);

  const onReprocessEpisode = async (episodeId: number) => {
    setProcessingEpisodeId(episodeId);
    setActionMessage(null);

    try {
      const response = await fetch(`/api/content/episode/${episodeId}/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          country,
          tablePreset,
        }),
      });

      const json = (await response.json()) as {
        ok: boolean;
        error?: { message: string };
        data?: { uploadedCount: number; updatedSupabaseCount: number };
      };

      if (!json.ok) {
        setActionMessage(json.error?.message ?? 'Episode reprocess failed');
        return;
      }

      setActionMessage(
        `Episode reprocessed (uploaded: ${json.data?.uploadedCount ?? 0}, updated: ${
          json.data?.updatedSupabaseCount ?? 0
        })`,
      );
      await fetchDetail();
    } catch (updateError) {
      const message = updateError instanceof Error ? updateError.message : 'Network error';
      setActionMessage(message);
    } finally {
      setProcessingEpisodeId(null);
    }
  };

  const onSaveEpisode = async (
    episodeId: number,
    patch: {
      title?: string | null;
      date?: string | null;
      duration?: string | null;
      audio_file?: string | null;
      img_url?: string | null;
    },
  ) => {
    setSavingEpisodeId(episodeId);
    setActionMessage(null);

    try {
      const response = await fetch(`/api/content/episode/${episodeId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tablePreset,
          patch,
        }),
      });

      const json = (await response.json()) as {
        ok: boolean;
        error?: { message: string };
      };

      if (!json.ok) {
        setActionMessage(json.error?.message ?? 'Episode save failed');
        return;
      }

      setActionMessage('Episode saved');
      await fetchDetail();
    } catch (saveError) {
      const message = saveError instanceof Error ? saveError.message : 'Network error';
      setActionMessage(message);
    } finally {
      setSavingEpisodeId(null);
    }
  };

  const onDeleteEpisode = async (episodeId: number) => {
    setDeletingEpisodeId(episodeId);
    setActionMessage(null);

    try {
      const response = await fetch(`/api/content/episode/${episodeId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tablePreset,
        }),
      });

      const json = (await response.json()) as {
        ok: boolean;
        error?: { message: string };
      };

      if (!json.ok) {
        setActionMessage(json.error?.message ?? 'Episode delete failed');
        return;
      }

      setActionMessage('Episode deleted');
      await fetchDetail();
    } catch (deleteError) {
      const message = deleteError instanceof Error ? deleteError.message : 'Network error';
      setActionMessage(message);
    } finally {
      setDeletingEpisodeId(null);
    }
  };

  const backHref = `/sync/contents?country=${encodeURIComponent(country)}&tablePreset=${encodeURIComponent(
    tablePreset,
  )}`;

  return (
    <div className='flex flex-col gap-6'>
      <SectionCard title='Program Detail' subtitle={`Program id: ${id ?? '-'}`}>
        <div className='mb-4'>
          <Link
            href={backHref}
            className='inline-flex rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50'
          >
            Back to Contents
          </Link>
        </div>

        {loading ? <p className='text-sm text-zinc-500'>Loading detail...</p> : null}
        {error ? <p className='text-sm text-rose-700'>{error}</p> : null}

        {program ? <ProgramSummaryCard program={program} /> : null}
      </SectionCard>

      <SectionCard title={`Episodes (${episodes.length})`} subtitle='Latest first'>
        {actionMessage ? (
          <p className='mb-3 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs text-zinc-700'>
            {actionMessage}
          </p>
        ) : null}
        <EpisodeList
          episodes={episodes}
          loading={loading}
          audioState={audioState}
          controls={controls}
          processingEpisodeId={processingEpisodeId}
          savingEpisodeId={savingEpisodeId}
          deletingEpisodeId={deletingEpisodeId}
          onReprocessEpisode={onReprocessEpisode}
          onSaveEpisode={onSaveEpisode}
          onDeleteEpisode={onDeleteEpisode}
        />
      </SectionCard>
    </div>
  );
}
