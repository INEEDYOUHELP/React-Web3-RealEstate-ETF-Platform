'use client';

import { useState } from 'react';
import Breadcrumb from '../components/layout/Breadcrumb';
import { useAssets } from '../../hooks/useAssets';
import AssetSearch from '../components/assets/AssetSearch';
import AssetFilters from '../components/assets/AssetFilters';
import AssetGrid from '../components/assets/AssetGrid';
import AssetDetailModal from '../components/assets/AssetDetailModal';
import { Asset } from '../../types';

export default function AssetsPage() {
  const {
    assets,
    query,
    setQuery,
    region,
    setRegion,
    type,
    setType,
    sort,
    setSort,
    toggleBookmark,
    isBookmarked,
  } = useAssets();
  const [selected, setSelected] = useState<Asset | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const openDetail = (asset: Asset) => {
    setSelected(asset);
    setDetailOpen(true);
  };

  return (
    <>
      <section className="page-hero">
        <div className="container">
          <Breadcrumb
            items={[
              { label: '首页', href: '/' },
              { label: '资产展示' },
            ]}
          />
          <h1 className="page-title">全球房地产资产</h1>
          <p className="page-subtitle">
            探索优质房地产投资机会，构建多元化投资组合
          </p>
          <AssetSearch value={query} onChange={setQuery} />
          <AssetFilters
            region={region}
            type={type}
            sort={sort}
            onRegionChange={setRegion}
            onTypeChange={setType}
            onSortChange={setSort}
          />
        </div>
      </section>

      <div className="container" style={{ padding: '3rem 0' }}>
        <div style={{ marginBottom: '1rem', color: '#64748b', fontSize: '0.95rem' }}>
          共 {assets.length} 个匹配资产
        </div>
        {assets.length === 0 ? (
          <p>暂无匹配资产</p>
        ) : (
          <AssetGrid
            assets={assets}
            bookmarked={isBookmarked}
            onBookmark={toggleBookmark}
            onDetail={openDetail}
          />
        )}
      </div>

      <AssetDetailModal asset={selected ?? undefined} open={detailOpen} onClose={() => setDetailOpen(false)} />
    </>
  );
}

