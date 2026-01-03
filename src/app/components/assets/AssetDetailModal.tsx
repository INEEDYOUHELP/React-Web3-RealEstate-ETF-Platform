import { useEffect, useMemo, useState } from 'react';
import { useAccount, useChainId, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { formatEther } from 'viem';
import Modal from '../common/Modal';
import { Asset } from '../../../types';
import { contracts } from '../../../contracts/addresses';
import { erc20Abi, realEstateLogicAbi, realEstateStorageAbi } from '../../../contracts/abis';

interface Props {
  asset?: Asset | null;
  open: boolean;
  mode?: 'view' | 'invest';
  onClose: () => void;
}

export default function AssetDetailModal({ asset, open, mode = 'view', onClose }: Props) {
  if (!asset) return null;

  const { address } = useAccount();
  const chainId = useChainId();
  const { writeContractAsync, isPending } = useWriteContract();
  const [buyAmount, setBuyAmount] = useState<string>('');
  const [txHash, setTxHash] = useState<`0x${string}` | null>(null);
  const [txStatus, setTxStatus] = useState<string | null>(null);

  const { isLoading: isConfirming, isSuccess: isBuySuccess, isError: isBuyError } =
    useWaitForTransactionReceipt({
      hash: txHash,
      query: {
        enabled: !!txHash,
      },
    });

  const networkKey = useMemo(() => {
    if (!chainId) return undefined;
    if (chainId === 31337 || chainId === 1337) return 'localhost' as const;
    return undefined;
  }, [chainId]);

  const logicAddress = networkKey ? contracts[networkKey]?.realEstateLogic : undefined;
  const storageAddress = networkKey ? contracts[networkKey]?.realEstateStorage : undefined;

  const isChainAsset = asset.tags?.includes('链上资产') && asset.id >= 10000;
  const propertyId = useMemo(
    () => (isChainAsset ? BigInt(asset.id - 10000) : undefined),
    [isChainAsset, asset.id]
  );

  // 读取当前收益代币地址（例如 TUSDC）
  const { data: rewardTokenAddress } = useReadContract({
    address: logicAddress,
    abi: realEstateLogicAbi,
    functionName: 'rewardToken',
    query: {
      enabled: !!logicAddress,
    },
  });

  // 读取房产信息以获取链上单价 unitPriceWei
  const { data: propertyData } = useReadContract({
    address: storageAddress,
    abi: realEstateStorageAbi,
    functionName: 'getProperty',
    args: propertyId !== undefined ? [propertyId] : undefined,
    query: {
      enabled: !!storageAddress && propertyId !== undefined,
    },
  });

  const unitPriceWei: bigint | undefined = (propertyData as any)?.unitPriceWei;

  const unitPriceFormatted =
    unitPriceWei && unitPriceWei > 0n ? Number(formatEther(unitPriceWei)) : undefined;

  const buyAmountBigInt = (() => {
    try {
      if (!buyAmount) return 0n;
      const n = BigInt(buyAmount);
      return n > 0n ? n : 0n;
    } catch {
      return 0n;
    }
  })();

  const payAmountWei =
    unitPriceWei && unitPriceWei > 0n && buyAmountBigInt > 0n
      ? unitPriceWei * buyAmountBigInt
      : 0n;

  const payAmountFormatted =
    payAmountWei > 0n ? Number(formatEther(payAmountWei)) : undefined;

  useEffect(() => {
    if (isBuySuccess) {
      setTxStatus('购买成功！');
    } else if (isBuyError) {
      setTxStatus('交易失败，请重试。');
    }
  }, [isBuySuccess, isBuyError]);

  // 如果是“立即投资”打开的弹窗，可以适当预填一个默认份额，方便快速下单
  useEffect(() => {
    if (open && mode === 'invest' && !buyAmount) {
      setBuyAmount('100');
    }
  }, [open, mode, buyAmount]);

  const canBuy =
    !!address &&
    !!logicAddress &&
    !!rewardTokenAddress &&
    isChainAsset &&
    propertyId !== undefined &&
    unitPriceWei &&
    unitPriceWei > 0n &&
    buyAmountBigInt > 0n;

  const handleBuy = async () => {
    if (!canBuy || !logicAddress || !rewardTokenAddress || propertyId === undefined) return;
    try {
      setTxStatus('授权中...');

      // 1. 授权 rewardToken 给 RealEstateLogic 合约
      await writeContractAsync({
        address: rewardTokenAddress as `0x${string}`,
        abi: erc20Abi,
        functionName: 'approve',
        args: [logicAddress as `0x${string}`, payAmountWei],
      });

      // 2. 调用 buyShares 购买份额（buyer -> publisher）
      setTxStatus('购买中...');
      const hash = await writeContractAsync({
        address: logicAddress as `0x${string}`,
        abi: realEstateLogicAbi,
        functionName: 'buyShares',
        args: [propertyId as bigint, buyAmountBigInt],
      });

      setTxHash(hash);
      setTxStatus(`交易已提交：${hash.slice(0, 10)}...`);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : '购买失败，请检查余额和授权额度。';
      setTxStatus(msg);
      console.error('购买份额失败:', err);
    }
  };

  const soldRatio =
    asset.totalUnits && asset.totalUnits > 0
      ? Math.min(1, asset.soldUnits / asset.totalUnits)
      : 0;

  return (
    <Modal open={open} title={asset.name} onClose={onClose}>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '24px',
          alignItems: 'stretch',
        }}
      >
        {/* 左侧：图片 + 基本信息 */}
        <div>
          <div
            style={{
              borderRadius: '16px',
              overflow: 'hidden',
              border: '1px solid #e2e8f0',
              marginBottom: '16px',
              background:
                'linear-gradient(135deg, rgba(59,130,246,0.08), rgba(79,70,229,0.08))',
            }}
          >
            {asset.image ? (
              <img
                src={asset.image}
                alt={asset.name}
                style={{
                  width: '100%',
                  height: '220px',
                  objectFit: 'cover',
                  display: 'block',
                }}
              />
            ) : (
              <div
                style={{
                  height: '220px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#94a3b8',
                  fontSize: '14px',
                }}
              >
                暂无图片
              </div>
            )}
          </div>

          <div style={{ marginBottom: '12px' }}>
            <p
              style={{
                margin: 0,
                fontSize: '13px',
                color: '#64748b',
              }}
            >
              {asset.region} · {asset.type} · {asset.location}
            </p>
          </div>

          {/* Tag 标签 */}
          {asset.tags && asset.tags.length > 0 && (
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '8px',
                marginBottom: '16px',
              }}
            >
              {asset.tags.map((tag) => (
                <span
                  key={tag}
                  style={{
                    fontSize: '11px',
                    padding: '4px 10px',
                    borderRadius: '999px',
                    background: 'rgba(59,130,246,0.08)',
                    color: '#1d4ed8',
                    border: '1px solid rgba(59,130,246,0.25)',
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* 关键指标卡片 */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
              gap: '12px',
            }}
          >
            <div
              style={{
                padding: '12px',
                borderRadius: '12px',
                background:
                  'linear-gradient(135deg, rgba(59,130,246,0.06), rgba(79,70,229,0.06))',
                border: '1px solid #e0e7ff',
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span
                  style={{
                    fontSize: '11px',
                    color: '#64748b',
                    marginBottom: '4px',
                  }}
                >
                  资产市值
                </span>
                <span
                  style={{
                    fontSize: '18px',
                    fontWeight: 700,
                    color: '#111827',
                    wordBreak: 'break-all',
                  }}
                >
                  ${asset.price.toLocaleString()}
                </span>
              </div>
            </div>

            <div
              style={{
                padding: '12px',
                borderRadius: '12px',
                background: 'rgba(16,185,129,0.06)',
                border: '1px solid rgba(16,185,129,0.25)',
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span
                  style={{
                    fontSize: '11px',
                    color: '#64748b',
                    marginBottom: '4px',
                  }}
                >
                  目标年化收益
                </span>
                <span
                  style={{
                    fontSize: '18px',
                    fontWeight: 700,
                    color: '#059669',
                    wordBreak: 'break-all',
                  }}
                >
                  {asset.yield.toFixed(2)}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 右侧：详细信息 */}
        <div>
          <h3
            style={{
              margin: 0,
              marginBottom: '8px',
              fontSize: '20px',
              fontWeight: 600,
              color: '#0f172a',
            }}
          >
            项目概览
          </h3>
          <p
            style={{
              margin: 0,
              marginBottom: '16px',
              color: '#475569',
              fontSize: '14px',
              lineHeight: 1.6,
            }}
          >
            {asset.description || '暂无详细描述。'}
          </p>

          {/* 数字详情网格 */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
              gap: '12px',
              marginBottom: '16px',
            }}
          >
            <div>
              <div
                style={{
                  fontSize: '11px',
                  color: '#94a3b8',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  marginBottom: '4px',
                }}
              >
                最小投资
              </div>
              <div
                style={{ fontSize: '16px', fontWeight: 600, color: '#0f172a' }}
              >
                ${asset.minInvestment.toLocaleString()}
              </div>
            </div>

            <div>
              <div
                style={{
                  fontSize: '11px',
                  color: '#94a3b8',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  marginBottom: '4px',
                }}
              >
                总份额
              </div>
              <div
                style={{ fontSize: '16px', fontWeight: 600, color: '#0f172a' }}
              >
                {asset.totalUnits.toLocaleString()}
              </div>
            </div>

            <div>
              <div
                style={{
                  fontSize: '11px',
                  color: '#94a3b8',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  marginBottom: '4px',
                }}
              >
                已售份额
              </div>
              <div
                style={{ fontSize: '16px', fontWeight: 600, color: '#0f172a' }}
              >
                {asset.soldUnits.toLocaleString()}
              </div>
            </div>
          </div>

          {/* 销售进度条 */}
          <div style={{ marginBottom: '20px' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '6px',
                fontSize: '12px',
                color: '#64748b',
              }}
            >
              <span>销售进度</span>
              <span>
                {asset.soldUnits}/{asset.totalUnits}{' '}
                ({(soldRatio * 100).toFixed(1)}%)
              </span>
            </div>
            <div
              style={{
                width: '100%',
                height: '8px',
                borderRadius: '999px',
                background: '#e2e8f0',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${soldRatio * 100}%`,
                  height: '100%',
                  borderRadius: '999px',
                  background:
                    'linear-gradient(90deg, #4f46e5 0%, #0ea5e9 50%, #22c55e 100%)',
                  transition: 'width 200ms ease-out',
                }}
              />
            </div>
          </div>

          {/* 购买区域仅在 invest 模式下显示 */}
          {mode === 'invest' && (
            <>
              {/* 购买输入与信息 */}
              <div
                style={{
                  padding: '14px 12px',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                  background: '#f8fafc',
                  marginBottom: '16px',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                  }}
                >
                  <div
                    style={{
                      fontSize: '13px',
                      color: '#0f172a',
                      fontWeight: 500,
                    }}
                  >
                    投资该资产
                  </div>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 3fr)',
                      gap: '10px',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <label
                        style={{
                          display: 'block',
                          marginBottom: '4px',
                          fontSize: '12px',
                          color: '#64748b',
                        }}
                      >
                        购买份额数量 *
                      </label>
                      <input
                        type="number"
                        min={1}
                        value={buyAmount}
                        onChange={(e) => setBuyAmount(e.target.value)}
                        placeholder="如：100"
                        style={{
                          width: '100%',
                          padding: '8px 10px',
                          borderRadius: '8px',
                          border: '1px solid #cbd5e1',
                          fontSize: '14px',
                        }}
                      />
                      {asset.totalUnits > 0 && (
                        <small
                          style={{
                            display: 'block',
                            marginTop: '4px',
                            fontSize: '11px',
                            color: '#94a3b8',
                          }}
                        >
                          可购买上限（理论）：{asset.totalUnits - asset.soldUnits} 份
                        </small>
                      )}
                    </div>

                    <div
                      style={{
                        fontSize: '12px',
                        color: '#64748b',
                        lineHeight: 1.6,
                      }}
                    >
                      {unitPriceFormatted !== undefined ? (
                        <>
                          <div>
                            单价（链上）：
                            <strong>{unitPriceFormatted.toFixed(4)} TUSDC</strong>
                          </div>
                          <div>
                            {payAmountFormatted !== undefined
                              ? `需支付约：${payAmountFormatted.toFixed(4)} TUSDC`
                              : '请输入购买份额数量'}
                          </div>
                        </>
                      ) : (
                        <div>发布者尚未设置链上单价，暂时无法购买。</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* 操作按钮（含立即投资） */}
              <div
                style={{
                  display: 'flex',
                  gap: '12px',
                  marginTop: '8px',
                  flexWrap: 'wrap',
                }}
              >
                <button
                  type="button"
                  style={{
                    flex: 1,
                    minWidth: '160px',
                    padding: '10px 16px',
                    borderRadius: '999px',
                    border: 'none',
                    background:
                      'linear-gradient(135deg, #4f46e5 0%, #6366f1 50%, #0ea5e9 100%)',
                    color: '#fff',
                    fontSize: '14px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    boxShadow:
                      '0 10px 15px -3px rgba(15,23,42,0.2), 0 4px 6px -4px rgba(15,23,42,0.1)',
                  }}
                  onClick={handleBuy}
                  disabled={!canBuy || isPending || isConfirming}
                >
                  {isPending || isConfirming
                    ? '处理中...'
                    : isBuySuccess
                    ? '购买成功'
                    : '立即投资'}
                </button>
                <button
                  type="button"
                  style={{
                    padding: '10px 16px',
                    borderRadius: '999px',
                    border: '1px solid #cbd5e1',
                    background: '#fff',
                    color: '#0f172a',
                    fontSize: '14px',
                    fontWeight: 500,
                    cursor: 'pointer',
                  }}
                  onClick={onClose}
                >
                  关闭
                </button>
              </div>

              {txStatus && (
                <div
                  style={{
                    marginTop: '10px',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    background: 'rgba(37, 99, 235, 0.06)',
                    color: '#1d4ed8',
                  }}
                >
                  {txStatus}
                </div>
              )}
            </>
          )}

          {/* 仅查看模式下的关闭按钮 */}
          {mode === 'view' && (
            <div
              style={{
                marginTop: '8px',
                display: 'flex',
                justifyContent: 'flex-end',
              }}
            >
              <button
                type="button"
                style={{
                  padding: '10px 16px',
                  borderRadius: '999px',
                  border: '1px solid #cbd5e1',
                  background: '#fff',
                  color: '#0f172a',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
                onClick={onClose}
              >
                关闭
              </button>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}

