import { Dispatch, SetStateAction } from 'react';

import { RuntimeState, TablePreset } from '../_lib/runtime-options.types';
import { SectionCard } from './section-card';

type RuntimeStringFieldKey =
  | 'countryCode'
  | 'languageList'
  | 'programType'
  | 'episodeLimit'
  | 'downloadLimit'
  | 'imageTargetMaxKb'
  | 'themeId'
  | 'minRank'
  | 'maxRank'
  | 'globalCategoryId'
  | 'customProgramsTable'
  | 'customProgramsCategoriesTable'
  | 'customEpisodesTable'
  | 'customThemesProgramsTable';

type RuntimeBooleanFieldKey = 'downloadFiles' | 'keepLocalFiles' | 'syncCategory' | 'syncThemes';

export const inputClass =
  'mt-2 w-full rounded-xl border border-zinc-300/80 bg-white/90 px-3 py-2.5 text-sm text-zinc-900 outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-200';

const runtimeInputFields: Array<{
  key: RuntimeStringFieldKey;
  label: string;
  type?: 'text' | 'number';
}> = [
  { key: 'countryCode', label: 'Country' },
  { key: 'languageList', label: 'Language List' },
  { key: 'programType', label: 'Program Type' },
  { key: 'episodeLimit', label: 'Episode Limit', type: 'number' },
  { key: 'downloadLimit', label: 'Download Limit', type: 'number' },
  { key: 'imageTargetMaxKb', label: 'Image Max KB', type: 'number' },
  { key: 'themeId', label: 'Theme ID', type: 'number' },
  { key: 'minRank', label: 'Min Rank', type: 'number' },
  { key: 'maxRank', label: 'Max Rank', type: 'number' },
  { key: 'globalCategoryId', label: 'Global Category ID', type: 'number' },
];

const runtimeToggleFields: Array<{ key: RuntimeBooleanFieldKey; label: string }> = [
  { key: 'downloadFiles', label: 'Download files' },
  { key: 'keepLocalFiles', label: 'Keep local files' },
  { key: 'syncCategory', label: 'Sync category' },
  { key: 'syncThemes', label: 'Sync themes' },
];

const runtimeCustomTableFields: Array<{ key: RuntimeStringFieldKey; placeholder: string }> = [
  { key: 'customProgramsTable', placeholder: 'programs table' },
  { key: 'customProgramsCategoriesTable', placeholder: 'programs_categories table' },
  { key: 'customEpisodesTable', placeholder: 'episodes table' },
  { key: 'customThemesProgramsTable', placeholder: 'themes_programs table' },
];

export function RuntimeOptions({
  label,
  state,
  setState,
}: {
  label: string;
  state: RuntimeState;
  setState: Dispatch<SetStateAction<RuntimeState>>;
}) {
  const updateStringField = (key: RuntimeStringFieldKey, value: string) => {
    setState((prev) => ({ ...prev, [key]: value }));
  };

  const updateBooleanField = (key: RuntimeBooleanFieldKey, value: boolean) => {
    setState((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <SectionCard title={label} subtitle='실행 직전 값만 적용됩니다.'>
      <div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
        <div>
          <label className='block text-sm font-medium text-zinc-700'>Table Preset</label>
          <select
            value={state.tablePreset}
            onChange={(e) =>
              setState((prev) => ({ ...prev, tablePreset: e.target.value as TablePreset }))
            }
            className={inputClass}
          >
            <option value='test'>test tables</option>
            <option value='main'>main tables</option>
            <option value='custom'>custom tables</option>
          </select>
        </div>
        {runtimeInputFields.map((field) => (
          <div key={field.key}>
            <label className='block text-sm font-medium text-zinc-700'>{field.label}</label>
            <input
              type={field.type}
              value={state[field.key]}
              onChange={(e) => updateStringField(field.key, e.target.value)}
              className={inputClass}
            />
          </div>
        ))}
        {runtimeToggleFields.map((field) => (
          <label
            key={field.key}
            className='mt-3 inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm'
          >
            <input
              type='checkbox'
              checked={state[field.key]}
              onChange={(e) => updateBooleanField(field.key, e.target.checked)}
            />
            {field.label}
          </label>
        ))}
      </div>

      {state.tablePreset === 'custom' ? (
        <div className='mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2'>
          {runtimeCustomTableFields.map((field) => (
            <input
              key={field.key}
              placeholder={field.placeholder}
              value={state[field.key]}
              onChange={(e) => updateStringField(field.key, e.target.value)}
              className={inputClass}
            />
          ))}
        </div>
      ) : null}
    </SectionCard>
  );
}
