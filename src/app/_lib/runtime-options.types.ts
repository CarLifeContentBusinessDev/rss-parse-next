export type TablePreset = 'test' | 'main' | 'custom';

export type RuntimeState = {
  tablePreset: TablePreset;
  customProgramsTable: string;
  customProgramsCategoriesTable: string;
  customEpisodesTable: string;
  customThemesProgramsTable: string;
  countryCode: string;
  languageList: string;
  programType: string;
  episodeLimit: string;
  downloadFiles: boolean;
  downloadLimit: string;
  imageTargetMaxKb: string;
  keepLocalFiles: boolean;
  minRank: string;
  maxRank: string;
  syncCategory: boolean;
  globalCategoryId: string;
  syncThemes: boolean;
  themeId: string;
};
