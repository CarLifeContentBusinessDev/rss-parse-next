import { MAIN_TABLES, TEST_TABLES, defaultRuntimeState } from './runtime-options.constants';
import { RuntimeState, TablePreset } from './runtime-options.types';

export { defaultRuntimeState };
export type { RuntimeState, TablePreset };

export function buildOptions(state: RuntimeState, sheetName: string, headerSkip: string) {
  const resolvedEpisodeLimit = Number(state.episodeLimit);
  const resolvedDownloadLimit = Number(state.downloadLimit);
  const resolvedTables =
    state.tablePreset === 'main'
      ? MAIN_TABLES
      : state.tablePreset === 'custom'
        ? {
            programs: state.customProgramsTable,
            programsCategories: state.customProgramsCategoriesTable,
            episodes: state.customEpisodesTable,
            themesPrograms: state.customThemesProgramsTable,
          }
        : TEST_TABLES;

  return {
    sheetName,
    countryCode: state.countryCode,
    languageList: state.languageList,
    programType: state.programType.trim().toLowerCase() === 'null' ? null : state.programType,
    episodeLimit: resolvedEpisodeLimit,
    downloadFiles: state.downloadFiles,
    downloadLimit: resolvedDownloadLimit,
    audioBitrate: state.audioBitrate,
    imageTargetMaxKb: Number(state.imageTargetMaxKb),
    keepLocalFiles: state.keepLocalFiles,
    excelHeaderSkip: Number(headerSkip),
    minRank: state.minRank.trim() ? Number(state.minRank) : null,
    maxRank: state.maxRank.trim() ? Number(state.maxRank) : null,
    syncCategory: state.syncCategory,
    globalCategoryId: Number(state.globalCategoryId),
    syncThemes: state.syncThemes,
    themeId: Number(state.themeId),
    tables: resolvedTables,
  };
}
