'use client';

import { useMemo, useState, useEffect } from 'react';
import { useAccount, useChainId, useReadContract, useReadContracts, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import Breadcrumb from '../components/layout/Breadcrumb';
import { contracts, SupportedNetwork } from '../../contracts/addresses';
import { realEstateLogicAbi, erc20Abi, realEstateStorageAbi, erc1155Abi } from '../../contracts/abis';
import { usePublisherProperties, type PublisherProperty } from '../../hooks/usePublisherProperties';

// 收益交易状态组件
function YieldTransactionStatus({
  propertyId,
  hash,
  type,
  onSuccess,
}: {
  propertyId: number;
  hash: `0x${string}`;
  type: 'deposit' | 'claim';
  onSuccess: () => void;
}) {
  const { isLoading, isSuccess, isError } = useWaitForTransactionReceipt({
    hash,
  });

  useEffect(() => {
    if (isSuccess) {
      onSuccess();
    }
  }, [isSuccess, onSuccess]);

  if (isLoading) {
    return (
      <div style={{
        padding: '12px',
        borderRadius: '8px',
        background: 'rgba(59, 130, 246, 0.1)',
        color: '#1d4ed8',
        fontSize: '14px',
      }}>
        {type === 'deposit' ? '充值确认中...' : '提取确认中...'} 哈希: {hash.slice(0, 10)}...
      </div>
    );
  }

  if (isError) {
    return (
      <div style={{
        padding: '12px',
        borderRadius: '8px',
        background: 'rgba(239, 68, 68, 0.1)',
        color: '#dc2626',
        fontSize: '14px',
      }}>
        交易失败: {hash.slice(0, 10)}...
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div style={{
        padding: '12px',
        borderRadius: '8px',
        background: 'rgba(16, 185, 129, 0.1)',
        color: '#059669',
        fontSize: '14px',
      }}>
        ✓ {type === 'deposit' ? '收益充值成功！' : '收益提取成功！'} 交易哈希: {hash.slice(0, 10)}...
      </div>
    );
  }

  return null;
}

function useNetworkAddresses() {
  const chainId = useChainId();

  let key: SupportedNetwork | undefined;
  if (chainId === 31337 || chainId === 1337) {
    key = 'localhost';
  } else {
    key = undefined;
  }
  return key ? contracts[key] : undefined;
}

// 获取所有房产的 hook（用于收益分配页面）
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
        lastYieldTimestamp: property.lastYieldTimestamp ? BigInt(property.lastYieldTimestamp.toString()) : BigInt(0),
      });
    });

    return allProperties;
  }, [propertiesData, propertyIds]);

  return { properties, isLoading };
}

