export type ProgramDetail = {
  id: number;
  title: string;
  subtitle: string | null;
  img_url: string | null;
  type: string | null;
  language: string[] | string | null;
  popularOrder: number | null;
  popularThemeId: number | null;
  latestDuration: string | null;
};

export type EpisodeItem = {
  id: number;
  title: string;
  date: string | null;
  duration: string | null;
  audio_file: string | null;
  img_url: string | null;
};

export type DetailResponse = {
  ok: boolean;
  data?: {
    country: string;
    tablePreset: 'main' | 'test';
    program: ProgramDetail;
    episodes: EpisodeItem[];
  };
  error?: { code: string; message: string };
};
