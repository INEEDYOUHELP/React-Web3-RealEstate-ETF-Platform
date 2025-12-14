'use client';

import Link from 'next/link';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';

export default function HomePage() {
  const { isConnected } = useAccount();

  return (
    <>
      {/* 英雄区域 */}
      <section className="hero">
        <div className="hero-background">
          <div className="hero-particles"></div>
        </div>
        <div className="hero-content">
          <div className="hero-text">
            <h1 className="hero-title">
              <span className="gradient-text">房地产ETF</span>
              <br />资产选择平台
            </h1>
            <p className="hero-subtitle">
              基于Web3技术的去中心化房地产投资平台，让您轻松参与全球房地产资产代币化交易
            </p>
            <div className="hero-stats">
              <div className="stat-item">
                <div className="stat-number">$2.5B+</div>
                <div className="stat-label">总资产价值</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">15K+</div>
                <div className="stat-label">活跃用户</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">500+</div>
                <div className="stat-label">房产项目</div>
              </div>
            </div>
            <div className="hero-buttons">
              {isConnected ? (
                <Link href="/assets" className="btn btn-primary">
                  <i className="fas fa-rocket"></i>
                  开始投资
                </Link>
              ) : (
                <ConnectButton.Custom>
                  {({ account, chain, openConnectModal, mounted }) => {
                    const ready = mounted;
                    const connected = ready && account && chain;

                    return (
                      <div
                        {...(!ready && {
                          'aria-hidden': true,
                          style: {
                            opacity: 0,
                            pointerEvents: 'none',
                            userSelect: 'none',
                          },
                        })}
                      >
                        {(() => {
                          if (!connected) {
                            return (
                              <button
                                onClick={openConnectModal}
                                type="button"
                                className="btn btn-primary"
                              >
                                <i className="fas fa-wallet"></i>
                                连接钱包
                              </button>
                            );
                          }

                          return (
                            <Link href="/assets" className="btn btn-primary">
                              <i className="fas fa-rocket"></i>
                              开始投资
                            </Link>
                          );
                        })()}
                      </div>
                    );
                  }}
                </ConnectButton.Custom>
              )}
              <Link href="/about" className="btn btn-secondary">
                <i className="fas fa-play"></i>
                了解更多
              </Link>
            </div>
          </div>
          <div className="hero-visual">
            <div className="floating-card">
              <div className="card-header">
                <i className="fas fa-chart-line"></i>
                <span style={{ color: '#121111e1' }}>实时数据</span>
              </div>
              <div className="card-content">
                <div className="data-row">
                  <span>总市值</span>
                  <span className="value">$2,547,890,123</span>
                </div>
                <div className="data-row">
                  <span>24h交易量</span>
                  <span className="value">$89,456,789</span>
                </div>
                <div className="data-row">
                  <span>活跃ETF</span>
                  <span className="value">156</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 特色功能 */}
      <section className="features">
        <div className="container">
          <div className="section-header">
            <h2>平台特色</h2>
            <p>创新的Web3技术为您提供前所未有的房地产投资体验</p>
          </div>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">
                <i className="fas fa-globe"></i>
              </div>
              <h3>全球资产</h3>
              <p>覆盖全球主要城市的优质房地产资产，多样化投资选择</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <i className="fas fa-shield-alt"></i>
              </div>
              <h3>安全透明</h3>
              <p>基于区块链技术，所有交易记录公开透明，资产安全可靠</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <i className="fas fa-chart-pie"></i>
              </div>
              <h3>智能组合</h3>
              <p>AI驱动的投资组合推荐，个性化资产配置策略</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <i className="fas fa-bolt"></i>
              </div>
              <h3>实时交易</h3>
              <p>7x24小时实时交易，秒级确认，流动性极佳</p>
            </div>
          </div>
        </div>
      </section>

      {/* 热门资产 */}
      <section className="hot-assets">
        <div className="container">
          <div className="section-header">
            <h2>热门资产</h2>
            <p>当前最受欢迎的房地产ETF资产</p>
          </div>
          <div className="assets-grid">
            <div className="asset-card">
              <div className="asset-image">
                <img
                  src="https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400"
                  alt="纽约曼哈顿"
                />
                <div className="asset-badge">热门</div>
              </div>
              <div className="asset-info">
                <h3>纽约曼哈顿商业区</h3>
                <p className="asset-location">美国 · 纽约</p>
                <div className="asset-stats">
                  <div className="stat">
                    <span className="label">年化收益</span>
                    <span className="value positive">+8.5%</span>
                  </div>
                  <div className="stat">
                    <span className="label">市值</span>
                    <span className="value">$125M</span>
                  </div>
                </div>
                <Link href="/assets" className="btn btn-outline">
                  查看详情
                </Link>
              </div>
            </div>
            <div className="asset-card">
              <div className="asset-image">
                <img
                  src="https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=400"
                  alt="伦敦金融城"
                />
                <div className="asset-badge">推荐</div>
              </div>
              <div className="asset-info">
                <h3>伦敦金融城办公区</h3>
                <p className="asset-location">英国 · 伦敦</p>
                <div className="asset-stats">
                  <div className="stat">
                    <span className="label">年化收益</span>
                    <span className="value positive">+7.2%</span>
                  </div>
                  <div className="stat">
                    <span className="label">市值</span>
                    <span className="value">$98M</span>
                  </div>
                </div>
                <Link href="/assets" className="btn btn-outline">
                  查看详情
                </Link>
              </div>
            </div>
            <div className="asset-card">
              <div className="asset-image">
                <img
                  src="https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=400"
                  alt="东京银座"
                />
                <div className="asset-badge">新上线</div>
              </div>
              <div className="asset-info">
                <h3>东京银座商业区</h3>
                <p className="asset-location">日本 · 东京</p>
                <div className="asset-stats">
                  <div className="stat">
                    <span className="label">年化收益</span>
                    <span className="value positive">+6.8%</span>
                  </div>
                  <div className="stat">
                    <span className="label">市值</span>
                    <span className="value">$87M</span>
                  </div>
                </div>
                <Link href="/assets" className="btn btn-outline">
                  查看详情
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
