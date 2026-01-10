'use client';

import { useMemo, useState, useEffect } from 'react';
import { useAccount, useChainId, useReadContract, useReadContracts, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { formatEther } from 'viem';
import Breadcrumb from '../components/layout/Breadcrumb';
import { contracts, SupportedNetwork } from '../../contracts/addresses';
import { realEstateLogicAbi, erc20Abi, realEstateStorageAbi, erc1155Abi } from '../../contracts/abis';

// 收益提取交易状态组件
function YieldTransactionStatus({
  propertyId,
  hash,
  onSuccess,
}: {
  propertyId: number;
  hash: `0x${string}`;
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
        提取确认中... 哈希: {hash.slice(0, 10)}...
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
        ✓ 收益提取成功！交易哈希: {hash.slice(0, 10)}...
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
        createTime: property.createTime ? BigInt(property.createTime.toString()) : BigInt(0),
        projectEndTime: property.projectEndTime ? BigInt(property.projectEndTime.toString()) : BigInt(0),
        refundLockPeriod: property.refundLockPeriod ? BigInt(property.refundLockPeriod.toString()) : BigInt(365 * 24 * 60 * 60),
      });
    });

    return allProperties;
  }, [propertiesData, propertyIds]);

  return { properties, isLoading };
}

// 购买记录类型
interface PurchaseRecord {
  amount: bigint;
  payAmount: bigint;
  purchaseTime: bigint;
  refunded: boolean;
}

// 获取用户购买记录的 hook
function usePurchaseRecords(propertyId: bigint | undefined, buyer: string | undefined, logicAddress: `0x${string}` | undefined) {
  // 先获取购买记录数量
  const { data: recordCount } = useReadContract({
    address: logicAddress,
    abi: realEstateLogicAbi,
    functionName: 'getPurchaseRecordCount',
    args: propertyId !== undefined && buyer ? [propertyId, buyer as `0x${string}`] : undefined,
    query: { enabled: !!logicAddress && propertyId !== undefined && !!buyer },
  });

  // 构建查询所有购买记录的合约调用
  const purchaseRecordQueries = useMemo(() => {
    if (!logicAddress || propertyId === undefined || !buyer || !recordCount || recordCount === 0n) return [];
    
    const count = Number(recordCount);
    return Array.from({ length: count }, (_, i) => ({
      address: logicAddress,
      abi: realEstateLogicAbi,
      functionName: 'purchaseRecords' as const,
      args: [propertyId, buyer as `0x${string}`, BigInt(i)] as [bigint, `0x${string}`, bigint],
    }));
  }, [logicAddress, propertyId, buyer, recordCount]);

  const { data: purchaseRecordsData } = useReadContracts({
    contracts: purchaseRecordQueries,
    query: { enabled: purchaseRecordQueries.length > 0 },
  });

  const purchaseRecords = useMemo(() => {
    if (!purchaseRecordsData) return [];
    
    return purchaseRecordsData.map((item: any) => {
      if (item?.status !== 'success') return null;
      const record = item.result as any;
      if (!record) return null;
      
      return {
        amount: BigInt(record[0].toString()),
        payAmount: BigInt(record[1].toString()),
        purchaseTime: BigInt(record[2].toString()),
        refunded: record[3] as boolean,
      } as PurchaseRecord;
    }).filter((r): r is PurchaseRecord => r !== null);
  }, [purchaseRecordsData]);

  return { purchaseRecords, recordCount: recordCount || 0n };
}

