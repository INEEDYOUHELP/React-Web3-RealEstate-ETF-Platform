'use client';

import Link from 'next/link';
import { useAccount, useChainId, useReadContract, useReadContracts } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useMemo, useState, useEffect } from 'react';
import { formatEther } from 'viem';
import { contracts, SupportedNetwork } from '../contracts/addresses';
import { realEstateStorageAbi } from '../contracts/abis';

// 获取所有房产的 hook（用于首页展示）
function useAllProperties() {
  const chainId = useChainId();
  
  const storageAddress = useMemo(() => {
    const key = chainId === 31337 || chainId === 1337 ? 'localhost' : undefined;
    return key ? contracts[key]?.realEstateStorage : undefined;
  }, [chainId]);

  const { data: nextPropertyId } = useReadContract({
    address: storageAddress,
    abi: realEstateStorageAbi,
    functionName: 'nextPropertyId',
    query: { enabled: !!storageAddress },
  });

  const propertyIds = useMemo(() => {
    if (!nextPropertyId || nextPropertyId === BigInt(0)) return [];
    const ids: bigint[] = [];
    const one = BigInt(1);
    for (let i = one; i < nextPropertyId; i++) {
      ids.push(i);
    }
    return ids;
  }, [nextPropertyId]);

  const contractsConfig = useMemo(() => {
    if (!storageAddress || propertyIds.length === 0) return [];
    return propertyIds.map((id) => ({
      address: storageAddress as `0x${string}`,
      abi: realEstateStorageAbi,
      functionName: 'getProperty' as const,
      args: [id] as [bigint],
    }));
  }, [storageAddress, propertyIds]);

  // @ts-ignore - 避免深度类型推断问题
  const { data: propertiesData, isLoading } = useReadContracts({
    contracts: contractsConfig,
    query: { enabled: contractsConfig.length > 0 },
  });

  const properties = useMemo(() => {
    if (!propertiesData) return [];

    const allProperties: any[] = [];

    propertiesData.forEach((item, index) => {
      if (!item || item.status !== 'success') return;

      const resultObj = (item as any).result;
      if (!resultObj || resultObj.error) return;

      const propertyData = resultObj.data || resultObj;
      if (!propertyData) return;

      const property = propertyData as any;

      allProperties.push({
        propertyId: propertyIds[index],
        name: property.name,
        location: property.location,
        metadataURI: property.metadataURI,
        tokenId: property.tokenId,
        publisher: property.publisher,
        totalSupply: property.totalSupply ? BigInt(property.totalSupply.toString()) : BigInt(0),
        maxSupply: property.maxSupply ? BigInt(property.maxSupply.toString()) : BigInt(0),
        active: property.active ?? true,
        unitPriceWei: property.unitPriceWei ? BigInt(property.unitPriceWei.toString()) : BigInt(0),
        annualYieldBps: property.annualYieldBps ? BigInt(property.annualYieldBps.toString()) : BigInt(0),
        projectEndTime: property.projectEndTime ? BigInt(property.projectEndTime.toString()) : BigInt(0), // 项目结束时间
      });
    });

    // 过滤：只显示 active 且未结束的项目（projectEndTime === 0 表示未结束）
    return allProperties.filter(p => {
      const isActive = p.active;
      const isNotEnded = p.projectEndTime === BigInt(0);
      return isActive && isNotEnded;
    });
  }, [propertiesData, propertyIds]);

  return { properties, isLoading };
}

