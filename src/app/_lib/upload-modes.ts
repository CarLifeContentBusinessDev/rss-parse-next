export type UploadMode = 'rss' | 'excel' | 'audio-refresh' | 'contents' | 'podrss';

export const uploadModes: UploadMode[] = ['rss', 'excel', 'audio-refresh', 'contents', 'podrss'];

type UploadChildMenu = {
  title: string;
  href: string;
};

type UploadModeMeta = {
  title: string;
  description: string;
  href: string;
  children?: UploadChildMenu[];
};

export const uploadModeMeta: Record<UploadMode, UploadModeMeta> = {
  rss: {
    title: 'RSS 직접 실행',
    description: 'RSS 피드 URL 하나로 동기화 작업을 실행합니다.',
    href: '/sync/rss',
  },
  excel: {
    title: 'Excel 파일 실행',
    description: '.xlsx 파일과 시트 옵션으로 배치 동기화를 실행합니다.',
    href: '/sync/excel',
  },
  'audio-refresh': {
    title: '오디오 URL 교체',
    description:
      '국가별 프로그램의 오디오를 다시 압축 업로드하고 episodes.audio_file URL을 교체합니다.',
    href: '/sync/audio-refresh',
  },
  contents: {
    title: '국가별 콘텐츠',
    description: '국가 코드 기준으로 콘텐츠 목록을 조회합니다.',
    href: '/sync/contents',
  },
  podrss: {
    title: 'PodRSS 도구',
    description: '채널 및 Apple ID 조회용 PodRSS 도구 모음을 엽니다.',
    href: '/podrss',
    children: [
      { title: '엑셀 채널', href: '/podrss/excel-channel' },
      { title: '엑셀 Apple ID', href: '/podrss/excel-apple-id' },
      { title: '수동 채널', href: '/podrss/manual-channel' },
      { title: '수동 Apple ID', href: '/podrss/manual-apple-id' },
      { title: '상위 팟캐스트', href: '/podrss/top-podcast' },
    ],
  },
};
