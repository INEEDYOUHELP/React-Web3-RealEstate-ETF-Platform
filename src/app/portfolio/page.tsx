'use client';

import Breadcrumb from '../components/layout/Breadcrumb';
import { usePortfolio } from '../../hooks/usePortfolio';
import PortfolioSummary from '../components/portfolio/PortfolioSummary';
import PortfolioChart from '../components/portfolio/PortfolioChart';
import AllocationChart from '../components/portfolio/AllocationChart';
import HoldingsList from '../components/portfolio/HoldingsList';
import TransactionHistory from '../components/portfolio/TransactionHistory';

export default function PortfolioPage() {
  const { summary, holdings, transactions, period, setPeriod } = usePortfolio();

  const allocations = [
    { label: '北美', value: 42 },
    { label: '欧洲', value: 28 },
    { label: '亚太', value: 22 },
    { label: '中东', value: 8 },
  ];

  return (
    <>
      <section className="page-hero portfolio-hero">
        <div className="container">
          <Breadcrumb
            items={[
              { label: '首页', href: '/' },
              { label: '投资组合' },
            ]}
          />
          <div className="portfolio-header">
            <div className="portfolio-title">
              <h1>我的投资组合</h1>
              <p>管理您的房地产ETF投资，追踪收益表现</p>
            </div>
          </div>
        </div>
      </section>

      <div className="container" style={{ padding: '3rem 0', display: 'grid', gap: '2rem' }}>
        <PortfolioSummary summary={summary} />

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', flexWrap: 'wrap' }}>
          <PortfolioChart period={period} onPeriodChange={setPeriod} />
          <AllocationChart allocations={allocations} />
        </div>

        <HoldingsList holdings={holdings} />
        <TransactionHistory transactions={transactions} />
      </div>
    </>
  );
}

