import { Dispatch, ReactNode, SetStateAction } from 'react';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

import { CategoryOption } from '../_hooks/use-category-options';
import { ThemeOption } from '../_hooks/use-theme-options';
import { RuntimeState, TablePreset } from '../_lib/runtime-options.types';
import { SectionCard } from './section-card';

type RuntimeStringFieldKey =
  | 'countryCode'
  | 'languageList'
  | 'programType'
  | 'episodeLimit'
  | 'downloadLimit'
  | 'audioBitrate'
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

const tablePresetOptions = [
  { value: 'test', label: '테스트 테이블' },
  { value: 'main', label: '운영 테이블' },
  { value: 'custom', label: '사용자 지정 테이블' },
];

const programTypeOptions = [
  { value: 'podcast', label: 'podcast' },
  { value: 'radio', label: 'radio' },
];

export const inputClass =
  'h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm outline-none transition placeholder:text-zinc-400 focus-visible:border-teal-500 focus-visible:ring-4 focus-visible:ring-teal-100';

const audioBitrateOptions = [
  { value: '48k', label: '48k' },
  { value: '64k', label: '64k' },
  { value: '96k', label: '96k' },
  { value: '128k', label: '128k' },
];

const baseFields: Array<{ key: RuntimeStringFieldKey; label: string; type?: 'text' | 'number' }> =
  [
    { key: 'countryCode', label: '국가 코드' },
    { key: 'languageList', label: '언어' },
    { key: 'programType', label: '프로그램 타입' },
  ];

const limitFields: Array<{ key: RuntimeStringFieldKey; label: string; type?: 'text' | 'number' }> =
  [
    { key: 'episodeLimit', label: '에피소드 개수 제한', type: 'number' },
    { key: 'audioBitrate', label: '오디오 비트레이트' },
    { key: 'imageTargetMaxKb', label: '이미지 최대 KB', type: 'number' },
    { key: 'minRank', label: '최소 순위', type: 'number' },
    { key: 'maxRank', label: '최대 순위', type: 'number' },
  ];

const customTableFields: Array<{ key: RuntimeStringFieldKey; label: string }> = [
  { key: 'customProgramsTable', label: 'programs 테이블' },
  { key: 'customProgramsCategoriesTable', label: 'programs_categories 테이블' },
  { key: 'customEpisodesTable', label: 'episodes 테이블' },
  { key: 'customThemesProgramsTable', label: 'themes_programs 테이블' },
];

function OptionField({
  label,
  value,
  onChange,
  type = 'text',
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: 'text' | 'number';
}) {
  return (
    <div className='space-y-2'>
      <Label>{label}</Label>
      <Input type={type} value={value} onChange={(event) => onChange(event.target.value)} />
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <div className='space-y-2'>
      <Label>{label}</Label>
      <Select value={value} onValueChange={onChange} options={options} />
    </div>
  );
}

function ToggleCard({
  label,
  description,
  checked,
  onCheckedChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onCheckedChange: (value: boolean) => void;
}) {
  return (
    <div className='rounded-2xl border border-zinc-200 bg-zinc-50/80 p-4'>
      <div className='flex items-start justify-between gap-4'>
        <div>
          <p className='text-sm font-medium text-zinc-900'>{label}</p>
          <p className='mt-1 text-xs leading-relaxed text-zinc-500'>{description}</p>
        </div>
        <Switch checked={checked} onCheckedChange={onCheckedChange} aria-label={label} />
      </div>
    </div>
  );
}