export default function DistributionPage() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const addresses = useNetworkAddresses();
  const { writeContractAsync, isPending } = useWriteContract();

  // 获取所有房产（用于显示收益池）
  const { properties: allProperties, isLoading: isLoadingAllProperties } = useAllProperties();
  
  // 获取发布者的房产（用于发布者充值收益）
  const { properties: publisherProperties } = usePublisherProperties();

  // 获取代币合约地址
  const myTokenAddress = useMemo(() => {
    const key = chainId === 31337 || chainId === 1337 ? 'localhost' : undefined;
    return key ? contracts[key]?.myToken : undefined;
  }, [chainId]);

  // 查询用户在所有房产中的余额
  const userBalanceQueries = useMemo(() => {
    if (!myTokenAddress || allProperties.length === 0 || !address) return [];
    return allProperties.map((property) => ({
      address: myTokenAddress as `0x${string}`,
      abi: erc1155Abi,
      functionName: 'balanceOf' as const,
      args: [address, property.tokenId] as [`0x${string}`, bigint],
    }));
  }, [myTokenAddress, allProperties, address]);

  const userBalancesQuery = useReadContracts({
    contracts: userBalanceQueries,
    query: { enabled: userBalanceQueries.length > 0 },
  });
  const userBalancesData = userBalancesQuery.data as any[] | undefined;

  // 过滤房产：只显示自己发布的或已购买的
  const filteredProperties = useMemo(() => {
    if (!address) return [];
    
    return allProperties.filter((property, index) => {
      // 检查是否是发布者
      const isPublisher = property.publisher.toLowerCase() === address.toLowerCase();
      if (isPublisher) return true;
      
      // 检查是否持有该房产的代币
      const balanceItem = userBalancesData?.[index];
      if (balanceItem?.status === 'success') {
        const balance = balanceItem.result as bigint | undefined;
        if (balance && balance > 0n) return true;
      }
      
      return false;
    });
  }, [allProperties, address, userBalancesData]);

  // 收益管理相关状态
  const [yieldFormExpanded, setYieldFormExpanded] = useState<Record<number, boolean>>({});
  const [yieldDepositForms, setYieldDepositForms] = useState<Record<number, { amount: string }>>({});
  const [yieldDepositHashes, setYieldDepositHashes] = useState<Record<number, `0x${string}` | null>>({});
  const [yieldClaimHashes, setYieldClaimHashes] = useState<Record<number, `0x${string}` | null>>({});
  const [yieldStatus, setYieldStatus] = useState<Record<number, string | null>>({});

  // 获取测试代币地址
  const testTokenAddress = useMemo(() => {
    const key = chainId === 31337 || chainId === 1337 ? 'localhost' : undefined;
    return key ? contracts[key]?.testToken : undefined;
  }, [chainId]);

  // 查询收益代币地址
  // @ts-ignore - 避免深度类型推断问题
  const { data: rewardTokenAddress } = useReadContract({
    address: addresses?.realEstateLogic,
    abi: realEstateLogicAbi as any,
    functionName: 'rewardToken',
    query: { enabled: !!addresses?.realEstateLogic },
  } as any);

  // 查询用户测试代币余额
  // @ts-ignore - 避免深度类型推断问题
  const { data: testTokenBalance } = useReadContract({
    address: rewardTokenAddress || testTokenAddress,
    abi: erc20Abi as any,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!(rewardTokenAddress || testTokenAddress) && !!address },
  } as any);

  // 查询过滤后房产的收益池总额
  const yieldPoolQueries = useMemo(() => {
    if (!addresses?.realEstateLogic || filteredProperties.length === 0) return [];
    return filteredProperties.map((property) => ({
      address: addresses.realEstateLogic as `0x${string}`,
      abi: realEstateLogicAbi,
      functionName: 'getYieldPool' as const,
      args: [property.propertyId] as [bigint],
    }));
  }, [addresses?.realEstateLogic, filteredProperties]);

  const yieldPoolsQuery = useReadContracts({
    contracts: yieldPoolQueries,
    query: { enabled: yieldPoolQueries.length > 0 },
  });
  const yieldPoolsData = yieldPoolsQuery.data as any[] | undefined;

  // 查询可提取收益（当前用户）
  const claimableYieldQueries = useMemo(() => {
    if (!addresses?.realEstateLogic || filteredProperties.length === 0 || !address) return [];
    return filteredProperties.map((property) => ({
      address: addresses.realEstateLogic as `0x${string}`,
      abi: realEstateLogicAbi,
      functionName: 'getClaimableYield' as const,
      args: [property.propertyId, address] as [bigint, `0x${string}`],
    }));
  }, [addresses?.realEstateLogic, filteredProperties, address]);

  const claimableYieldsQuery = useReadContracts({
    contracts: claimableYieldQueries,
    query: { enabled: claimableYieldQueries.length > 0 },
  });
  const claimableYieldsData = claimableYieldsQuery.data as any[] | undefined;

  // 查询年化收益（用于计算建议充值金额）
  const annualYieldQueries = useMemo(() => {
    if (!addresses?.realEstateLogic || filteredProperties.length === 0) return [];
    return filteredProperties.map((property) => ({
      address: addresses.realEstateLogic as `0x${string}`,
      abi: realEstateLogicAbi,
      functionName: 'calculateAnnualYield' as const,
      args: [property.propertyId] as [bigint],
    }));
  }, [addresses?.realEstateLogic, filteredProperties]);

  const annualYieldsQuery = useReadContracts({
    contracts: annualYieldQueries,
    query: { enabled: annualYieldQueries.length > 0 },
  });
  const annualYieldsData = annualYieldsQuery.data as any[] | undefined;

  // 处理充值收益
  const handleDepositYield = async (e: React.FormEvent, propertyId: bigint) => {
    e.preventDefault();
    if (!addresses || !rewardTokenAddress) return;

    const form = yieldDepositForms[Number(propertyId)];
    if (!form || !form.amount) {
      setYieldStatus(prev => ({ ...prev, [Number(propertyId)]: '请输入充值金额' }));
      return;
    }

    const amount = parseEther(form.amount);
    if (amount <= 0n) {
      setYieldStatus(prev => ({ ...prev, [Number(propertyId)]: '金额必须大于 0' }));
      return;
    }

    try {
      setYieldStatus(prev => ({ ...prev, [Number(propertyId)]: '授权中...' }));

      // 1. 先授权
      const approveHash = await writeContractAsync({
        address: rewardTokenAddress as `0x${string}`,
        abi: erc20Abi as any,
        functionName: 'approve',
        args: [addresses.realEstateLogic, amount],
      } as any);

      await new Promise(resolve => setTimeout(resolve, 2000)); // 等待确认

      // 2. 充值收益
      setYieldStatus(prev => ({ ...prev, [Number(propertyId)]: '充值中...' }));
      // @ts-ignore - 避免深度类型推断问题
      const hash = await writeContractAsync({
        address: addresses.realEstateLogic,
        abi: realEstateLogicAbi as any,
        functionName: 'depositYield',
        args: [propertyId, amount],
      } as any);

      setYieldDepositHashes(prev => ({ ...prev, [Number(propertyId)]: hash }));
      setYieldStatus(prev => ({ ...prev, [Number(propertyId)]: `充值成功：${hash}` }));

      // 清空表单
      setYieldDepositForms(prev => ({
        ...prev,
        [Number(propertyId)]: { amount: '' },
      }));
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '充值失败';
      setYieldStatus(prev => ({ ...prev, [Number(propertyId)]: errorMsg }));
      console.error('充值收益失败:', err);
    }
  };

  // 处理提取收益
  const handleClaimYield = async (propertyId: bigint) => {
    if (!addresses) return;

    try {
      setYieldStatus(prev => ({ ...prev, [Number(propertyId)]: '提取中...' }));

      // @ts-ignore - 避免深度类型推断问题
      const hash = await writeContractAsync({
        address: addresses.realEstateLogic,
        abi: realEstateLogicAbi as any,
        functionName: 'claimYield',
        args: [propertyId],
      } as any);

      setYieldClaimHashes(prev => ({ ...prev, [Number(propertyId)]: hash }));
      setYieldStatus(prev => ({ ...prev, [Number(propertyId)]: `提取成功：${hash}` }));
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '提取失败';
      setYieldStatus(prev => ({ ...prev, [Number(propertyId)]: errorMsg }));
      console.error('提取收益失败:', err);
    }
  };

  const cardStyle: React.CSSProperties = {
    background: '#fff',
    border: '1px solid #e2e8f0',
    borderRadius: '16px',
    padding: '24px',
    boxShadow: '0 6px 20px rgba(15,23,42,0.06)',
    marginBottom: '1.5rem',
  };

  return (
    <>
      <section className="page-hero" style={{ background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' }}>
        <div className="container">
          <Breadcrumb
            items={[
              { label: '首页', href: '/' },
              { label: '收益分配' },
            ]}
          />
          <h1 className="page-title">收益分配</h1>
          <p className="page-subtitle">
            查看和管理您的收益分配，获取投资回报
          </p>
        </div>
      </section>

      <div className="container" style={{ padding: '2.5rem 1rem' }}>
        {!isConnected && (
          <div style={cardStyle}>
            <p style={{ margin: 0, color: '#64748b' }}>请先连接钱包以查看收益分配信息。</p>
          </div>
        )}

        {isConnected && !addresses && (
          <div style={cardStyle}>
            <p style={{ margin: 0, color: '#b91c1c' }}>
              当前网络（Chain ID: {chainId}）未配置合约地址，请切换到 localhost 或在 `src/contracts/addresses.ts` 中添加配置。
            </p>
          </div>
        )}

        {isConnected && addresses && (
          <>
            {isLoadingAllProperties || userBalancesQuery.isLoading ? (
              <div style={cardStyle}>
                <p style={{ margin: 0, color: '#64748b' }}>加载中...</p>
              </div>
            ) : filteredProperties.length === 0 ? (
              <div style={cardStyle}>
                <p style={{ margin: 0, color: '#64748b' }}>
                  {allProperties.length === 0 
                    ? '暂无房产数据。' 
                    : '您还没有发布任何房产，也没有购买任何房产份额。'}
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {filteredProperties.map((property, index) => {
                  const propertyIdNum = Number(property.propertyId);
                  const isExpanded = yieldFormExpanded[propertyIdNum] || false;
                  const isPublisher = property.publisher.toLowerCase() === address?.toLowerCase();
                  
                  // 获取收益池数据
                  const yieldPoolItem = yieldPoolsData?.[index];
                  const claimableYieldItem = claimableYieldsData?.[index];
                  const yieldPool = yieldPoolItem?.status === 'success' ? (yieldPoolItem as any).result : undefined;
                  const claimableYield = claimableYieldItem?.status === 'success' ? (claimableYieldItem as any).result : undefined;

                  return (
                    <div key={propertyIdNum} style={cardStyle}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                        <div style={{ flex: 1 }}>
                          <h3 style={{ margin: '0 0 8px', fontSize: '18px', fontWeight: 600 }}>
                            #{propertyIdNum} - {property.name}
                          </h3>
                          <p style={{ margin: '0 0 12px', color: '#64748b', fontSize: '14px' }}>
                            {property.location}
                          </p>
                          
                          {/* 收益池信息卡片 */}
                          <div style={{
                            padding: '16px',
                            borderRadius: '10px',
                            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                            color: '#fff',
                            marginBottom: '16px',
                          }}>
                            <h5 style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: 600, opacity: 0.9 }}>
                              收益池信息
                            </h5>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '13px' }}>
                              <div>
                                <div style={{ opacity: 0.8, marginBottom: '4px' }}>收益池总额</div>
                                <div style={{ fontSize: '18px', fontWeight: 600 }}>
                                  {yieldPool ? formatEther(yieldPool as bigint) : '0'} TUSDC
                                </div>
                              </div>
                              <div>
                                <div style={{ opacity: 0.8, marginBottom: '4px' }}>你可提取</div>
                                <div style={{ fontSize: '18px', fontWeight: 600 }}>
                                  {claimableYield ? formatEther(claimableYield as bigint) : '0'} TUSDC
                                </div>
                              </div>
                            </div>
                            {claimableYield && claimableYield > 0n && (
                              <button
                                onClick={() => handleClaimYield(property.propertyId)}
                                disabled={isPending}
                                style={{
                                  marginTop: '12px',
                                  padding: '8px 16px',
                                  borderRadius: '8px',
                                  border: 'none',
                                  background: 'rgba(255, 255, 255, 0.2)',
                                  color: '#fff',
                                  cursor: isPending ? 'not-allowed' : 'pointer',
                                  fontSize: '13px',
                                  fontWeight: 500,
                                  width: '100%',
                                }}
                              >
                                {isPending ? '提取中...' : '提取收益'}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* 发布者充值收益表单 */}
                      {isPublisher && (
                        <div style={{
                          marginTop: '16px',
                          paddingTop: '16px',
                          borderTop: '1px solid #e2e8f0',
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                            <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>发布者充值收益</h4>
                            <button
                              onClick={() => setYieldFormExpanded(prev => ({ ...prev, [propertyIdNum]: !isExpanded }))}
                              style={{
                                padding: '6px 12px',
                                borderRadius: '8px',
                                border: '1px solid #cbd5e1',
                                background: '#fff',
                                cursor: 'pointer',
                                fontSize: '13px',
                                color: '#4338ca',
                              }}
                            >
                              {isExpanded ? '收起' : '展开充值表单'}
                            </button>
                          </div>

                          {isExpanded && (() => {
                            // 计算建议充值金额
                            const annualYieldItem = annualYieldsData && index < annualYieldsData.length 
                              ? annualYieldsData[index] 
                              : undefined;
                            const annualYield = annualYieldItem?.status === 'success' 
                              ? (annualYieldItem as any).result as bigint 
                              : undefined;
                            
                            // 计算基于时间的建议金额
                            const now = BigInt(Math.floor(Date.now() / 1000));
                            const lastTimestamp = property.lastYieldTimestamp || BigInt(0);
                            const timeSinceLastDeposit = lastTimestamp > 0n 
                              ? now - lastTimestamp 
                              : BigInt(0);
                            
                            // 计算建议金额（基于年化收益率和时间间隔）
                            const calculateSuggestedAmount = (months: number) => {
                              if (!annualYield || annualYield === 0n) return null;
                              // 年化收益 × (月数 / 12)
                              const suggested = (annualYield * BigInt(months)) / BigInt(12);
                              return formatEther(suggested);
                            };

                            // 基于实际时间间隔计算建议金额
                            const calculateTimeBasedAmount = () => {
                              if (!annualYield || annualYield === 0n || timeSinceLastDeposit === 0n) return null;
                              // 年化收益 × (时间间隔秒数 / 一年秒数)
                              const secondsPerYear = BigInt(365 * 24 * 60 * 60);
                              const suggested = (annualYield * timeSinceLastDeposit) / secondsPerYear;
                              return formatEther(suggested);
                            };

                            const timeBasedAmount = calculateTimeBasedAmount();
                            const monthlyAmount = calculateSuggestedAmount(1);
                            const quarterlyAmount = calculateSuggestedAmount(3);
                            const annualAmount = annualYield ? formatEther(annualYield) : null;

                            return (
                            <form
                              onSubmit={(e) => handleDepositYield(e, property.propertyId)}
                              style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '12px',
                              }}
                            >
                                {/* 建议充值金额卡片 */}
                                {(annualYield && annualYield > 0n) && (
                                  <div style={{
                                    padding: '12px',
                                    borderRadius: '8px',
                                    background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                                    color: '#fff',
                                  }}>
                                    <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '8px', opacity: 0.9 }}>
                                      💡 建议充值金额
                                    </div>
                                    <div style={{ fontSize: '12px', opacity: 0.8, marginBottom: '8px' }}>
                                      年化收益: {annualAmount} TUSDC/年
                                      {property.annualYieldBps > 0n && (
                                        <span> ({(Number(property.annualYieldBps) / 100).toFixed(2)}%)</span>
                                      )}
                                    </div>
                                    {timeSinceLastDeposit > 0n && timeBasedAmount && (
                                      <div style={{ fontSize: '12px', opacity: 0.8, marginBottom: '8px' }}>
                                        距离上次充值: {Math.floor(Number(timeSinceLastDeposit) / (24 * 60 * 60))} 天
                                        <br />
                                        建议充值: <strong>{timeBasedAmount} TUSDC</strong>
                                      </div>
                                    )}
                                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '8px' }}>
                                      {monthlyAmount && (
                                        <button
                                          type="button"
                                          onClick={() => setYieldDepositForms(prev => ({
                                            ...prev,
                                            [propertyIdNum]: { amount: monthlyAmount },
                                          }))}
                                          style={{
                                            padding: '6px 12px',
                                            borderRadius: '6px',
                                            border: '1px solid rgba(255,255,255,0.3)',
                                            background: 'rgba(255,255,255,0.15)',
                                            color: '#fff',
                                            cursor: 'pointer',
                                            fontSize: '12px',
                                            fontWeight: 500,
                                          }}
                                        >
                                          1个月 ({monthlyAmount})
                                        </button>
                                      )}
                                      {quarterlyAmount && (
                                        <button
                                          type="button"
                                          onClick={() => setYieldDepositForms(prev => ({
                                            ...prev,
                                            [propertyIdNum]: { amount: quarterlyAmount },
                                          }))}
                                          style={{
                                            padding: '6px 12px',
                                            borderRadius: '6px',
                                            border: '1px solid rgba(255,255,255,0.3)',
                                            background: 'rgba(255,255,255,0.15)',
                                            color: '#fff',
                                            cursor: 'pointer',
                                            fontSize: '12px',
                                            fontWeight: 500,
                                          }}
                                        >
                                          3个月 ({quarterlyAmount})
                                        </button>
                                      )}
                                      {annualAmount && (
                                        <button
                                          type="button"
                                          onClick={() => setYieldDepositForms(prev => ({
                                            ...prev,
                                            [propertyIdNum]: { amount: annualAmount },
                                          }))}
                                          style={{
                                            padding: '6px 12px',
                                            borderRadius: '6px',
                                            border: '1px solid rgba(255,255,255,0.3)',
                                            background: 'rgba(255,255,255,0.15)',
                                            color: '#fff',
                                            cursor: 'pointer',
                                            fontSize: '12px',
                                            fontWeight: 500,
                                          }}
                                        >
                                          1年 ({annualAmount})
                                        </button>
                                      )}
                                      {timeBasedAmount && (
                                        <button
                                          type="button"
                                          onClick={() => setYieldDepositForms(prev => ({
                                            ...prev,
                                            [propertyIdNum]: { amount: timeBasedAmount },
                                          }))}
                                          style={{
                                            padding: '6px 12px',
                                            borderRadius: '6px',
                                            border: '1px solid rgba(255,255,255,0.3)',
                                            background: 'rgba(255,255,255,0.25)',
                                            color: '#fff',
                                            cursor: 'pointer',
                                            fontSize: '12px',
                                            fontWeight: 600,
                                          }}
                                        >
                                          按时间 ({timeBasedAmount})
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                )}

                              <div>
                                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: 500 }}>
                                  充值收益金额 (TUSDC) *
                                </label>
                                <input
                                  type="number"
                                  step="0.000001"
                                  value={yieldDepositForms[propertyIdNum]?.amount || ''}
                                  onChange={(e) => setYieldDepositForms(prev => ({
                                    ...prev,
                                    [propertyIdNum]: { amount: e.target.value },
                                  }))}
                                    placeholder={timeBasedAmount ? `建议: ${timeBasedAmount}` : "如：1000"}
                                  required
                                  style={{
                                    width: '100%',
                                    padding: '10px 12px',
                                    borderRadius: '8px',
                                    border: '1px solid #cbd5e1',
                                    fontSize: '14px',
                                  }}
                                />
                                {testTokenBalance && (
                                  <small style={{ fontSize: '12px', color: '#64748b', marginTop: '4px', display: 'block' }}>
                                    你的余额: {formatEther(testTokenBalance as bigint)} TUSDC
                                  </small>
                                )}
                                  {!annualYield || annualYield === 0n ? (
                                    <small style={{ fontSize: '12px', color: '#f59e0b', marginTop: '4px', display: 'block' }}>
                                      ⚠️ 未设置年化收益率，无法计算建议金额
                                    </small>
                                  ) : null}
                              </div>

                              {yieldDepositHashes[propertyIdNum] && (
                                <YieldTransactionStatus
                                  propertyId={propertyIdNum}
                                  hash={yieldDepositHashes[propertyIdNum]!}
                                  type="deposit"
                                  onSuccess={() => {
                                    setYieldDepositHashes(prev => {
                                      const newState = { ...prev };
                                      delete newState[propertyIdNum];
                                      return newState;
                                    });
                                    setYieldStatus(prev => {
                                      const newState = { ...prev };
                                      delete newState[propertyIdNum];
                                      return newState;
                                    });
                                    setYieldDepositForms(prev => ({
                                      ...prev,
                                      [propertyIdNum]: { amount: '' },
                                    }));
                                  }}
                                />
                              )}

                              {yieldStatus[propertyIdNum] && !yieldDepositHashes[propertyIdNum] && (
                                <div style={{
                                  padding: '12px',
                                  borderRadius: '8px',
                                  background: 'rgba(239, 68, 68, 0.1)',
                                  color: '#dc2626',
                                  fontSize: '14px',
                                }}>
                                  {yieldStatus[propertyIdNum]}
                                </div>
                              )}

                              <button
                                type="submit"
                                disabled={isPending || !rewardTokenAddress}
                                style={{
                                  padding: '10px 16px',
                                  borderRadius: '8px',
                                  border: 'none',
                                  background: '#10b981',
                                  color: '#fff',
                                  cursor: isPending ? 'not-allowed' : 'pointer',
                                  fontSize: '14px',
                                  fontWeight: 500,
                                  opacity: isPending ? 0.7 : 1,
                                }}
                              >
                                {isPending ? '处理中...' : '充值收益'}
                              </button>
                            </form>
                            );
                          })()}

                          {!rewardTokenAddress && (
                            <div style={{
                              padding: '12px',
                              borderRadius: '8px',
                              background: 'rgba(245, 158, 11, 0.1)',
                              color: '#92400e',
                              fontSize: '14px',
                              marginTop: '12px',
                            }}>
                              ⚠️ 收益代币未设置，请联系管理员配置。
                            </div>
                          )}
                        </div>
                      )}

                      {/* 提取收益交易状态 */}
                      {yieldClaimHashes[propertyIdNum] && (
                        <div style={{ marginTop: '12px' }}>
                          <YieldTransactionStatus
                            propertyId={propertyIdNum}
                            hash={yieldClaimHashes[propertyIdNum]!}
                            type="claim"
                            onSuccess={() => {
                              setYieldClaimHashes(prev => {
                                const newState = { ...prev };
                                delete newState[propertyIdNum];
                                return newState;
                              });
                              setYieldStatus(prev => {
                                const newState = { ...prev };
                                delete newState[propertyIdNum];
                                return newState;
                              });
                            }}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
