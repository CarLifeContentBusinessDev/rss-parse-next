export type UploadMode = 'rss' | 'excel' | 'contents';

export const uploadModes: UploadMode[] = ['rss', 'excel', 'contents'];

export const uploadModeMeta: Record<
  UploadMode,
  { title: string; description: string; href: string }
> = {
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
};
