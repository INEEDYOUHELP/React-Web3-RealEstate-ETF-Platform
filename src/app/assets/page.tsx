import Breadcrumb from '../components/layout/Breadcrumb';

export default function AssetsPage() {
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
        </div>
      </section>
      <div className="container" style={{ padding: '3rem 1rem' }}>
        <p>资产展示页面内容正在开发中...</p>
      </div>
    </>
  );
}

