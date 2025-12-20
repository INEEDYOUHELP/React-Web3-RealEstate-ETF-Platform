'use client';

import { useMemo, useState } from 'react';
import { useAccount, useChainId, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { keccak256, toBytes } from 'viem';
import Breadcrumb from '../components/layout/Breadcrumb';
import { contracts, SupportedNetwork } from '../../contracts/addresses';
import { myTokenAbi, realEstateLogicAbi } from '../../contracts/abis';
import { useIPFS } from '../../hooks/useIPFS';
import type { PropertyMetadataInput } from '../../services/ipfs/metadata';
import { REGIONS, PROPERTY_TYPES, type Region, type PropertyType } from '../../constants/assets';

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
  
  // 创建房产相关状态
  const [isFormExpanded, setIsFormExpanded] = useState(false);
  const [propertyForm, setPropertyForm] = useState({
    name: '',
    description: '',
    location: '',
    type: '' as PropertyType | '',
    region: '' as Region | '',
    price: '', // 总市值（可选，向后兼容）
    unitPrice: '', // 单价（每个份额的价格，推荐）
    yield: '',
    maxSupply: '',
    imageFile: null as File | null,
  });
  const [createPropertyHash, setCreatePropertyHash] = useState<`0x${string}` | null>(null);
  const { uploadMetadata, isUploading: isUploadingIPFS, error: ipfsError, clearError } = useIPFS();
  
  const { isLoading: isConfirmingProperty, isSuccess: isPropertyCreated } = useWaitForTransactionReceipt({
    hash: createPropertyHash,
  });

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

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPropertyForm({ ...propertyForm, imageFile: file });
      clearError();
    }
  };

  const handleCreateProperty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addresses) return;
    
    if (!propertyForm.imageFile) {
      setTxStatus('请选择房产图片');
      return;
    }

    if (!propertyForm.name || !propertyForm.description || !propertyForm.location || !propertyForm.maxSupply) {
      setTxStatus('请填写所有必填字段（名称、描述、位置、最大供应量）');
      return;
    }

    if (!propertyForm.type || !propertyForm.region) {
      setTxStatus('请选择类型和地区');
      return;
    }

    try {
      setTxStatus('正在上传元数据到 IPFS...');
      clearError();

      // 步骤 1: 上传元数据到 IPFS
      const metadataInput: PropertyMetadataInput = {
        name: propertyForm.name,
        description: propertyForm.description,
        image: propertyForm.imageFile,
        location: propertyForm.location,
        type: propertyForm.type,
        region: propertyForm.region,
        price: propertyForm.price ? Number(propertyForm.price) : undefined, // 总市值（可选）
        unitPrice: propertyForm.unitPrice ? Number(propertyForm.unitPrice) : undefined, // 单价（推荐）
        yield: propertyForm.yield ? Number(propertyForm.yield) : undefined,
        totalUnits: propertyForm.maxSupply ? Number(propertyForm.maxSupply) : undefined,
      };

      const metadataURI = await uploadMetadata(metadataInput);
      console.log('元数据已上传到 IPFS:', metadataURI);

      // 步骤 2: 调用智能合约创建房产
      setTxStatus('正在创建房产...');
      const hash = await writeContractAsync({
        address: addresses.realEstateLogic,
        abi: realEstateLogicAbi,
        functionName: 'createProperty',
        args: [
          propertyForm.name,
          propertyForm.location,
          metadataURI,
          BigInt(propertyForm.maxSupply),
        ],
      });

      setCreatePropertyHash(hash);
      setTxStatus(`交易已提交：${hash}`);
      
      // 重置表单并折叠
      setPropertyForm({
        name: '',
        description: '',
        location: '',
        type: '' as PropertyType | '',
        region: '' as Region | '',
        price: '',
        unitPrice: '',
        yield: '',
        maxSupply: '',
        imageFile: null,
      });
      setIsFormExpanded(false);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '创建房产失败';
      setTxStatus(errorMsg);
      console.error('创建房产失败:', err);
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
                <div 
                  style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    cursor: 'pointer',
                    userSelect: 'none',
                    padding: '4px 0',
                    transition: 'opacity 0.2s',
                  }}
                  onClick={() => setIsFormExpanded(!isFormExpanded)}
                  onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
                  onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                >
                  <div style={{ flex: 1 }}>
                    <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span>发布者专区</span>
                      <span style={{
                        fontSize: '16px',
                        color: '#64748b',
                        fontWeight: 'normal',
                        transition: 'transform 0.2s',
                        transform: isFormExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                        display: 'inline-block',
                      }}>
                        ▶
                      </span>
                    </h3>
                    <p style={{ margin: '6px 0 0', color: '#475569', fontSize: '14px' }}>
                      {isFormExpanded ? '点击收起表单' : '点击展开创建新房产表单，上传元数据到 IPFS'}
                    </p>
                  </div>
                  <span style={{
                    padding: '6px 10px',
                    borderRadius: '8px',
                    background: 'rgba(59,130,246,0.12)',
                    color: '#1d4ed8',
                    fontSize: '13px',
                    border: '1px solid rgba(59,130,246,0.4)',
                  }}>
                    仅发布者可见
                  </span>
                </div>

                {isFormExpanded && (
                  <form 
                    onSubmit={handleCreateProperty} 
                    style={{ 
                      display: 'flex', 
                      flexDirection: 'column', 
                      gap: '16px',
                      marginTop: '20px',
                      paddingTop: '20px',
                      borderTop: '1px solid #e2e8f0',
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: 500 }}>
                        房产名称 *
                      </label>
                      <input
                        type="text"
                        value={propertyForm.name}
                        onChange={(e) => setPropertyForm({ ...propertyForm, name: e.target.value })}
                        required
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          borderRadius: '8px',
                          border: '1px solid #cbd5e1',
                          fontSize: '14px',
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: 500 }}>
                        位置 *
                      </label>
                      <input
                        type="text"
                        value={propertyForm.location}
                        onChange={(e) => setPropertyForm({ ...propertyForm, location: e.target.value })}
                        required
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          borderRadius: '8px',
                          border: '1px solid #cbd5e1',
                          fontSize: '14px',
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: 500 }}>
                      描述 *
                    </label>
                    <textarea
                      value={propertyForm.description}
                      onChange={(e) => setPropertyForm({ ...propertyForm, description: e.target.value })}
                      required
                      rows={3}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        fontSize: '14px',
                        resize: 'vertical',
                      }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: 500 }}>
                        类型 *
                      </label>
                      <select
                        value={propertyForm.type}
                        onChange={(e) => setPropertyForm({ ...propertyForm, type: e.target.value as PropertyType | '' })}
                        required
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          borderRadius: '8px',
                          border: '1px solid #cbd5e1',
                          fontSize: '14px',
                          background: '#fff',
                          cursor: 'pointer',
                        }}
                      >
                        <option value="">请选择类型</option>
                        {PROPERTY_TYPES.map((type) => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: 500 }}>
                        地区 *
                      </label>
                      <select
                        value={propertyForm.region}
                        onChange={(e) => setPropertyForm({ ...propertyForm, region: e.target.value as Region | '' })}
                        required
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          borderRadius: '8px',
                          border: '1px solid #cbd5e1',
                          fontSize: '14px',
                          background: '#fff',
                          cursor: 'pointer',
                        }}
                      >
                        <option value="">请选择地区</option>
                        {REGIONS.map((region) => (
                          <option key={region} value={region}>
                            {region}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: 500 }}>
                        最大供应量 *
                      </label>
                      <input
                        type="number"
                        value={propertyForm.maxSupply}
                        onChange={(e) => setPropertyForm({ ...propertyForm, maxSupply: e.target.value })}
                        required
                        min="1"
                        placeholder="如：10000"
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          borderRadius: '8px',
                          border: '1px solid #cbd5e1',
                          fontSize: '14px',
                        }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: 500 }}>
                        单价 (USD) <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 'normal' }}>推荐</span>
                      </label>
                      <input
                        type="number"
                        value={propertyForm.unitPrice}
                        onChange={(e) => setPropertyForm({ ...propertyForm, unitPrice: e.target.value })}
                        placeholder="每个份额的价格，如：10000"
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          borderRadius: '8px',
                          border: '1px solid #cbd5e1',
                          fontSize: '14px',
                        }}
                      />
                      <small style={{ fontSize: '12px', color: '#64748b', marginTop: '4px', display: 'block' }}>
                        市值将自动计算：单价 × 最大供应量
                      </small>
                    </div>

                    <div>
                      <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: 500 }}>
                        年化收益率 (%)
                      </label>
                      <input
                        type="number"
                        value={propertyForm.yield}
                        onChange={(e) => setPropertyForm({ ...propertyForm, yield: e.target.value })}
                        placeholder="如：8.5"
                        step="0.1"
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          borderRadius: '8px',
                          border: '1px solid #cbd5e1',
                          fontSize: '14px',
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: 500 }}>
                      房产图片 * <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 'normal' }}>(将自动上传到 IPFS)</span>
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      required
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        fontSize: '14px',
                        cursor: 'pointer',
                      }}
                    />
                    {propertyForm.imageFile && (
                      <div style={{ marginTop: '10px' }}>
                        <img
                          src={URL.createObjectURL(propertyForm.imageFile)}
                          alt="预览"
                          style={{
                            maxWidth: '200px',
                            maxHeight: '200px',
                            borderRadius: '8px',
                            border: '1px solid #e2e8f0',
                            objectFit: 'cover',
                          }}
                        />
                        <p style={{ marginTop: '6px', fontSize: '12px', color: '#64748b' }}>
                          文件名: {propertyForm.imageFile.name}
                        </p>
                      </div>
                    )}
                  </div>

                  {ipfsError && (
                    <div style={{
                      padding: '12px',
                      borderRadius: '8px',
                      background: 'rgba(239, 68, 68, 0.1)',
                      color: '#dc2626',
                      fontSize: '14px',
                    }}>
                      IPFS 错误: {ipfsError}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isUploadingIPFS || isPending || isConfirmingProperty}
                    style={{
                      padding: '12px 24px',
                      borderRadius: '10px',
                      border: 'none',
                      background: isPropertyCreated ? '#10b981' : '#4338ca',
                      color: '#fff',
                      cursor: isUploadingIPFS || isPending || isConfirmingProperty ? 'not-allowed' : 'pointer',
                      fontSize: '15px',
                      fontWeight: 500,
                      opacity: isUploadingIPFS || isPending || isConfirmingProperty ? 0.7 : 1,
                    }}
                  >
                    {isUploadingIPFS
                      ? '上传元数据到 IPFS...'
                      : isPending || isConfirmingProperty
                      ? '处理中...'
                      : isPropertyCreated
                      ? '✓ 房产创建成功！'
                      : '创建房产'}
                  </button>

                  {isPropertyCreated && createPropertyHash && (
                    <div style={{
                      padding: '12px',
                      borderRadius: '8px',
                      background: 'rgba(16, 185, 129, 0.1)',
                      color: '#059669',
                      fontSize: '14px',
                    }}>
                      房产创建成功！交易哈希: {createPropertyHash}
                    </div>
                  )}

                  {txStatus && !isPropertyCreated && (
                    <p style={{ margin: 0, color: '#0f172a', fontSize: '14px' }}>{txStatus}</p>
                  )}
                  </form>
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

