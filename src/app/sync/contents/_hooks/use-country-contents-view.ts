'use client';

import { useMemo, useState } from 'react';

import { CountryContentItem, RankFilter, SortKey } from '../_types/country-contents.types';

export function useCountryContentsView(items: CountryContentItem[]) {
  const [searchKeyword, setSearchKeyword] = useState('');
  const [rankFilter, setRankFilter] = useState<RankFilter>('all');
  const [sortKey, setSortKey] = useState<SortKey>('rankAsc');

  const visibleItems = useMemo(() => {
    const keyword = searchKeyword.trim().toLowerCase();
    let filtered = items.filter((item) => {
      const passKeyword =
        keyword.length === 0 ||
        item.title.toLowerCase().includes(keyword) ||
        (item.subtitle ?? '').toLowerCase().includes(keyword);
      const passRank =
        rankFilter === 'all' ||
        (rankFilter === 'ranked' && item.popularOrder !== null) ||
        (rankFilter === 'unranked' && item.popularOrder === null);
      return passKeyword && passRank;
    });

    filtered = [...filtered].sort((a, b) => {
      switch (sortKey) {
        case 'rankAsc': {
          const left = a.popularOrder ?? Number.MAX_SAFE_INTEGER;
          const right = b.popularOrder ?? Number.MAX_SAFE_INTEGER;
          return left - right;
        }
        case 'rankDesc': {
          const left = a.popularOrder ?? Number.MIN_SAFE_INTEGER;
          const right = b.popularOrder ?? Number.MIN_SAFE_INTEGER;
          return right - left;
        }
        case 'titleAsc':
          return a.title.localeCompare(b.title);
        case 'titleDesc':
          return b.title.localeCompare(a.title);
        case 'idDesc':
          return b.id - a.id;
        default:
          return 0;
      }
    });

    return filtered;
  }, [items, rankFilter, searchKeyword, sortKey]);

  return {
    searchKeyword,
    setSearchKeyword,
    rankFilter,
    setRankFilter,
    sortKey,
    setSortKey,
    visibleItems,
  };
}
