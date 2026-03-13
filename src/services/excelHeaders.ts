export const EXCEL_RANK_KEYS = ['rank', 'Rank', '전체 순위', '순위'] as const;
export const EXCEL_RSS_KEYS = ['RSS', 'rss', 'rssUrl', 'RSS URL'] as const;
export const EXCEL_PROGRAM_TITLE_KEYS = [
  '채널명',
  'programTitle',
  'title',
  'Program Title',
] as const;
export const EXCEL_SUBTITLE_KEYS = ['제작사', '소제목', 'subtitle', 'Subtitle'] as const;
export const EXCEL_CATEGORY_ID_KEYS = [
  '로컬 카테고리 ID',
  'categoryId',
  'Category ID',
] as const;
export const EXCEL_ORDER_POPULAR_KEYS = [
  '테마 순위',
  'orderPopular',
  '부모 순위',
  'Popular Order',
] as const;

export function normalizeExcelHeaderKey(value: string) {
  return String(value)
    .trim()
    .replace(/\s+/g, '')
    .toLowerCase();
}

export function getExcelField<T>(
  row: Record<string, unknown>,
  keys: readonly string[],
): T | undefined {
  const entries = Object.entries(row);
  const normalizedKeyMap = new Map(
    entries.map(([key, value]) => [normalizeExcelHeaderKey(key), value] as const),
  );

  for (const key of keys) {
    const direct = row[key];
    if (direct !== undefined && direct !== null && direct !== '') {
      return direct as T;
    }

    const normalized = normalizedKeyMap.get(normalizeExcelHeaderKey(key));
    if (normalized !== undefined && normalized !== null && normalized !== '') {
      return normalized as T;
    }
  }

  return undefined;
}

export function toExcelNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const normalized = value.replace(/[^0-9.-]+/g, '');
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}
