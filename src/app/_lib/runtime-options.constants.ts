import { RuntimeState } from './runtime-options.types';

export const TEST_TABLES = {
  programs: 'programs_test',
  programsCategories: 'programs_categories_test',
  episodes: 'episodes_test',
  themesPrograms: 'themes_programs_test',
};

export const MAIN_TABLES = {
  programs: 'programs',
  programsCategories: 'programs_categories',
  episodes: 'episodes',
  themesPrograms: 'themes_programs',
};

export const defaultRuntimeState: RuntimeState = {
  tablePreset: 'test',
  customProgramsTable: 'programs_test',
  customProgramsCategoriesTable: 'programs_categories_test',
  customEpisodesTable: 'episodes_test',
  customThemesProgramsTable: 'themes_programs_test',
  countryCode: 'IT',
  languageList: 'it',
  programType: 'podcast',
  episodeLimit: '4',
  downloadFiles: true,
  downloadLimit: '10',
  audioBitrate: '64k',
  imageTargetMaxKb: '50',
  keepLocalFiles: false,
  minRank: '60',
  maxRank: '60',
  syncCategory: true,
  globalCategoryId: '65',
  syncThemes: true,
  themeId: '16',
};
