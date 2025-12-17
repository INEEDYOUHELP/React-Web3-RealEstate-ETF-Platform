'use client';

import { useEffect, useMemo, useState } from 'react';
import { mockAssets } from '../data/assets';
import { Asset } from '../types';

export function useAssets() {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [region, setRegion] = useState('全部地区');
  const [type, setType] = useState('全部类型');
  const [sort, setSort] = useState<'yield' | 'price'>('yield');
  const [bookmarked, setBookmarked] = useState<number[]>([]);

  // 查询防抖，减少频繁过滤
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 200);
    return () => clearTimeout(t);
  }, [query]);

  // 初始化本地收藏
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const saved = localStorage.getItem('bookmarkedAssets');
    if (saved) {
      try {
        setBookmarked(JSON.parse(saved));
      } catch {
        setBookmarked([]);
      }
    }
  }, []);

  // 同步到 localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('bookmarkedAssets', JSON.stringify(bookmarked));
  }, [bookmarked]);

  const filteredAssets = useMemo(() => {
    const q = debouncedQuery.trim().toLowerCase();
    let list = mockAssets.filter((a) => {
      const matchQuery =
        !q ||
        a.name.toLowerCase().includes(q) ||
        a.location.toLowerCase().includes(q) ||
        a.type.toLowerCase().includes(q) ||
        a.region.toLowerCase().includes(q);
      const matchRegion = region === '全部地区' || a.region === region;
      const matchType = type === '全部类型' || a.type === type;
      return matchQuery && matchRegion && matchType;
    });

    list = list.sort((a, b) =>
      sort === 'yield' ? b.yield - a.yield : b.price - a.price,
    );
    return list;
  }, [query, region, type, sort]);

  const toggleBookmark = (id: number) => {
    setBookmarked((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const isBookmarked = (id: number) => bookmarked.includes(id);

  return {
    assets: filteredAssets,
    query,
    setQuery,
    debouncedQuery,
    region,
    setRegion,
    type,
    setType,
    sort,
    setSort,
    toggleBookmark,
    isBookmarked,
  };
}

