import { Input } from '@/app/podrss/_lib/shared/ui/Input';
import { Label } from '@/app/podrss/_lib/shared/ui/Label';
import { SectionTitle } from '@/app/podrss/_lib/shared/ui/SectionTitle';

interface ExcelFormFieldsProps {
  form: {
    sheetName: string;
    headerRow: string;
    startRow: string;
    endRow: string;
    channelNameColumn: string;
    appleIdColumn: string;
    rssColumn: string;
    country: string;
  };
  set: (key: string, value: string | File | null) => void;
}

export const ExcelFormFields = ({ form, set }: ExcelFormFieldsProps) => {
  return (
    <>
      <SectionTitle>시트 설정</SectionTitle>
      <div className='mb-6 grid gap-4 md:grid-cols-2'>
        <div>
          <Label required>시트 이름</Label>
          <Input
            placeholder='예: US_Podcasts'
            value={form.sheetName}
            onChange={(e) => set('sheetName', e.target.value)}
          />
        </div>
        <div>
          <Label required>헤더 행</Label>
          <Input
            min='1'
            placeholder='예: 1'
            value={form.headerRow}
            onChange={(e) => set('headerRow', e.target.value)}
          />
        </div>
        <div>
          <Label required>시작 행</Label>
          <Input
            min='1'
            placeholder='예: 3'
            value={form.startRow}
            onChange={(e) => set('startRow', e.target.value)}
          />
        </div>
        <div>
          <Label required>종료 행</Label>
          <Input
            min='1'
            placeholder='예: 100'
            value={form.endRow}
            onChange={(e) => set('endRow', e.target.value)}
          />
        </div>
      </div>

      <SectionTitle>컬럼 매핑</SectionTitle>
      <div className='mb-6 grid gap-4 xl:grid-cols-3'>
        <div>
          <Label required>채널명 컬럼</Label>
          <Input
            placeholder='예: Channel Name'
            value={form.channelNameColumn}
            onChange={(e) => set('channelNameColumn', e.target.value)}
          />
        </div>
        <div>
          <Label required>Apple ID 컬럼</Label>
          <Input
            placeholder='예: Apple ID'
            value={form.appleIdColumn}
            onChange={(e) => set('appleIdColumn', e.target.value)}
          />
        </div>
        <div>
          <Label required>RSS 컬럼</Label>
          <Input
            placeholder='예: RSS'
            value={form.rssColumn}
            onChange={(e) => set('rssColumn', e.target.value)}
          />
        </div>
      </div>

      <SectionTitle>추가 옵션</SectionTitle>
      <div className='mb-2 grid gap-4 md:grid-cols-2'>
        <div>
          <Label>국가 코드</Label>
          <Input
            placeholder='예: US, KR, JP'
            value={form.country}
            onChange={(e) => set('country', e.target.value)}
          />
        </div>
      </div>
    </>
  );
};
