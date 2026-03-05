export type UploadMode = 'rss' | 'excel' | 'contents' | 'podrss';

export const uploadModes: UploadMode[] = ['rss', 'excel', 'contents', 'podrss'];

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
    title: 'RSS Link Upload',
    description: 'Trigger a sync job from a single RSS feed URL.',
    href: '/sync/rss',
  },
  excel: {
    title: 'Excel File Upload',
    description: 'Batch sync from an .xlsx file with sheet options.',
    href: '/sync/excel',
  },
  contents: {
    title: 'Country Contents',
    description: 'Browse content list filtered by country code.',
    href: '/sync/contents',
  },
  podrss: {
    title: 'PodRSS Console',
    description: 'Open PodRSS tools for channel/apple-id lookup flows.',
    href: '/podrss',
    children: [
      { title: 'Excel Channel', href: '/podrss/excel-channel' },
      { title: 'Excel Apple ID', href: '/podrss/excel-apple-id' },
      { title: 'Manual Channel', href: '/podrss/manual-channel' },
      { title: 'Manual Apple ID', href: '/podrss/manual-apple-id' },
      { title: 'Top Podcast', href: '/podrss/top-podcast' },
    ],
  },
};
