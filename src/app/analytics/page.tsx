import Breadcrumb from '../components/layout/Breadcrumb';

export default function AnalyticsPage() {
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
      <div className="container" style={{ padding: '3rem 1rem' }}>
        <p>数据分析页面内容正在开发中...</p>
      </div>
    </>
  );
}

