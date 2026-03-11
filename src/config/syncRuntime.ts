export type SyncRuntimeOptions = {
  sheetName: string;
  countryCode: string;
  languageList: string[];
  programType: string | null;
  mode: 'excel' | 'rss';
  episodeLimit: number;
  downloadFiles: boolean;
  downloadLimit: number;
  audioBitrate: string;
  imageTargetMaxKb: number;
  keepLocalFiles: boolean;
  excelHeaderSkip: number;
  minRank: number | null;
  maxRank: number | null;
  syncCategory: boolean;
  globalCategoryId: number;
  categoryId?: number;
  syncThemes: boolean;
  themeId: number;
  tables: {
    programs: string;
    programsCategories: string;
    episodes: string;
    themesPrograms: string;
  };
};

export const DEFAULT_SYNC_OPTIONS: SyncRuntimeOptions = {
  sheetName: 'IT_이탈리아',
  countryCode: 'IT',
  languageList: ['it'],
  programType: 'podcast',
  mode: 'excel',
  episodeLimit: 4,
  downloadFiles: true,
  downloadLimit: 10,
  audioBitrate: '128k',
  imageTargetMaxKb: 50,
  keepLocalFiles: false,
  excelHeaderSkip: 2,
  minRank: 60,
  maxRank: 60,
  syncCategory: true,
  globalCategoryId: 65,
  categoryId: undefined,
  syncThemes: true,
  themeId: 16,
  tables: {
    programs: 'programs_test',
    programsCategories: 'programs_categories_test',
    episodes: 'episodes_test',
    themesPrograms: 'themes_programs_test',
  },
};

export type PartialSyncRuntimeOptions = Partial<
  Omit<SyncRuntimeOptions, 'tables' | 'languageList'>
> & {
  tables?: Partial<SyncRuntimeOptions['tables']>;
  languageList?: string[] | string;
};

function normalizeLanguageList(value: string[] | string | undefined) {
  if (!value) return DEFAULT_SYNC_OPTIONS.languageList;
  if (Array.isArray(value)) return value.filter(Boolean);
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

export function resolveSyncOptions(overrides?: PartialSyncRuntimeOptions): SyncRuntimeOptions {
  return {
    ...DEFAULT_SYNC_OPTIONS,
    ...overrides,
    languageList: normalizeLanguageList(overrides?.languageList),
    tables: {
      ...DEFAULT_SYNC_OPTIONS.tables,
      ...overrides?.tables,
    },
  };
}
