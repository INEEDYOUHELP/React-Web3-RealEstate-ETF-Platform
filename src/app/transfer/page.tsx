'use client';

import React, { useMemo, useState } from 'react';
import { useAccount, useChainId, useReadContract, useReadContracts, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { isAddress } from 'viem';
import Breadcrumb from '../components/layout/Breadcrumb';
import { contracts, SupportedNetwork } from '../../contracts/addresses';
import { erc1155Abi, realEstateStorageAbi } from '../../contracts/abis';

// 获取所有房产的 hook（用于转账页面）
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

// 转账交易状态组件
function TransferTransactionStatus({
  hash,
  onSuccess,
}: {
  hash: `0x${string}`;
  onSuccess: () => void;
}) {
  const { isLoading, isSuccess, isError } = useWaitForTransactionReceipt({
    hash,
  });

  // 使用 useEffect 处理成功回调
  React.useEffect(() => {
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
        转账确认中... 哈希: {hash.slice(0, 10)}...
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
        ✓ 转账成功！交易哈希: {hash.slice(0, 10)}...
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

export default function TransferPage() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const addresses = useNetworkAddresses();
  const { writeContractAsync, isPending } = useWriteContract();

  // 获取所有房产
  const { properties: allProperties, isLoading: isLoadingProperties } = useAllProperties();

  // 转账表单状态
  const [selectedPropertyId, setSelectedPropertyId] = useState<number | null>(null);
  const [toAddress, setToAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [transferHash, setTransferHash] = useState<`0x${string}` | null>(null);
  const [transferStatus, setTransferStatus] = useState<string | null>(null);

  // 获取选中的房产信息
  const selectedProperty = useMemo(() => {
    if (selectedPropertyId === null) return null;
    return allProperties.find(p => Number(p.propertyId) === selectedPropertyId) || null;
  }, [allProperties, selectedPropertyId]);

  // 查询用户持有的份额
  const { data: userBalance } = useReadContract({
    address: addresses?.myToken,
    abi: erc1155Abi,
    functionName: 'balanceOf',
    args: selectedProperty && address
      ? [address, selectedProperty.tokenId]
      : undefined,
    query: { enabled: !!addresses?.myToken && !!selectedProperty && !!address },
  });

  // 处理转账
  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!addresses?.myToken || !selectedProperty || !address) {
      setTransferStatus('请先连接钱包并选择要转账的房产');
      return;
    }

    if (!toAddress || !isAddress(toAddress)) {
      setTransferStatus('请输入有效的接收方地址');
      return;
    }

    if (!amount || Number(amount) <= 0) {
      setTransferStatus('请输入有效的转账数量');
      return;
    }

    const amountBigInt = BigInt(Math.floor(Number(amount)));
    const balance = userBalance as bigint | undefined;

    if (!balance || balance < amountBigInt) {
      setTransferStatus(`余额不足，您当前持有 ${balance?.toString() || '0'} 份额`);
      return;
    }

    try {
      setTransferStatus('提交转账交易...');

      // @ts-ignore - 避免深度类型推断问题
      const hash = await writeContractAsync({
        address: addresses.myToken,
        abi: erc1155Abi,
        functionName: 'safeTransferFrom',
        args: [
          address,
          toAddress as `0x${string}`,
          selectedProperty.tokenId,
          amountBigInt,
          '0x' as `0x${string}`, // 空 data
        ],
      } as any);

      setTransferHash(hash);
      setTransferStatus(`交易已提交：${hash.slice(0, 10)}...`);

      // 清空表单
      setToAddress('');
      setAmount('');
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '转账失败';
      setTransferStatus(errorMsg);
      console.error('转账失败:', err);
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
      <section className="page-hero" style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
        <div className="container">
          <Breadcrumb
            items={[
              { label: '首页', href: '/' },
              { label: '份额转账' },
            ]}
          />
          <h1 className="page-title">份额转账</h1>
          <p className="page-subtitle">
            C2C份额转账，安全便捷地转移您的房产份额
          </p>
        </div>
      </section>

      <div className="container" style={{ padding: '2.5rem 1rem' }}>
        {!isConnected && (
          <div style={cardStyle}>
            <p style={{ margin: 0, color: '#64748b' }}>请先连接钱包以进行份额转账。</p>
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
            {/* 转账表单 */}
            <div style={cardStyle}>
              <h2 style={{ marginBottom: '1.5rem', color: '#1f2937', fontSize: '1.5rem' }}>
                <i className="fas fa-exchange-alt" style={{ marginRight: '0.5rem', color: '#06b6d4' }}></i>
                转账份额
              </h2>

              <form onSubmit={handleTransfer} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {/* 选择房产 */}
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500, color: '#374151' }}>
                    选择房产 *
                  </label>
                  {isLoadingProperties ? (
                    <p style={{ color: '#64748b', fontSize: '14px' }}>加载中...</p>
                  ) : allProperties.length === 0 ? (
                    <p style={{ color: '#64748b', fontSize: '14px' }}>暂无房产数据。</p>
                  ) : (
                    <select
                      value={selectedPropertyId || ''}
                      onChange={(e) => {
                        const id = e.target.value ? Number(e.target.value) : null;
                        setSelectedPropertyId(id);
                        setAmount('');
                      }}
                      required
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        fontSize: '14px',
                        background: '#fff',
                      }}
                    >
                      <option value="">请选择要转账的房产</option>
                      {allProperties.map((property) => (
                        <option key={Number(property.propertyId)} value={Number(property.propertyId)}>
                          #{Number(property.propertyId)} - {property.name} ({property.location})
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* 显示持有份额 */}
                {selectedProperty && userBalance !== undefined && (
                  <div style={{
                    padding: '12px',
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: '#fff',
                  }}>
                    <div style={{ fontSize: '13px', opacity: 0.9, marginBottom: '4px' }}>
                      您当前持有
                    </div>
                    <div style={{ fontSize: '20px', fontWeight: 600 }}>
                      {userBalance.toString()} 份额
                    </div>
                    <div style={{ fontSize: '12px', opacity: 0.8, marginTop: '4px' }}>
                      {selectedProperty.name} - {selectedProperty.location}
                    </div>
                  </div>
                )}

                {/* 接收方地址 */}
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500, color: '#374151' }}>
                    接收方地址 *
                  </label>
                  <input
                    type="text"
                    value={toAddress}
                    onChange={(e) => setToAddress(e.target.value)}
                    placeholder="0x..."
                    required
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '14px',
                      fontFamily: 'monospace',
                    }}
                  />
                  {toAddress && !isAddress(toAddress) && (
                    <small style={{ fontSize: '12px', color: '#dc2626', marginTop: '4px', display: 'block' }}>
                      无效的地址格式
                    </small>
                  )}
                </div>

                {/* 转账数量 */}
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500, color: '#374151' }}>
                    转账数量 *
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="输入要转账的份额数量"
                    required
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '14px',
                    }}
                  />
                  {userBalance && amount && Number(amount) > Number(userBalance.toString()) && (
                    <small style={{ fontSize: '12px', color: '#dc2626', marginTop: '4px', display: 'block' }}>
                      余额不足，最多可转账 {userBalance.toString()} 份额
                    </small>
                  )}
                  {userBalance && (
                    <button
                      type="button"
                      onClick={() => setAmount(userBalance.toString())}
                      style={{
                        marginTop: '8px',
                        padding: '6px 12px',
                        borderRadius: '6px',
                        border: '1px solid #cbd5e1',
                        background: '#f9fafb',
                        color: '#374151',
                        cursor: 'pointer',
                        fontSize: '12px',
                      }}
                    >
                      使用全部余额
                    </button>
                  )}
                </div>

                {/* 交易状态 */}
                {transferHash && (
                  <TransferTransactionStatus
                    hash={transferHash}
                    onSuccess={() => {
                      setTransferHash(null);
                      setTransferStatus(null);
                      setSelectedPropertyId(null);
                    }}
                  />
                )}

                {transferStatus && !transferHash && (
                  <div style={{
                    padding: '12px',
                    borderRadius: '8px',
                    background: transferStatus.includes('失败') || transferStatus.includes('无效') || transferStatus.includes('不足')
                      ? 'rgba(239, 68, 68, 0.1)'
                      : 'rgba(59, 130, 246, 0.1)',
                    color: transferStatus.includes('失败') || transferStatus.includes('无效') || transferStatus.includes('不足')
                      ? '#dc2626'
                      : '#1d4ed8',
                    fontSize: '14px',
                  }}>
                    {transferStatus}
                  </div>
                )}

                {/* 提交按钮 */}
                <button
                  type="submit"
                  disabled={isPending || !selectedProperty || !toAddress || !amount || !isAddress(toAddress)}
                  style={{
                    padding: '12px 24px',
                    borderRadius: '8px',
                    border: 'none',
                    background: isPending || !selectedProperty || !toAddress || !amount || !isAddress(toAddress)
                      ? '#9ca3af'
                      : '#06b6d4',
                    color: '#fff',
                    cursor: isPending || !selectedProperty || !toAddress || !amount || !isAddress(toAddress)
                      ? 'not-allowed'
                      : 'pointer',
                    fontSize: '16px',
                    fontWeight: 500,
                    transition: 'all 0.2s',
                  }}
                >
                  {isPending ? '转账中...' : '确认转账'}
                </button>
              </form>
            </div>

            {/* 持有份额列表 */}
            {allProperties.length > 0 && (
              <div style={cardStyle}>
                <h3 style={{ marginBottom: '1rem', color: '#1f2937', fontSize: '1.25rem' }}>
                  我的持有份额
                </h3>
                {isLoadingProperties ? (
                  <p style={{ color: '#64748b' }}>加载中...</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {allProperties.map((property) => (
                      <UserShareBalance
                        key={Number(property.propertyId)}
                        property={property}
                        myTokenAddress={addresses.myToken}
                        userAddress={address}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}

// 用户份额余额组件
function UserShareBalance({
  property,
  myTokenAddress,
  userAddress,
}: {
  property: any;
  myTokenAddress?: string;
  userAddress?: string;
}) {
  const { data: balance } = useReadContract({
    address: myTokenAddress as `0x${string}` | undefined,
    abi: erc1155Abi,
    functionName: 'balanceOf',
    args: userAddress && property.tokenId
      ? [userAddress, property.tokenId]
      : undefined,
    query: { enabled: !!myTokenAddress && !!userAddress && !!property.tokenId },
  });

  const balanceNum = balance ? Number(balance.toString()) : 0;

  if (balanceNum === 0) return null;

  return (
    <div style={{
      padding: '16px',
      borderRadius: '10px',
      border: '1px solid #e2e8f0',
      background: '#f9fafb',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: '16px', fontWeight: 600, color: '#1f2937', marginBottom: '4px' }}>
            #{Number(property.propertyId)} - {property.name}
          </div>
          <div style={{ fontSize: '13px', color: '#64748b' }}>
            {property.location}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '20px', fontWeight: 600, color: '#10b981' }}>
            {balanceNum}
          </div>
          <div style={{ fontSize: '12px', color: '#64748b' }}>
            份额
          </div>
        </div>
      </div>
    </div>
  );
}
