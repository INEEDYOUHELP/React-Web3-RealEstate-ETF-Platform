'use client';

import { useMemo, useState } from 'react';
import { useAccount, useChainId, useReadContract, useWriteContract } from 'wagmi';
import { keccak256, toBytes } from 'viem';
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
    } catch (err) {
      setTxStatus(err instanceof Error ? err.message : '交易提交失败');
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

            {isPublisher && (
              <div style={cardStyle}>
                <h3 style={{ marginTop: 0 }}>发布者专区</h3>
                <p style={{ margin: 0, color: '#475569' }}>
                  你拥有 Publisher 角色，可创建房产并铸造份额。后续可在此衔接
                  <strong> createProperty / mintShares </strong>
                  的交互，或跳转到交易中心管理相关资产。
                </p>
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