// 退款状态组件
function RefundStatus({
  propertyId,
  purchaseIndex,
  purchaseRecord,
  property,
  buyer,
  logicAddress,
}: {
  propertyId: bigint;
  purchaseIndex: number;
  purchaseRecord: PurchaseRecord;
  property: any;
  buyer: string;
  logicAddress: `0x${string}` | undefined;
}) {
  const { writeContractAsync, isPending: isWritePending } = useWriteContract();
  const [refundHash, setRefundHash] = useState<`0x${string}` | null>(null);
  const [refundStatusMessage, setRefundStatusMessage] = useState<string | null>(null);

  // 获取 MyToken 合约地址（用于授权）
  const chainId = useChainId();
  const myTokenAddress = useMemo(() => {
    const key = chainId === 31337 || chainId === 1337 ? 'localhost' : undefined;
    return key ? contracts[key]?.myToken : undefined;
  }, [chainId]);

  // 查询是否已授权代币操作
  const { data: isApproved } = useReadContract({
    address: myTokenAddress,
    abi: erc1155Abi,
    functionName: 'isApprovedForAll',
    args: buyer && logicAddress ? [buyer as `0x${string}`, logicAddress as `0x${string}`] : undefined,
    query: { enabled: !!myTokenAddress && !!buyer && !!logicAddress },
  });

  // 查询是否可以退款
  const { data: refundStatus } = useReadContract({
    address: logicAddress,
    abi: realEstateLogicAbi,
    functionName: 'canRefundShares',
    args: [propertyId, buyer as `0x${string}`, BigInt(purchaseIndex)],
    query: { enabled: !!logicAddress && !purchaseRecord.refunded },
  });

  // 解析退款状态 - canRefundShares 返回 [bool, string, uint256]
  const canRefundFromContract = refundStatus && Array.isArray(refundStatus) ? (refundStatus[0] as boolean) : false;
  const reason = refundStatus && Array.isArray(refundStatus) ? (refundStatus[1] as string) : undefined;
  const refundAmount = refundStatus && Array.isArray(refundStatus) ? (BigInt(refundStatus[2].toString())) : undefined;

  const now = BigInt(Math.floor(Date.now() / 1000));
  const purchaseDate = new Date(Number(purchaseRecord.purchaseTime) * 1000);
  const refundLockPeriod = property.refundLockPeriod || BigInt(365 * 24 * 60 * 60);
  const lockPeriodEnd = purchaseRecord.purchaseTime + refundLockPeriod;
  const daysRemaining = lockPeriodEnd > now ? Math.floor(Number(lockPeriodEnd - now) / (24 * 60 * 60)) : 0;
  const isProjectEnded = property.projectEndTime && property.projectEndTime > 0n && now >= property.projectEndTime;
  
  // 判断是否可以退款：合约返回 true 或项目已结束
  const canRefund = canRefundFromContract || isProjectEnded;

  if (purchaseRecord.refunded) {
    return (
      <div style={{
        padding: '12px',
        borderRadius: '8px',
        background: 'rgba(148, 163, 184, 0.1)',
        border: '1px solid #cbd5e1',
      }}>
        <div style={{ fontSize: '13px', color: '#64748b' }}>
          ✓ 已退款
        </div>
      </div>
    );
  }

  return (
    <div style={{
      padding: '12px',
      borderRadius: '8px',
      background: canRefund ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
      border: `1px solid ${canRefund ? '#10b981' : '#f59e0b'}`,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
        <div>
          <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>
            {canRefund ? '✓ 可申请退款' : '⏳ 退款锁定中'}
          </div>
          <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>
            购买时间: {purchaseDate.toLocaleString('zh-CN')}
          </div>
          <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>
            购买份额: {purchaseRecord.amount.toString()}
          </div>
          <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>
            可退金额: {(canRefund && refundAmount) ? formatEther(refundAmount) : formatEther(purchaseRecord.payAmount)} TUSDC
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          {canRefund ? (
            <button
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: 'none',
                background: '#10b981',
                color: '#fff',
                cursor: isWritePending || !!refundHash ? 'not-allowed' : 'pointer',
                fontSize: '13px',
                fontWeight: 500,
                opacity: isWritePending || !!refundHash ? 0.7 : 1,
              }}
              onClick={async () => {
                if (!logicAddress || !myTokenAddress || isWritePending || refundHash) return;

                const confirmRefund = window.confirm(
                  `确认申请退款？\n\n` +
                    `房产ID: ${propertyId}\n` +
                    `退款份额: ${purchaseRecord.amount.toString()}\n` +
                    `退款金额: ${formatEther(refundAmount || purchaseRecord.payAmount)} TUSDC\n\n` +
                    `退款后，对应的份额代币将被销毁，资金将返还到您的钱包。`
                );
                if (!confirmRefund) return;

                try {
                  // 1. 如果未授权，先授权 ERC1155 代币给合约
                  if (!isApproved) {
                    setRefundStatusMessage('授权代币中...');

                    // @ts-ignore - 避免深度类型推断问题
                    await writeContractAsync({
                      address: myTokenAddress as `0x${string}`,
                      abi: erc1155Abi as any,
                      functionName: 'setApprovalForAll',
                      args: [logicAddress as `0x${string}`, true],
                    } as any);

                    // 等待一下确保授权生效
                    await new Promise(resolve => setTimeout(resolve, 2000));
                  }

                  // 2. 调用退款函数
                  setRefundStatusMessage('提交退款交易中...');
                  // @ts-ignore - 避免深度类型推断问题
                  const hash = await writeContractAsync({
                    address: logicAddress as `0x${string}`,
                    abi: realEstateLogicAbi as any,
                    functionName: 'refundShares',
                    args: [propertyId, BigInt(purchaseIndex)],
                  } as any);

                  setRefundHash(hash);
                  setRefundStatusMessage(`退款交易已提交：${hash.slice(0, 10)}...`);
                } catch (err) {
                  console.error('退款失败:', err);
                  let errorMsg = '退款失败，请稍后重试。';
                  if (err instanceof Error) {
                    errorMsg = err.message;
                    // 提供更友好的错误提示
                    if (errorMsg.includes('insufficient shares')) {
                      errorMsg = '退款失败：您当前持有的份额不足，可能已经转出部分份额。请确保持有足够的份额后再申请退款。';
                    } else if (errorMsg.includes('refund conditions not met')) {
                      errorMsg = '退款失败：退款条件未满足。请确保项目已结束或购买后已满锁定期间。';
                    } else if (errorMsg.includes('invalid purchase index')) {
                      errorMsg = '退款失败：无效的购买记录索引。请刷新页面重试。';
                    } else if (errorMsg.includes('already refunded')) {
                      errorMsg = '退款失败：该购买记录已退款。';
                    } else if (errorMsg.includes('insufficient escrow')) {
                      errorMsg = '退款失败：托管池资金不足。请联系管理员。';
                    }
                  }
                  setRefundStatusMessage(errorMsg);
                  
                  // 10秒后清除错误消息（延长显示时间以便用户阅读）
                  setTimeout(() => {
                    setRefundStatusMessage(null);
                  }, 10000);
                }
              }}
              disabled={isWritePending || !!refundHash}
            >
              {refundHash ? '退款处理中...' : isWritePending ? '处理中...' : isProjectEnded ? '项目结束 - 申请退款' : '申请退款'}
            </button>
          ) : (
            <div style={{ fontSize: '12px', color: '#f59e0b' }}>
              {reason || `还需等待 ${daysRemaining} 天`}
            </div>
          )}
        </div>
      </div>
      {!canRefund && (
        <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '8px' }}>
          锁定期剩余: {daysRemaining} 天 ({new Date(Number(lockPeriodEnd) * 1000).toLocaleDateString('zh-CN')})
        </div>
      )}
      {isProjectEnded && (
        <div style={{ fontSize: '11px', color: '#10b981', marginTop: '8px' }}>
          ✓ 项目已结束，可立即申请退款
        </div>
      )}

      {/* 退款交易状态 */}
      {refundHash && (
        <RefundTransactionStatus
          propertyId={propertyId}
          purchaseIndex={purchaseIndex}
          hash={refundHash}
          onSuccess={() => {
            setRefundHash(null);
            setRefundStatusMessage(null);
            // 刷新页面数据（通过重新挂载组件或使用 refetch）
            window.location.reload();
          }}
        />
      )}

      {/* 退款状态消息 */}
      {refundStatusMessage && !refundHash && (
        <div style={{
          marginTop: '8px',
          padding: '8px 12px',
          borderRadius: '6px',
          background: 'rgba(239, 68, 68, 0.1)',
          color: '#dc2626',
          fontSize: '12px',
        }}>
          {refundStatusMessage}
        </div>
      )}
    </div>
  );
}

