'use client';

import type { PodcastResult } from '@/app/podrss/_lib/entities/types';
import { manualTopPodcastApi } from '@/app/podrss/_lib/features/manual-lookup/api/manualTopPodcastApi';
import { TOAST_IDS } from '@/app/podrss/_lib/shared/constants/toastIds';
import { Input } from '@/app/podrss/_lib/shared/ui/Input';
import { Label } from '@/app/podrss/_lib/shared/ui/Label';
import { ResultTable } from '@/app/podrss/_lib/shared/ui/ResultTable';
import { SectionTitle } from '@/app/podrss/_lib/shared/ui/SectionTitle';
import { handleApiError } from '@/app/podrss/_lib/shared/utils/handleApiError';
import { SectionCard } from '@/app/_components/section-card';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

interface FormState {
  limit?: string;
  country: string;
}

const STORAGE_KEY = 'topPodcastForm';

const INITIAL_FORM: FormState = {
  limit: '',
  country: '',
};

const getInitialForm = (): FormState => {
  if (typeof window === 'undefined') return INITIAL_FORM;

  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return INITIAL_FORM;

  try {
    return {
      ...INITIAL_FORM,
      ...JSON.parse(saved),
    };
  } catch {
    return INITIAL_FORM;
  }
};

export const TopPodcastPage = () => {
  const [form, setForm] = useState<FormState>(getInitialForm);
  const [submitted, setSubmitted] = useState(false);
  const [results, setResults] = useState<PodcastResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...form }));
  }, [form]);

  const set = (key: keyof FormState, value: string | number) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmitJson = async () => {
    if (!form.country) {
      return toast.error('국가 코드를 입력해주세요.', {
        id: TOAST_IDS.topPodcast.warning,
      });
    }

    try {
      setIsLoading(true);
      const data = await manualTopPodcastApi({ ...form });
      setResults(data);
      setSubmitted(true);
      toast.success('분석이 완료되었습니다.', {
        id: TOAST_IDS.topPodcast.success,
      });
    } catch (error) {
      toast.error(handleApiError(error), { id: TOAST_IDS.topPodcast.error });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    localStorage.removeItem(STORAGE_KEY);
    setForm({ ...INITIAL_FORM });
  };

  return (
    <div className='space-y-6'>
      <SectionCard
        title='Top Podcast 조회'
        subtitle='국가 코드와 선택한 조회 개수를 기준으로 Top Podcast 데이터를 조회하고 RSS 결과를 확인합니다.'
      >
        <div className='space-y-6'>
          <div>
            <SectionTitle>조회 조건</SectionTitle>
            <div className='grid gap-4 md:grid-cols-2'>
              <div>
                <Label required>국가 코드</Label>
                <Input
                  placeholder='예: US, KR, JP'
                  value={form.country}
                  onChange={(e) => set('country', e.target.value)}
                />
              </div>
              <div>
                <Label>조회 개수</Label>
                <Input
                  placeholder='예: 100'
                  value={form.limit}
                  onChange={(e) => set('limit', e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>
      </SectionCard>

      <SectionCard
        title='작업 실행'
        subtitle='현재 입력값으로 조회를 실행하고, 결과를 이 화면에서 바로 검토하거나 내려받을 수 있습니다.'
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
              요청 로직은 그대로 두고, 콘솔 UI만 통합했습니다.
            </p>
          </div>
        </div>
      </SectionCard>

      {submitted ? (
        <div className='space-y-3'>
          <div>
            <h2 className='text-lg font-semibold text-zinc-900'>결과</h2>
            <p className='text-sm text-zinc-500'>반환된 항목을 확인하고 필요하면 엑셀로 내려받을 수 있습니다.</p>
          </div>
          <ResultTable
            results={results}
            fileName={`result_${form.country ?? 'result'}.xlsx`}
            type='topPodcast'
          />
        </div>
      ) : null}
    </div>
  );
};
