'use client';

import type { PodcastResult } from '@/app/podrss/_lib/entities/types';
import { excelChannelApi } from '@/app/podrss/_lib/features/api/excelChannelApi';
import { ExcelFormFields } from '@/app/podrss/_lib/features/ui/ExcelFormFields';
import { FileUploadZone } from '@/app/podrss/_lib/features/ui/FileUploadZone';
import { TOAST_IDS } from '@/app/podrss/_lib/shared/constants/toastIds';
import { ResultTable } from '@/app/podrss/_lib/shared/ui/ResultTable';
import { handleApiError } from '@/app/podrss/_lib/shared/utils/handleApiError';
import { SectionCard } from '@/app/_components/section-card';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';

interface FormState {
  sheetName: string;
  startRow: string;
  endRow: string;
  headerRow: string;
  channelNameColumn: string;
  appleIdColumn: string;
  rssColumn: string;
  country: string;
  file?: File | null;
}

const STORAGE_KEY = 'excelChannelForm';

const INITIAL_FORM: FormState = {
  sheetName: '',
  startRow: '',
  endRow: '',
  headerRow: '',
  channelNameColumn: '채널명',
  appleIdColumn: 'Apple ID',
  rssColumn: 'RSS',
  country: '',
  file: null,
};

const getInitialForm = (): FormState => {
  if (typeof window === 'undefined') return INITIAL_FORM;

  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return INITIAL_FORM;

  try {
    return {
      ...INITIAL_FORM,
      ...JSON.parse(saved),
      file: null,
    };
  } catch {
    return INITIAL_FORM;
  }
};

export const ExcelChannelPage = () => {
  const [form, setForm] = useState<FormState>(getInitialForm);
  const [submitted, setSubmitted] = useState(false);
  const [results, setResults] = useState<PodcastResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const formToSave = { ...form };
    delete formToSave.file;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(formToSave));
  }, [form]);

  const set = (key: keyof FormState, value: string | File | null) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmitJson = async () => {
    if (!form.file) {
      toast.error('파일을 업로드해주세요.', {
        id: TOAST_IDS.excelChannel.warning,
      });
      return;
    }

    setIsLoading(true);
    try {
      const data = await excelChannelApi({ ...form, file: form.file });
      setResults(data);
      setSubmitted(true);
      toast.success('분석이 완료되었습니다.', {
        id: TOAST_IDS.excelChannel.success,
      });
    } catch (error) {
      toast.error(handleApiError(error), { id: TOAST_IDS.excelChannel.error });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    localStorage.removeItem(STORAGE_KEY);
    setForm({
      ...INITIAL_FORM,
      file: null,
    });
  };

  return (
    <div className='space-y-6'>
      <SectionCard
        title='엑셀 채널명 조회'
        subtitle='채널명 기준 엑셀 파일을 업로드해 Apple ID와 RSS 값을 공통 콘솔 안에서 조회합니다.'
      >
        <FileUploadZone file={form.file ?? null} onFile={(file) => set('file', file)} onClear={() => set('file', null)} />
        <ExcelFormFields form={form} set={(key, value) => set(key as keyof FormState, value)} />
      </SectionCard>

      <SectionCard
        title='작업 실행'
        subtitle='현재 파일과 매핑 설정으로 조회를 실행하고, 결과를 이 화면에서 바로 검토하거나 내려받을 수 있습니다.'
      >
        <div className='rounded-2xl border border-zinc-200 bg-zinc-50/80 p-4'>
          <div className='flex flex-wrap items-center gap-3'>
            <Button type='button' size='lg' onClick={handleSubmitJson} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className='h-4 w-4 animate-spin' />
                  조회 중...
                </>
              ) : (
                '조회 시작'
              )}
            </Button>
            <Button type='button' variant='outline' size='lg' onClick={handleReset}>
              설정 초기화
            </Button>
            <p className='text-xs text-zinc-500'>
              파일 파싱과 API 동작은 그대로 두고, 콘솔 UI만 통합했습니다.
            </p>
          </div>
        </div>
      </SectionCard>

      {submitted && results.length > 0 ? (
        <div className='space-y-3'>
          <div>
            <h2 className='text-lg font-semibold text-zinc-900'>결과</h2>
            <p className='text-sm text-zinc-500'>반환된 항목을 확인하고 필요하면 엑셀로 내려받을 수 있습니다.</p>
          </div>
          <ResultTable
            results={results}
            fileName={`result_${form.file?.name ?? 'result.xlsx'}`}
            type='excel'
          />
        </div>
      ) : null}
    </div>
  );
};