// 退款交易状态组件
function RefundTransactionStatus({
  propertyId,
  purchaseIndex,
  hash,
  onSuccess,
}: {
  propertyId: bigint;
  purchaseIndex: number;
  hash: `0x${string}`;
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
        marginTop: '8px',
        padding: '8px 12px',
        borderRadius: '6px',
        background: 'rgba(59, 130, 246, 0.1)',
        color: '#1d4ed8',
        fontSize: '12px',
      }}>
        退款确认中... 交易哈希: {hash.slice(0, 10)}...
      </div>
    );
  }

  if (isError) {
    return (
      <div style={{
        marginTop: '8px',
        padding: '8px 12px',
        borderRadius: '6px',
        background: 'rgba(239, 68, 68, 0.1)',
        color: '#dc2626',
        fontSize: '12px',
      }}>
        ✗ 退款交易失败: {hash.slice(0, 10)}... 请重试
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div style={{
        marginTop: '8px',
        padding: '8px 12px',
        borderRadius: '6px',
        background: 'rgba(16, 185, 129, 0.1)',
        color: '#059669',
        fontSize: '12px',
        fontWeight: 600,
      }}>
        ✓ 退款成功！份额已销毁，资金已返还。交易哈希: {hash.slice(0, 10)}...
      </div>
    );
  }

  return null;
}

