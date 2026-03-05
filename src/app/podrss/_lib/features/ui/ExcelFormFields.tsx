import { Input } from "@/app/podrss/_lib/shared/ui/Input";
import { Label } from "@/app/podrss/_lib/shared/ui/Label";
import { SectionTitle } from "@/app/podrss/_lib/shared/ui/SectionTitle";

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
      {/* 시트 설정 */}
      <SectionTitle>시트 설정</SectionTitle>
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div>
          <Label required>시트명</Label>
          <Input
            placeholder="ex) US_미국"
            value={form.sheetName}
            onChange={(e) => set("sheetName", e.target.value)}
          />
        </div>
        <div>
          <Label required>헤더 행</Label>
          <Input
            min="1"
            placeholder="ex) 1"
            value={form.headerRow}
            onChange={(e) => set("headerRow", e.target.value)}
          />
        </div>
        <div>
          <Label required>시작 행</Label>
          <Input
            min="1"
            placeholder="ex) 3"
            value={form.startRow}
            onChange={(e) => set("startRow", e.target.value)}
          />
        </div>
        <div>
          <Label required>종료 행</Label>
          <Input
            min="1"
            placeholder="ex) 100"
            value={form.endRow}
            onChange={(e) => set("endRow", e.target.value)}
          />
        </div>
      </div>

      {/* 컬럼 설정 */}
      <SectionTitle>컬럼 설정</SectionTitle>
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div>
          <Label required>채널명 컬럼</Label>
          <Input
            placeholder="ex) 채널명"
            value={form.channelNameColumn}
            onChange={(e) => set("channelNameColumn", e.target.value)}
          />
        </div>
        <div>
          <Label required>Apple ID 컬럼</Label>
          <Input
            placeholder="ex) 애플 ID"
            value={form.appleIdColumn}
            onChange={(e) => set("appleIdColumn", e.target.value)}
          />
        </div>
        <div>
          <Label required>RSS 컬럼</Label>
          <Input
            placeholder="ex) RSS"
            value={form.rssColumn}
            onChange={(e) => set("rssColumn", e.target.value)}
          />
        </div>
      </div>

      {/* 기타 설정 */}
      <SectionTitle>기타 설정</SectionTitle>
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div>
          <Label>국가 코드</Label>
          <Input
            placeholder="ex) US, KR, JP"
            value={form.country}
            onChange={(e) => set("country", e.target.value)}
          />
        </div>
      </div>
    </>
  );
};