export function RuntimeOptions({
  label,
  state,
  setState,
  categoryOptions,
  themeOptions,
  hiddenFields,
  children,
}: {
  label: string;
  state: RuntimeState;
  setState: Dispatch<SetStateAction<RuntimeState>>;
  categoryOptions: CategoryOption[];
  themeOptions: ThemeOption[];
  hiddenFields?: RuntimeStringFieldKey[];
  children?: ReactNode;
}) {
  const updateStringField = (key: RuntimeStringFieldKey, value: string) => {
    setState((prev) => ({ ...prev, [key]: value }));
  };

  const updateBooleanField = (key: RuntimeBooleanFieldKey, value: boolean) => {
    setState((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <SectionCard title={label} subtitle='이 화면에서 실행하는 작업에만 적용됩니다.'>
      <div className='space-y-6'>
        <div className='grid gap-4 md:grid-cols-3'>
          <div className='space-y-2 md:col-span-1'>
            <Label>테이블 프리셋</Label>
            <Select
              value={state.tablePreset}
              onValueChange={(value) =>
                setState((prev) => ({ ...prev, tablePreset: value as TablePreset }))
              }
              options={tablePresetOptions}
            />
          </div>
          <div className='rounded-2xl border border-zinc-200/80 bg-zinc-50/60 p-4 md:col-span-2'>
            <p className='text-sm font-medium text-zinc-900'>대상 테이블</p>
            <p className='mt-1 text-xs leading-relaxed text-zinc-500'>
              테스트 실행은 테스트 테이블, 운영 반영은 운영 테이블, 예외 작업은 사용자 지정
              테이블을 사용합니다.
            </p>
          </div>
        </div>

        <div className='space-y-3'>
          <div>
            <p className='text-sm font-semibold text-zinc-900'>기본 설정</p>
            <p className='text-xs text-zinc-500'>국가, 언어, 프로그램 메타데이터를 설정합니다.</p>
          </div>
          <div className='grid gap-4 md:grid-cols-3'>
            {baseFields.map((field) =>
              field.key === 'programType' ? (
                <SelectField
                  key={field.key}
                  label={field.label}
                  value={state.programType}
                  onChange={(value) => updateStringField('programType', value)}
                  options={programTypeOptions}
                />
              ) : (
                <OptionField
                  key={field.key}
                  label={field.label}
                  type={field.type}
                  value={state[field.key]}
                  onChange={(value) => updateStringField(field.key, value)}
                />
              ),
            )}
          </div>
        </div>

        <div className='space-y-3'>
          <div>
            <p className='text-sm font-semibold text-zinc-900'>실행 범위</p>
            <p className='text-xs text-zinc-500'>처리 개수, 압축 품질, 순위 필터를 조정합니다.</p>
          </div>
          <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-3'>
            {limitFields
              .filter((field) => !hiddenFields?.includes(field.key))
              .map((field) =>
                field.key === 'audioBitrate' ? (
                  <SelectField
                    key={field.key}
                    label={field.label}
                    value={state.audioBitrate}
                    onChange={(value) => updateStringField('audioBitrate', value)}
                    options={audioBitrateOptions}
                  />
                ) : (
                  <OptionField
                    key={field.key}
                    label={field.label}
                    type={field.type}
                    value={state[field.key]}
                    onChange={(value) => updateStringField(field.key, value)}
                  />
                ),
              )}
          </div>
        </div>

        <div className='space-y-3'>
          <div>
            <p className='text-sm font-semibold text-zinc-900'>동기화 동작</p>
            <p className='text-xs text-zinc-500'>선택 기능과 매핑 관련 설정을 켜거나 끕니다.</p>
          </div>
          <div className='grid gap-3 md:grid-cols-2'>
            <ToggleCard
              label='파일 다운로드'
              description='오디오와 이미지를 압축하고, R2가 설정되어 있으면 업로드합니다.'
              checked={state.downloadFiles}
              onCheckedChange={(value) => updateBooleanField('downloadFiles', value)}
            />
            <ToggleCard
              label='로컬 파일 유지'
              description='작업이 끝난 뒤에도 압축 파일을 로컬 디스크에 남깁니다.'
              checked={state.keepLocalFiles}
              onCheckedChange={(value) => updateBooleanField('keepLocalFiles', value)}
            />
            <ToggleCard
              label='카테고리 동기화'
              description='동기화된 프로그램의 카테고리 매핑을 생성하거나 갱신합니다.'
              checked={state.syncCategory}
              onCheckedChange={(value) => updateBooleanField('syncCategory', value)}
            />
            <ToggleCard
              label='테마 동기화'
              description='설정한 테마 ID로 테마 매핑을 생성하거나 갱신합니다.'
              checked={state.syncThemes}
              onCheckedChange={(value) => updateBooleanField('syncThemes', value)}
            />
          </div>
          <div className='grid gap-4 md:grid-cols-2'>
            <SelectField
              label='글로벌 카테고리'
              value={state.globalCategoryId}
              onChange={(value) => updateStringField('globalCategoryId', value)}
              options={categoryOptions}
            />
            {state.syncThemes ? (
              <SelectField
                label='테마'
                value={state.themeId}
                onChange={(value) => updateStringField('themeId', value)}
                options={themeOptions}
              />
            ) : (
              <div className='rounded-2xl border border-dashed border-zinc-200 bg-zinc-50/60 p-4 text-sm text-zinc-500'>
                테마 ID는 테마 동기화를 켰을 때만 사용됩니다.
              </div>
            )}
            {children}
          </div>
        </div>

        {state.tablePreset === 'custom' ? (
          <div className='space-y-3'>
            <div>
              <p className='text-sm font-semibold text-zinc-900'>사용자 지정 테이블</p>
              <p className='text-xs text-zinc-500'>표준 환경이 아닐 때 사용할 테이블명을 직접 지정합니다.</p>
            </div>
            <div className='grid gap-4 md:grid-cols-2'>
              {customTableFields.map((field) => (
                <OptionField
                  key={field.key}
                  label={field.label}
                  value={state[field.key]}
                  onChange={(value) => updateStringField(field.key, value)}
                />
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </SectionCard>
  );
}