export default function DistributionPage() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const addresses = useNetworkAddresses();
  const { writeContractAsync, isPending } = useWriteContract();

  // 获取所有房产（用于显示收益池）
  const { properties: allProperties, isLoading: isLoadingAllProperties } = useAllProperties();

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

  // 过滤索引：只保留已购买的房产索引（持有份额 > 0）
  // 发布者和管理员也需要持有份额才能看到收益信息
  const filteredIndexes = useMemo(() => {
    if (!address) return [] as number[];
    
    const indexes: number[] = [];

    allProperties.forEach((property, index) => {
      // 检查用户是否持有份额（无论是发布者、管理员还是普通用户，都需要持有份额）
      const balanceItem = userBalancesData?.[index];
      if (balanceItem?.status === 'success') {
        const balance = balanceItem.result as bigint | undefined;
        if (balance && balance > 0n) {
          indexes.push(index);
      }
      }
    });

    return indexes;
  }, [allProperties, address, userBalancesData]);

  // 根据过滤后的索引得到房产列表
  const filteredProperties = useMemo(() => {
    return filteredIndexes.map((i) => allProperties[i]);
  }, [allProperties, filteredIndexes]);

  // 收益管理相关状态
  const [yieldClaimHashes, setYieldClaimHashes] = useState<Record<number, `0x${string}` | null>>({});
  const [yieldStatus, setYieldStatus] = useState<Record<number, string | null>>({});

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

  // 查询已提取收益（当前用户）
  const claimedYieldQueries = useMemo(() => {
    if (!addresses?.realEstateLogic || filteredProperties.length === 0 || !address) return [];
    return filteredProperties.map((property) => ({
      address: addresses.realEstateLogic as `0x${string}`,
      abi: realEstateLogicAbi,
      functionName: 'claimedRewards' as const,
      args: [property.propertyId, address] as [bigint, `0x${string}`],
    }));
  }, [addresses?.realEstateLogic, filteredProperties, address]);

  const claimedYieldsQuery = useReadContracts({
    contracts: claimedYieldQueries,
    query: { enabled: claimedYieldQueries.length > 0 },
  });
  const claimedYieldsData = claimedYieldsQuery.data as any[] | undefined;


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
                  const isPublisher = property.publisher.toLowerCase() === address?.toLowerCase();
                  const originalIndex = filteredIndexes[index];
                  
                  // 获取收益池数据
                  const yieldPoolItem = yieldPoolsData?.[index];
                  const claimableYieldItem = claimableYieldsData?.[index];
                  const claimedYieldItem = claimedYieldsData?.[index];
                  const balanceItem = userBalancesData?.[originalIndex];

                  const yieldPool = yieldPoolItem?.status === 'success' ? (yieldPoolItem as any).result : undefined;
                  const claimableYield = claimableYieldItem?.status === 'success' ? (claimableYieldItem as any).result : undefined;
                  const claimedYield = claimedYieldItem?.status === 'success' ? (claimedYieldItem as any).result : undefined;
                  const userShares =
                    balanceItem?.status === 'success'
                      ? BigInt((balanceItem as any).result?.toString?.() ?? '0')
                      : BigInt(0);

                  const unitPrice = property.unitPriceWei || BigInt(0);
                  const annualYieldBps = property.annualYieldBps || BigInt(0);

                  // 预计年化收益 = 持有份额 × 单价 × 年化收益率
                  const estimatedAnnualYield =
                    userShares > 0n && unitPrice > 0n && annualYieldBps > 0n
                      ? (userShares * unitPrice * annualYieldBps) / BigInt(10000)
                      : BigInt(0);

                  // 收益池占比 = (持有份额 / 最大发行量) × 100%
                  const totalShares = property.maxSupply > 0n ? property.maxSupply : property.totalSupply;
                  const poolSharePercent =
                    totalShares > 0n && userShares > 0n
                      ? (Number(userShares) / Number(totalShares)) * 100
                      : 0;

                  // 累计应得收益 = 已提取 + 当前可提取
                  const totalEarnedYield =
                    (claimedYield ? BigInt(claimedYield.toString()) : BigInt(0)) +
                    (claimableYield ? BigInt(claimableYield.toString()) : BigInt(0));

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
                          {(() => {
                            // 计算收益锁定状态
                            const now = BigInt(Math.floor(Date.now() / 1000));
                            const createTime = property.createTime || BigInt(0);
                            const oneYearInSeconds = BigInt(365 * 24 * 60 * 60);
                            const lockEndTime = createTime + oneYearInSeconds;
                            const isProjectEnded = property.projectEndTime > 0n && now >= property.projectEndTime;
                            const oneYearPassed = createTime > 0n && now >= lockEndTime;
                            const isYieldLocked = !oneYearPassed && !isProjectEnded;
                            const daysRemaining = isYieldLocked && lockEndTime > now 
                              ? Math.floor(Number(lockEndTime - now) / (24 * 60 * 60)) 
                              : 0;

                            return (
                              <div
                                style={{
                                  padding: '20px',
                                  borderRadius: '12px',
                                  background: isYieldLocked
                                    ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
                                    : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                            color: '#fff',
                            marginBottom: '16px',
                                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                }}
                              >
                                <h5
                                  style={{
                                    margin: '0 0 16px',
                                    fontSize: '16px',
                                    fontWeight: 600,
                                    opacity: 0.95,
                                  }}
                                >
                                  💰 收益池信息
                            </h5>

                                {/* 主要指标 */}
                                <div
                                  style={{
                                    display: 'grid',
                                    gridTemplateColumns: '1fr 1fr',
                                    gap: '16px',
                                    marginBottom: '16px',
                                  }}
                                >
                                  <div
                                    style={{
                                      padding: '12px',
                                      borderRadius: '8px',
                                      background: 'rgba(255, 255, 255, 0.15)',
                                      backdropFilter: 'blur(10px)',
                                    }}
                                  >
                                    <div style={{ fontSize: '12px', opacity: 0.9, marginBottom: '6px' }}>
                                      收益池总额
                                    </div>
                                    <div style={{ fontSize: '20px', fontWeight: 700 }}>
                                  {yieldPool ? formatEther(yieldPool as bigint) : '0'} TUSDC
                                </div>
                              </div>
                                  <div
                                    style={{
                                      padding: '12px',
                                      borderRadius: '8px',
                                      background: 'rgba(255, 255, 255, 0.15)',
                                      backdropFilter: 'blur(10px)',
                                    }}
                                  >
                                    <div style={{ fontSize: '12px', opacity: 0.9, marginBottom: '6px' }}>
                                      你可提取
                                    </div>
                                    <div style={{ fontSize: '20px', fontWeight: 700 }}>
                                  {claimableYield ? formatEther(claimableYield as bigint) : '0'} TUSDC
                                </div>
                              </div>
                            </div>

                                {/* 详细指标 */}
                                <div
                                style={{
                                    padding: '12px',
                                  borderRadius: '8px',
                                    background: 'rgba(255, 255, 255, 0.1)',
                                    marginBottom: '16px',
                                  }}
                                >
                                  <div
                                    style={{
                                      display: 'grid',
                                      gridTemplateColumns: 'repeat(3, 1fr)',
                                      gap: '12px',
                                  fontSize: '13px',
                                    }}
                                  >
                                    <div>
                                      <div style={{ opacity: 0.85, marginBottom: '4px', fontSize: '11px' }}>
                                        持有份额
                                      </div>
                                      <div style={{ fontSize: '16px', fontWeight: 600 }}>
                                        {userShares.toString()} 份
                                      </div>
                                    </div>
                                    <div>
                                      <div style={{ opacity: 0.85, marginBottom: '4px', fontSize: '11px' }}>
                                        预计年化收益
                                      </div>
                                      <div style={{ fontSize: '16px', fontWeight: 600 }}>
                                        {estimatedAnnualYield > 0n ? formatEther(estimatedAnnualYield) : '0'} TUSDC
                                      </div>
                                    </div>
                                    <div>
                                      <div style={{ opacity: 0.85, marginBottom: '4px', fontSize: '11px' }}>
                                        收益池占比
                                      </div>
                                      <div style={{ fontSize: '16px', fontWeight: 600 }}>
                                        {poolSharePercent > 0 ? `${poolSharePercent.toFixed(2)}%` : '0%'}
                                      </div>
                          </div>
                        </div>
                      </div>

                                {/* 额外信息 */}
                                <div
                              style={{
                                    padding: '12px',
                                borderRadius: '8px',
                                    background: 'rgba(255, 255, 255, 0.1)',
                                    marginBottom: '16px',
                                    fontSize: '12px',
                                  }}
                                >
                                  <div
                                    style={{
                                      display: 'grid',
                                      gridTemplateColumns: 'repeat(2, 1fr)',
                                      gap: '12px',
                                      marginBottom: '8px',
                              }}
                            >
                                    <div>
                                      <div style={{ opacity: 0.85, marginBottom: '4px', fontSize: '11px' }}>
                                        年化收益率
                          </div>
                                      <div style={{ fontSize: '15px', fontWeight: 600 }}>
                                        {annualYieldBps > 0n
                                          ? `${(Number(annualYieldBps) / 100).toFixed(2)}%`
                                          : '未设置'}
                                      </div>
                                    </div>
                                    <div>
                                      <div style={{ opacity: 0.85, marginBottom: '4px', fontSize: '11px' }}>
                                        已提取收益
                                      </div>
                                      <div style={{ fontSize: '15px', fontWeight: 600 }}>
                                        {claimedYield ? formatEther(BigInt(claimedYield.toString())) : '0'} TUSDC
                                      </div>
                                    </div>
                                  </div>
                                  <div
                                    style={{
                                      marginTop: '8px',
                                      paddingTop: '8px',
                                      borderTop: '1px solid rgba(255,255,255,0.2)',
                                    }}
                                  >
                                    <div
                              style={{
                                display: 'flex',
                                        justifyContent: 'space-between',
                                        marginBottom: '4px',
                              }}
                            >
                                      <span>总发行量:</span>
                                      <span style={{ fontWeight: 600 }}>
                                        {property.totalSupply.toString()} /{' '}
                                        {property.maxSupply > 0n ? property.maxSupply.toString() : '∞'} 份
                                      </span>
                                    </div>
                                    {totalEarnedYield > 0n && (
                                      <div
                                        style={{
                                          display: 'flex',
                                          justifyContent: 'space-between',
                                          marginTop: '4px',
                                        }}
                                      >
                                        <span>累计应得收益:</span>
                                        <span style={{ fontWeight: 600 }}>
                                          {formatEther(totalEarnedYield)} TUSDC
                                        </span>
                                      </div>
                                      )}
                                    </div>
                                      </div>

                                {/* 收益锁定提示 */}
                                {isYieldLocked && (
                                  <div
                                          style={{
                                      marginTop: '12px',
                                      padding: '12px',
                                      borderRadius: '8px',
                                      background: 'rgba(255, 255, 255, 0.2)',
                                            fontSize: '12px',
                                      lineHeight: 1.6,
                                          }}
                                        >
                                    <div
                                          style={{
                                        fontWeight: 600,
                                        marginBottom: '6px',
                                        fontSize: '13px',
                                      }}
                                    >
                                      ⏳ 收益已锁定
                                    </div>
                                    <div style={{ opacity: 0.95 }}>
                                      {isProjectEnded
                                        ? '项目已结束，可立即提取'
                                        : daysRemaining > 0
                                        ? `还需等待 ${daysRemaining} 天才能提取收益（或等待项目结束）`
                                        : '收益将在项目创建后一年解锁'}
                                    </div>
                                    {lockEndTime > now && (
                                      <div
                                        style={{
                                          marginTop: '8px',
                                          opacity: 0.85,
                                          fontSize: '11px',
                                          }}
                                        >
                                        解锁时间:{' '}
                                        {new Date(Number(lockEndTime) * 1000).toLocaleString('zh-CN')}
                                      </div>
                                      )}
                                  </div>
                                )}

                                {/* 解锁提示 */}
                                {!isYieldLocked && (oneYearPassed || isProjectEnded) && (
                                  <div
                                          style={{
                                      marginTop: '12px',
                                      padding: '10px',
                                      borderRadius: '8px',
                                      background: 'rgba(16, 185, 129, 0.3)',
                                            fontSize: '12px',
                                      textAlign: 'center',
                                            fontWeight: 500,
                                          }}
                                        >
                                    ✓ 收益已解锁，可以提取
                                    {oneYearPassed && (
                                      <div
                                        style={{
                                          fontSize: '11px',
                                          opacity: 0.9,
                                          marginTop: '4px',
                                        }}
                                      >
                                        （项目创建已满一年）
                                      </div>
                                    )}
                                    {isProjectEnded && !oneYearPassed && (
                                      <div
                                          style={{
                                          fontSize: '11px',
                                          opacity: 0.9,
                                          marginTop: '4px',
                                          }}
                                        >
                                        （项目已结束）
                                    </div>
                                    )}
                                  </div>
                                )}

                                {/* 提取按钮 */}
                                {claimableYield && claimableYield > 0n && (
                                  <button
                                    onClick={() => handleClaimYield(property.propertyId)}
                                    disabled={isPending || isYieldLocked}
                                  style={{
                                      marginTop: '16px',
                                      padding: '12px 24px',
                                    borderRadius: '8px',
                                      border: 'none',
                                      background: isYieldLocked
                                        ? 'rgba(255, 255, 255, 0.15)'
                                        : 'rgba(255, 255, 255, 0.25)',
                                      color: '#fff',
                                      cursor:
                                        isPending || isYieldLocked ? 'not-allowed' : 'pointer',
                                    fontSize: '14px',
                                      fontWeight: 600,
                                      width: '100%',
                                      opacity: isPending || isYieldLocked ? 0.6 : 1,
                                      transition: 'all 0.2s',
                                    }}
                                    title={
                                      isYieldLocked
                                        ? `收益已锁定，还需等待 ${daysRemaining} 天或项目结束`
                                        : ''
                                    }
                                  >
                                    {isPending
                                      ? '⏳ 提取中...'
                                      : isYieldLocked
                                      ? '🔒 收益已锁定'
                                      : '💰 提取收益'}
                                  </button>
                                )}
                              </div>
                            );
                          })()}
                        </div>
                              </div>

                      {/* 提取收益交易状态 */}
                      {yieldClaimHashes[propertyIdNum] && (
                        <div style={{ marginTop: '12px' }}>
                                <YieldTransactionStatus
                                  propertyId={propertyIdNum}
                            hash={yieldClaimHashes[propertyIdNum]!}
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

                      {/* 退款功能 - 对所有持有份额的用户显示（包括发布者和管理员） */}
                      {address && (
                        <RefundSection
                          propertyId={property.propertyId}
                          property={property}
                          buyer={address}
                          logicAddress={addresses?.realEstateLogic}
                        />
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

// 退款功能组件
function RefundSection({
  propertyId,
  property,
  buyer,
  logicAddress,
}: {
  propertyId: bigint;
  property: any;
  buyer: string;
  logicAddress: `0x${string}` | undefined;
}) {
  const [refundExpanded, setRefundExpanded] = useState(false);
  const { purchaseRecords } = usePurchaseRecords(propertyId, buyer, logicAddress);

  if (!logicAddress) return null;

  // 检查用户是否有购买记录
  const hasRecords = purchaseRecords.length > 0;
  const activeRecords = purchaseRecords.filter(r => !r.refunded);
  const refundedRecords = purchaseRecords.filter(r => r.refunded);

  return (
                        <div style={{
                          marginTop: '16px',
                          paddingTop: '16px',
                          borderTop: '1px solid #e2e8f0',
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>退款管理</h4>
        {hasRecords && (
                              <button
            onClick={() => setRefundExpanded(!refundExpanded)}
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
            {refundExpanded ? '收起' : `展开 (${activeRecords.length} 条可退款)`}
                              </button>
        )}
                          </div>

      {!hasRecords ? (
                            <div style={{
                              padding: '12px',
                              borderRadius: '8px',
          background: 'rgba(148, 163, 184, 0.1)',
          color: '#64748b',
                              fontSize: '14px',
                            }}>
          您还没有购买过该房产的份额，或所有购买记录已退款。
                            </div>
      ) : (
        <>
          {/* 统计信息 */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
                                gap: '12px',
            marginBottom: '12px',
          }}>
                                  <div style={{
                                    padding: '12px',
                                    borderRadius: '8px',
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid #10b981',
                                  }}>
              <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>可退款记录</div>
              <div style={{ fontSize: '18px', fontWeight: 600, color: '#059669' }}>
                {activeRecords.length}
                        </div>
                                    </div>
            <div style={{
              padding: '12px',
              borderRadius: '8px',
              background: 'rgba(148, 163, 184, 0.1)',
              border: '1px solid #cbd5e1',
            }}>
              <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>已退款记录</div>
              <div style={{ fontSize: '18px', fontWeight: 600, color: '#64748b' }}>
                {refundedRecords.length}
                                      </div>
                                    </div>
                                  </div>

          {/* 购买记录列表 */}
          {refundExpanded && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {purchaseRecords.map((record, index) => (
                <RefundStatus
                  key={index}
                  propertyId={propertyId}
                  purchaseIndex={index}
                  purchaseRecord={record}
                  property={property}
                  buyer={buyer}
                  logicAddress={logicAddress}
                                />
              ))}

              {purchaseRecords.length === 0 && (
                                <div style={{
                                  padding: '12px',
                                  borderRadius: '8px',
                  background: 'rgba(148, 163, 184, 0.1)',
                  color: '#64748b',
                                  fontSize: '14px',
                  textAlign: 'center',
                                }}>
                  暂无购买记录
                        </div>
                      )}
              </div>
            )}

          {/* 提示信息 */}
                            <div style={{
            marginTop: '12px',
                              padding: '12px',
                              borderRadius: '8px',
            background: 'rgba(59, 130, 246, 0.1)',
            border: '1px solid #3b82f6',
          }}>
            <div style={{ fontSize: '12px', color: '#1e40af', lineHeight: 1.6 }}>
              <strong>退款说明：</strong>
              <br />
              • 购买后满 {property.refundLockPeriod ? Math.floor(Number(property.refundLockPeriod) / (24 * 60 * 60)) : 365} 天可申请退款
              <br />
              • 项目结束后可立即申请退款
              <br />
              • 退款将销毁对应的份额代币并返还购买金额
              <br />
              {property.projectEndTime > 0n && (
                <>
                  • 项目结束时间: {new Date(Number(property.projectEndTime) * 1000).toLocaleString('zh-CN')}
          </>
        )}
      </div>
      </div>
    </>
        )}
      </div>
  );
}
