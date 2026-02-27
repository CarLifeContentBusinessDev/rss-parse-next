'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import { DetailResponse, EpisodeItem, ProgramDetail } from '../_types/types';

type TablePreset = 'test' | 'main';

type EpisodePatch = {
  title?: string | null;
  date?: string | null;
  duration?: string | null;
  audio_file?: string | null;
  img_url?: string | null;
};

type UseProgramDetailQueryInput = {
  id: string | undefined;
  country: string;
  tablePreset: TablePreset;
};

export function useProgramDetailQuery({ id, country, tablePreset }: UseProgramDetailQueryInput) {
  const queryClient = useQueryClient();
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [processingEpisodeId, setProcessingEpisodeId] = useState<number | null>(null);
  const [savingEpisodeId, setSavingEpisodeId] = useState<number | null>(null);
  const [deletingEpisodeId, setDeletingEpisodeId] = useState<number | null>(null);

  const detailQuery = useQuery({
    queryKey: ['program-detail', id, country, tablePreset],
    enabled: Boolean(id),
    queryFn: async (): Promise<{ program: ProgramDetail; episodes: EpisodeItem[] }> => {
      if (!id) throw new Error('Program id is missing');
      const response = await fetch(
        `/api/content/program/${encodeURIComponent(id)}?country=${encodeURIComponent(
          country,
        )}&tablePreset=${encodeURIComponent(tablePreset)}`,
      );
      const json = (await response.json()) as DetailResponse;
      if (!json.ok || !json.data) {
        throw new Error(json.error?.message ?? 'Failed to fetch detail');
      }
      return {
        program: json.data.program,
        episodes: json.data.episodes,
      };
    },
  });

  const reprocessMutation = useMutation({
    mutationFn: async (episodeId: number) => {
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
      return (await response.json()) as {
        ok: boolean;
        error?: { message: string };
        data?: { uploadedCount: number; updatedSupabaseCount: number };
      };
    },
  });

  const saveMutation = useMutation({
    mutationFn: async ({ episodeId, patch }: { episodeId: number; patch: EpisodePatch }) => {
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

      return (await response.json()) as {
        ok: boolean;
        error?: { message: string };
      };
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (episodeId: number) => {
      const response = await fetch(`/api/content/episode/${episodeId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tablePreset,
        }),
      });

      return (await response.json()) as {
        ok: boolean;
        error?: { message: string };
      };
    },
  });

  const invalidateDetail = async () => {
    await queryClient.invalidateQueries({ queryKey: ['program-detail', id, country, tablePreset] });
  };

  const onReprocessEpisode = async (episodeId: number) => {
    setProcessingEpisodeId(episodeId);
    setActionMessage(null);

    try {
      const json = await reprocessMutation.mutateAsync(episodeId);
      if (!json.ok) {
        setActionMessage(json.error?.message ?? 'Episode reprocess failed');
        return;
      }

      setActionMessage(
        `Episode reprocessed (uploaded: ${json.data?.uploadedCount ?? 0}, updated: ${
          json.data?.updatedSupabaseCount ?? 0
        })`,
      );
      await invalidateDetail();
    } catch (updateError) {
      const message = updateError instanceof Error ? updateError.message : 'Network error';
      setActionMessage(message);
    } finally {
      setProcessingEpisodeId(null);
    }
  };

  const onSaveEpisode = async (episodeId: number, patch: EpisodePatch) => {
    setSavingEpisodeId(episodeId);
    setActionMessage(null);

    try {
      const json = await saveMutation.mutateAsync({ episodeId, patch });
      if (!json.ok) {
        setActionMessage(json.error?.message ?? 'Episode save failed');
        return;
      }

      setActionMessage('Episode saved');
      await invalidateDetail();
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
      const json = await deleteMutation.mutateAsync(episodeId);
      if (!json.ok) {
        setActionMessage(json.error?.message ?? 'Episode delete failed');
        return;
      }

      setActionMessage('Episode deleted');
      await invalidateDetail();
    } catch (deleteError) {
      const message = deleteError instanceof Error ? deleteError.message : 'Network error';
      setActionMessage(message);
    } finally {
      setDeletingEpisodeId(null);
    }
  };

  return {
    loading: detailQuery.isPending || detailQuery.isFetching,
    error: detailQuery.error instanceof Error ? detailQuery.error.message : null,
    program: detailQuery.data?.program ?? null,
    episodes: detailQuery.data?.episodes ?? [],
    actionMessage,
    processingEpisodeId,
    savingEpisodeId,
    deletingEpisodeId,
    onReprocessEpisode,
    onSaveEpisode,
    onDeleteEpisode,
  };
}
