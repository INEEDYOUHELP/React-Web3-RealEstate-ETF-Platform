import Breadcrumb from '../components/layout/Breadcrumb';

export default function TradingPage() {
  return (
    <>
      <section className="trading-hero">
        <div className="container">
          <Breadcrumb
            items={[
              { label: '首页', href: '/' },
              { label: '交易中心' },
            ]}
          />
          <div className="trading-header">
            <div>
              <h1>交易中心</h1>
              <p>实时交易房地产ETF，把握市场机会</p>
            </div>
          </div>
        </div>
      </section>
      <div className="container" style={{ padding: '3rem 1rem' }}>
        <p>交易中心页面内容正在开发中...</p>
      </div>
    </>
  );
}

