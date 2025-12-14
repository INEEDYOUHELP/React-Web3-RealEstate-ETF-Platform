import Breadcrumb from '../components/layout/Breadcrumb';

export default function PortfolioPage() {
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
      <div className="container" style={{ padding: '3rem 1rem' }}>
        <p>投资组合页面内容正在开发中...</p>
      </div>
    </>
  );
}

