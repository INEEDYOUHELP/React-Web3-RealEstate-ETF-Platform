'use client';

import Breadcrumb from '../components/layout/Breadcrumb';
import { useAnalytics } from '../../hooks/useAnalytics';
import MarketOverview from '../components/analytics/MarketOverview';
import AnalyticsChart from '../components/analytics/AnalyticsChart';
import DataTable from '../components/analytics/DataTable';

export default function AnalyticsPage() {
  const { marketOverview, analyticsCards } = useAnalytics();

  const trend = [
    { label: '北美', value: 68 },
    { label: '欧洲', value: 55 },
    { label: '亚太', value: 60 },
    { label: '中东', value: 38 },
  ];

  return (
    <>
      <section className="analytics-hero">
        <div className="container">
          <Breadcrumb
            items={[
              { label: '首页', href: '/' },
              { label: '数据分析' },
            ]}
          />
          <div className="analytics-header">
            <div>
              <h1>数据分析中心</h1>
              <p>深度市场分析，洞察投资机会</p>
            </div>
          </div>
        </div>
      </section>

      <div className="container" style={{ padding: '3rem 0', display: 'grid', gap: '2rem' }}>
        <MarketOverview metrics={marketOverview} />
        <AnalyticsChart items={analyticsCards} />
        <DataTable title="区域表现 (指数)" rows={trend} />
      </div>
    </>
  );
}

