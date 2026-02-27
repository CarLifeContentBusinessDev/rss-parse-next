export type TablePreset = 'test' | 'main';

export type CountryContentItem = {
  id: number;
  title: string;
  subtitle: string | null;
  img_url: string | null;
  type: string | null;
  language: string[] | string | null;
  popularOrder: number | null;
};

export type QueryResult = {
  ok: boolean;
  data?: {
    country: string;
    tablePreset: TablePreset;
    items: CountryContentItem[];
    pagination: {
      limit: number;
      totalPrograms: number;
      totalPages: number;
      nextCursor: string | null;
      hasMore: boolean;
    };
    stats?: {
      rankMatchedCount: number;
    };
  };
  error?: { code: string; message: string };
};

export type RankFilter = 'all' | 'ranked' | 'unranked';
export type SortKey = 'rankAsc' | 'rankDesc' | 'titleAsc' | 'titleDesc' | 'idDesc';

export const countryOptions = ['KO', 'EN', 'DE', 'JP', 'IT', 'ES', 'UK'] as const;
export type CountryOption = (typeof countryOptions)[number];

