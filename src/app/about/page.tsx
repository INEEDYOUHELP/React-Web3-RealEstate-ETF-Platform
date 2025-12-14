import Breadcrumb from '../components/layout/Breadcrumb';

export default function AboutPage() {
  return (
    <>
      <section className="about-hero">
        <div className="container">
          <Breadcrumb
            items={[
              { label: '首页', href: '/' },
              { label: '关于我们' },
            ]}
          />
          <div className="hero-content">
            <h1>关于房地产ETF平台</h1>
            <p>基于React与Web3技术构建的去中心化房地产投资平台</p>
          </div>
        </div>
      </section>
      <div className="container" style={{ padding: '3rem 1rem' }}>
        <p>关于我们页面内容正在开发中...</p>
      </div>
    </>
  );
}