export default function HomePage() {
  const { isConnected } = useAccount();
  const { properties, isLoading: isLoadingProperties } = useAllProperties();
  
  // 计算统计数据
  const stats = useMemo(() => {
    const totalProperties = properties.length;
    const activeProperties = properties.filter(p => p.active).length;
    const totalSupply = properties.reduce((sum, p) => sum + (p.totalSupply || BigInt(0)), BigInt(0));
    
    return {
      totalProperties,
      activeProperties,
      totalSupply: formatEther(totalSupply),
    };
  }, [properties]);

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
              <span className="gradient-text">基于React与Web3</span>
              <br />的房地产平台
            </h1>
            <p className="hero-subtitle">
              基于Web3技术的去中心化房地产平台，让您轻松管理房地产资产和代币化交易
            </p>
            <div className="hero-stats">
              <div className="stat-item">
                <div className="stat-number">
                  {isLoadingProperties ? '...' : stats.totalProperties}
                </div>
                <div className="stat-label">房产项目</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">
                  {isLoadingProperties ? '...' : stats.activeProperties}
                </div>
                <div className="stat-label">活跃项目</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">
                  {isLoadingProperties ? '...' : `${parseFloat(stats.totalSupply).toFixed(0)}`}
                </div>
                <div className="stat-label">已发行份额</div>
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
              <Link href="/assets" className="btn btn-secondary">
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
                  <span>房产项目</span>
                  <span className="value">{isLoadingProperties ? '...' : stats.totalProperties}</span>
                </div>
                <div className="data-row">
                  <span>活跃项目</span>
                  <span className="value">{isLoadingProperties ? '...' : stats.activeProperties}</span>
                </div>
                <div className="data-row">
                  <span>已发行份额</span>
                  <span className="value">{isLoadingProperties ? '...' : parseFloat(stats.totalSupply).toLocaleString()}</span>
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
                <i className="fas fa-building"></i>
              </div>
              <h3>房产发行</h3>
              <p>发布者可以创建房产项目并铸造份额，支持ERC1155标准代币化</p>
              <Link href="/issuance" className="feature-link">
                了解详情 <i className="fas fa-arrow-right"></i>
              </Link>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <i className="fas fa-chart-line"></i>
              </div>
              <h3>收益分配</h3>
              <p>发布者充值收益，投资者按份额比例提取收益，透明可追溯</p>
              <Link href="/distribution" className="feature-link">
                了解详情 <i className="fas fa-arrow-right"></i>
              </Link>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <i className="fas fa-exchange-alt"></i>
              </div>
              <h3>份额转账</h3>
              <p>支持ERC1155份额在用户间自由转账，灵活管理投资组合</p>
              <Link href="/transfer" className="feature-link">
                了解详情 <i className="fas fa-arrow-right"></i>
              </Link>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <i className="fas fa-user-check"></i>
              </div>
              <h3>发布者认证</h3>
              <p>申请成为发布者，通过KYC认证后即可创建和管理房产项目</p>
              <Link href="/issuance" className="feature-link">
                了解详情 <i className="fas fa-arrow-right"></i>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 热门资产 */}
      <section className="hot-assets">
        <div className="container">
          <div className="section-header">
            <h2>热门资产</h2>
            <p>当前平台上的房地产项目</p>
          </div>
          {isLoadingProperties ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
              <i className="fas fa-spinner fa-spin" style={{ fontSize: '2rem', marginBottom: '1rem' }}></i>
              <p>加载中...</p>
            </div>
          ) : properties.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
              <i className="fas fa-building" style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.5 }}></i>
              <p style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>暂无房产项目</p>
              <p style={{ fontSize: '0.9rem', marginBottom: '1.5rem' }}>发布者可以创建新的房产项目</p>
              <Link href="/issuance" className="btn btn-primary">
                <i className="fas fa-plus"></i>
                创建房产项目
              </Link>
            </div>
          ) : (
            <div className="assets-grid">
              {properties.slice(0, 3).map((property, index) => {
                const yieldPercent = property.annualYieldBps 
                  ? (Number(property.annualYieldBps) / 100).toFixed(2)
                  : '0.00';
                const totalSupply = property.totalSupply || BigInt(0);
                const maxSupply = property.maxSupply || BigInt(0);
                
                return (
                  <div key={Number(property.propertyId)} className="asset-card">
                    <div className="asset-image">
                      <div style={{
                        width: '100%',
                        height: '200px',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: '3rem',
                      }}>
                        <i className="fas fa-building"></i>
                      </div>
                      {index === 0 && <div className="asset-badge">最新</div>}
                    </div>
                    <div className="asset-info">
                      <h3>{property.name || `房产 #${Number(property.propertyId)}`}</h3>
                      <p className="asset-location">{property.location || '位置未设置'}</p>
                      <div className="asset-stats">
                        <div className="stat">
                          <span className="label">年化收益</span>
                          <span className="value positive">+{yieldPercent}%</span>
                        </div>
                        <div className="stat">
                          <span className="label">已发行</span>
                          <span className="value">{totalSupply.toString()} / {maxSupply.toString() === '0' ? '∞' : maxSupply.toString()}</span>
                        </div>
                      </div>
                      <Link href="/assets" className="btn btn-outline">
                        查看详情
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {properties.length > 3 && (
            <div style={{ textAlign: 'center', marginTop: '2rem' }}>
              <Link href="/assets" className="btn btn-primary">
                查看所有资产
                <i className="fas fa-arrow-right" style={{ marginLeft: '0.5rem' }}></i>
              </Link>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
