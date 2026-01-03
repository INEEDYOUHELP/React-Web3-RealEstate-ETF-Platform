'use client';

import { useMemo, useState, useEffect } from 'react';
import { useAccount, useChainId, useReadContract, useReadContracts, useWriteContract } from 'wagmi';
import { keccak256, toBytes, isAddress } from 'viem';
import Breadcrumb from '../components/layout/Breadcrumb';
import { contracts, SupportedNetwork } from '../../contracts/addresses';
import { myTokenAbi, realEstateLogicAbi } from '../../contracts/abis';

function useNetworkAddresses() {
  const chainId = useChainId();

  // 目前前端只配置了 localhost：
  // - Hardhat / Anvil 常见 Chain ID：31337 / 1337
  // 如果未来添加 sepolia/mainnet，可在这里继续扩展
  let key: SupportedNetwork | undefined;
  if (chainId === 31337 || chainId === 1337) {
    key = 'localhost';
  } else {
    key = undefined;
  }
  return key ? contracts[key] : undefined;
}

export default function RolesCenterPage() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const addresses = useNetworkAddresses();
  const { writeContractAsync, isPending } = useWriteContract();
  const [publisherToAdd, setPublisherToAdd] = useState('');
  const [txStatus, setTxStatus] = useState<string | null>(null);
  
  // 申请审核相关状态
  const [pendingApplications, setPendingApplications] = useState<any[]>([]);
  const [isLoadingApplications, setIsLoadingApplications] = useState(false);
  const [reviewStatus, setReviewStatus] = useState<Record<string, string>>({});

  // DEFAULT_ADMIN_ROLE 在 OpenZeppelin 中固定为 0x00，不是 keccak256("DEFAULT_ADMIN_ROLE")
  const ZERO_ROLE =
    '0x0000000000000000000000000000000000000000000000000000000000000000' as const;

  const roleIds = useMemo(() => ({
    defaultAdmin: ZERO_ROLE,
    pauser: keccak256(toBytes('PAUSER_ROLE')),
    minter: keccak256(toBytes('MINTER_ROLE')),
    uriSetter: keccak256(toBytes('URI_SETTER_ROLE')),
    logicAdmin: keccak256(toBytes('ADMIN_ROLE')),
    publisher: keccak256(toBytes('PUBLISHER_ROLE')),
  }), []);

  const enabled = isConnected && !!addresses && !!address;

  const { data: isTokenAdmin } = useReadContract({
    address: addresses?.myToken,
    abi: myTokenAbi,
    functionName: 'hasRole',
    args: [roleIds.defaultAdmin, address ?? '0x0000000000000000000000000000000000000000'],
    query: { enabled },
  });

  const { data: isTokenPauser } = useReadContract({
    address: addresses?.myToken,
    abi: myTokenAbi,
    functionName: 'hasRole',
    args: [roleIds.pauser, address ?? '0x0000000000000000000000000000000000000000'],
    query: { enabled },
  });

  const { data: isTokenMinter } = useReadContract({
    address: addresses?.myToken,
    abi: myTokenAbi,
    functionName: 'hasRole',
    args: [roleIds.minter, address ?? '0x0000000000000000000000000000000000000000'],
    query: { enabled },
  });

  const { data: isTokenUriSetter } = useReadContract({
    address: addresses?.myToken,
    abi: myTokenAbi,
    functionName: 'hasRole',
    args: [roleIds.uriSetter, address ?? '0x0000000000000000000000000000000000000000'],
    query: { enabled },
  });

  // Logic 合约的默认管理员（DEFAULT_ADMIN_ROLE），也是一种管理员身份
  const { data: isLogicDefaultAdmin } = useReadContract({
    address: addresses?.realEstateLogic,
    abi: realEstateLogicAbi,
    functionName: 'hasRole',
    args: [roleIds.defaultAdmin, address ?? '0x0000000000000000000000000000000000000000'],
    query: { enabled },
  });

  const { data: isLogicAdmin } = useReadContract({
    address: addresses?.realEstateLogic,
    abi: realEstateLogicAbi,
    functionName: 'hasRole',
    args: [roleIds.logicAdmin, address ?? '0x0000000000000000000000000000000000000000'],
    query: { enabled },
  });

  const { data: isPublisher } = useReadContract({
    address: addresses?.realEstateLogic,
    abi: realEstateLogicAbi,
    functionName: 'hasRole',
    args: [roleIds.publisher, address ?? '0x0000000000000000000000000000000000000000'],
    query: { enabled },
  });

  // 只要是 DEFAULT_ADMIN_ROLE 或 ADMIN_ROLE 之一，就认为是“管理员”
  const isLogicAdminEffective = !!isLogicAdmin || !!isLogicDefaultAdmin;

  const handleAddPublisher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addresses || !publisherToAdd) return;
    if (!publisherToAdd.startsWith('0x') || publisherToAdd.length !== 42) {
      setTxStatus('请输入合法的钱包地址');
      return;
    }
    try {
      setTxStatus('提交交易中...');
      const hash = await writeContractAsync({
        address: addresses.realEstateLogic,
        abi: realEstateLogicAbi,
        functionName: 'addPublisher',
        args: [publisherToAdd as `0x${string}`],
      });
      setTxStatus(`交易已提交：${hash}`);
      setPublisherToAdd('');
    } catch (err) {
      setTxStatus(err instanceof Error ? err.message : '交易提交失败');
    }
  };

  // 获取待审核申请
  useEffect(() => {
    if (isLogicAdminEffective && addresses) {
      fetchPendingApplications();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLogicAdminEffective, addresses]);

  const fetchPendingApplications = async () => {
    setIsLoadingApplications(true);
    try {
      // 从数据库获取待审核申请
      const response = await fetch('/api/kyc/applications?status=pending');
      const data = await response.json();
      setPendingApplications(data.applications || []);
    } catch (error) {
      console.error('Failed to fetch applications:', error);
      setPendingApplications([]);
    } finally {
      setIsLoadingApplications(false);
    }
  };

  // 处理审核申请
  const handleReviewApplication = async (applicantAddress: string, approved: boolean, rejectionReason?: string) => {
    if (!addresses || !address) {
      setReviewStatus(prev => ({ ...prev, [applicantAddress]: '请先连接钱包' }));
      return;
    }

    // 检查管理员权限
    if (!isLogicAdminEffective) {
      setReviewStatus(prev => ({ ...prev, [applicantAddress]: '错误: 您没有管理员权限' }));
      return;
    }

    setReviewStatus(prev => ({ ...prev, [applicantAddress]: '检查申请状态...' }));

    try {
      setReviewStatus(prev => ({ ...prev, [applicantAddress]: '提交链上交易...' }));

      // 1. 调用链上合约审核
      const hash = await writeContractAsync({
        address: addresses.realEstateLogic,
        abi: realEstateLogicAbi,
        functionName: 'reviewPublisherApplication',
        args: [applicantAddress as `0x${string}`, approved],
      });

      setReviewStatus(prev => ({ ...prev, [applicantAddress]: `交易已提交，等待确认... ${hash.slice(0, 10)}...` }));

      // 2. 更新数据库状态
      try {
        await fetch(`/api/kyc/applications/${applicantAddress}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: approved ? 'approved' : 'rejected',
            reviewerAddress: address,
            rejectionReason: rejectionReason || null,
          }),
        });
      } catch (dbError) {
        console.error('Failed to update database:', dbError);
        // 数据库更新失败不影响链上操作，只记录错误
      }

      setReviewStatus(prev => ({ ...prev, [applicantAddress]: approved ? '✅ 已通过' : '❌ 已拒绝' }));
      
      // 刷新列表
      setTimeout(() => {
        fetchPendingApplications();
        setReviewStatus(prev => {
          const newStatus = { ...prev };
          delete newStatus[applicantAddress];
          return newStatus;
        });
      }, 2000);
    } catch (error: any) {
      console.error('Review failed:', error);
      
      // 解析错误信息
      let errorMsg = '审核失败';
      if (error instanceof Error) {
        errorMsg = error.message;
        
        // 检查是否是合约 revert 错误
        if (errorMsg.includes('reverted') || errorMsg.includes('JSON-RPC')) {
          if (errorMsg.includes('AccessControl') || errorMsg.includes('role')) {
            errorMsg = '权限不足：您没有管理员权限（ADMIN_ROLE）';
          } else if (errorMsg.includes('invalid application status')) {
            errorMsg = '申请状态无效：申请可能已被处理或不存在';
          } else if (errorMsg.includes('application not found')) {
            errorMsg = '申请不存在：链上未找到该申请';
          } else {
            errorMsg = '合约执行失败，可能原因：1) 权限不足 2) 申请状态不正确 3) 申请不存在';
          }
        } else if (errorMsg.includes('User rejected')) {
          errorMsg = '交易被用户取消';
        } else if (errorMsg.includes('insufficient funds')) {
          errorMsg = 'Gas 不足，请确保账户有足够的 ETH';
        }
      }
      
      setReviewStatus(prev => ({ ...prev, [applicantAddress]: `错误: ${errorMsg}` }));
    }
  };


  const renderBadge = (label: string, active?: boolean) => (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '6px 10px',
        borderRadius: '8px',
        fontSize: '13px',
        color: active ? '#166534' : '#991b1b',
        background: active ? 'rgba(22, 101, 52, 0.12)' : 'rgba(153, 27, 27, 0.12)',
        border: active ? '1px solid rgba(22, 101, 52, 0.4)' : '1px solid rgba(153, 27, 27, 0.4)',
      }}
    >
      <i className={`fas ${active ? 'fa-check-circle' : 'fa-times-circle'}`}></i>
      {label}
    </span>
  );

  const cardStyle: React.CSSProperties = {
    background: '#fff',
    border: '1px solid #e2e8f0',
    borderRadius: '16px',
    padding: '24px',
    boxShadow: '0 6px 20px rgba(15,23,42,0.06)',
  };

  return (
    <>
      <section className="page-hero">
        <div className="container">
          <Breadcrumb items={[
            { label: '首页', href: '/' },
            { label: '角色中心' },
          ]} />
          <div style={{ marginTop: '16px' }}>
            <h1>角色中心</h1>
            <p style={{ color: '#475569' }}>
              连接钱包后自动读取链上角色，不同身份会看到不同的操作入口。
            </p>
          </div>
        </div>
      </section>

      <div className="container" style={{ padding: '2.5rem 0', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {!isConnected && (
          <div style={cardStyle}>
            <p style={{ margin: 0 }}>请先连接钱包以查看权限。</p>
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
            <div style={cardStyle}>
              <h3 style={{ marginTop: 0, marginBottom: '12px' }}>我的角色</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                {renderBadge('MyToken: Admin', !!isTokenAdmin)}
                {renderBadge('MyToken: Pauser', !!isTokenPauser)}
                {renderBadge('MyToken: Minter', !!isTokenMinter)}
                {renderBadge('MyToken: URI Setter', !!isTokenUriSetter)}
                {renderBadge('Logic: Admin', isLogicAdminEffective)}
                {renderBadge('Logic: Publisher', !!isPublisher)}
              </div>
              <p style={{ marginTop: '12px', color: '#64748b' }}>
                当前合约地址：{addresses.realEstateLogic}（Logic） / {addresses.myToken}（MyToken）
              </p>
            </div>

            {isLogicAdminEffective && (
              <div style={cardStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3 style={{ margin: 0 }}>管理员工具</h3>
                    <p style={{ margin: '6px 0 0', color: '#475569' }}>添加发布者（调用 RealEstateLogic.addPublisher）</p>
                  </div>
                  <span style={{
                    padding: '6px 10px',
                    borderRadius: '8px',
                    background: 'rgba(59,130,246,0.12)',
                    color: '#1d4ed8',
                    fontSize: '13px',
                    border: '1px solid rgba(59,130,246,0.4)',
                  }}>
                    仅管理员可见
                  </span>
                </div>
                <form onSubmit={handleAddPublisher} style={{ marginTop: '16px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  <input
                    type="text"
                    value={publisherToAdd}
                    onChange={(e) => setPublisherToAdd(e.target.value)}
                    placeholder="0x 开头的发布者地址"
                    style={{
                      flex: 1,
                      minWidth: '260px',
                      padding: '10px 12px',
                      borderRadius: '10px',
                      border: '1px solid #cbd5e1',
                      fontSize: '14px',
                    }}
                  />
                  <button
                    type="submit"
                    disabled={isPending}
                    style={{
                      padding: '10px 16px',
                      borderRadius: '10px',
                      border: 'none',
                      background: '#4338ca',
                      color: '#fff',
                      cursor: 'pointer',
                      minWidth: '140px',
                      opacity: isPending ? 0.7 : 1,
                    }}
                  >
                    {isPending ? '提交中...' : '添加发布者'}
                  </button>
                </form>
                {txStatus && (
                  <p style={{ marginTop: '10px', color: '#0f172a' }}>{txStatus}</p>
                )}
              </div>
            )}

            {/* 待审核申请列表 */}
            {isLogicAdminEffective && (
              <div style={cardStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <div>
                    <h3 style={{ margin: 0 }}>待审核申请</h3>
                    <p style={{ margin: '6px 0 0', color: '#475569' }}>
                      审核用户提交的发布者申请
                    </p>
                  </div>
                  <button
                    onClick={fetchPendingApplications}
                    disabled={isLoadingApplications}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      background: '#fff',
                      cursor: isLoadingApplications ? 'not-allowed' : 'pointer',
                      fontSize: '13px',
                      color: '#4338ca',
                    }}
                  >
                    {isLoadingApplications ? '加载中...' : '刷新'}
                  </button>
                </div>

                {isLoadingApplications ? (
                  <p style={{ color: '#64748b', textAlign: 'center', padding: '20px' }}>加载中...</p>
                ) : pendingApplications.length === 0 ? (
                  <p style={{ color: '#64748b', textAlign: 'center', padding: '20px' }}>暂无待审核申请</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {pendingApplications.map((app) => (
                      <div
                        key={app.id}
                        style={{
                          padding: '16px',
                          borderRadius: '10px',
                          border: '1px solid #e2e8f0',
                          background: '#f9fafb',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>
                              申请者: {app.applicantAddress}
                            </div>
                            <div style={{ fontSize: '13px', color: '#64748b', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              {app.fullName && <div>姓名: {app.fullName}</div>}
                              {app.email && <div>邮箱: {app.email}</div>}
                              {app.phone && <div>电话: {app.phone}</div>}
                              {app.companyName && <div>公司: {app.companyName}</div>}
                              {app.submittedAt && (
                                <div>提交时间: {new Date(app.submittedAt).toLocaleString('zh-CN')}</div>
                              )}
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <a
                              href={`/api/kyc/download/${app.applicationId}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                padding: '8px 12px',
                                borderRadius: '8px',
                                border: '1px solid #cbd5e1',
                                background: '#fff',
                                color: '#4338ca',
                                textDecoration: 'none',
                                fontSize: '13px',
                                cursor: 'pointer',
                              }}
                            >
                              查看KYC
                            </a>
                          </div>
                        </div>

                        {reviewStatus[app.applicantAddress] && (
                          <div style={{
                            padding: '8px 12px',
                            borderRadius: '6px',
                            background: reviewStatus[app.applicantAddress].includes('错误')
                              ? 'rgba(239, 68, 68, 0.1)'
                              : 'rgba(59, 130, 246, 0.1)',
                            color: reviewStatus[app.applicantAddress].includes('错误')
                              ? '#dc2626'
                              : '#1d4ed8',
                            fontSize: '13px',
                            marginBottom: '12px',
                          }}>
                            {reviewStatus[app.applicantAddress]}
                          </div>
                        )}

                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            onClick={() => handleReviewApplication(app.applicantAddress, true)}
                            disabled={isPending || !!reviewStatus[app.applicantAddress]}
                            style={{
                              flex: 1,
                              padding: '10px 16px',
                              borderRadius: '8px',
                              border: 'none',
                              background: isPending || reviewStatus[app.applicantAddress]
                                ? '#9ca3af'
                                : '#10b981',
                              color: '#fff',
                              cursor: isPending || reviewStatus[app.applicantAddress]
                                ? 'not-allowed'
                                : 'pointer',
                              fontSize: '14px',
                              fontWeight: 500,
                            }}
                          >
                            通过
                          </button>
                          <button
                            onClick={() => {
                              const reason = prompt('请输入拒绝原因（可选）:');
                              if (reason !== null) {
                                handleReviewApplication(app.applicantAddress, false, reason);
                              }
                            }}
                            disabled={isPending || !!reviewStatus[app.applicantAddress]}
                            style={{
                              flex: 1,
                              padding: '10px 16px',
                              borderRadius: '8px',
                              border: 'none',
                              background: isPending || reviewStatus[app.applicantAddress]
                                ? '#9ca3af'
                                : '#dc2626',
                              color: '#fff',
                              cursor: isPending || reviewStatus[app.applicantAddress]
                                ? 'not-allowed'
                                : 'pointer',
                              fontSize: '14px',
                              fontWeight: 500,
                            }}
                          >
                            拒绝
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}


            {!isLogicAdminEffective && !isPublisher && (
              <div style={cardStyle}>
                <h3 style={{ marginTop: 0 }}>普通用户</h3>
                <p style={{ margin: 0, color: '#475569' }}>
                  你当前未获得管理员或发布者角色。可浏览资产、模拟交易，或联系管理员为你分配权限。
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}

