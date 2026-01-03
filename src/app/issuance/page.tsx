'use client';

import { useMemo, useState, useEffect } from 'react';
import { useAccount, useChainId, useReadContract, useReadContracts, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { keccak256, toBytes, parseEther } from 'viem';
import { isAddress } from 'viem';
import Breadcrumb from '../components/layout/Breadcrumb';
import { contracts, SupportedNetwork } from '../../contracts/addresses';
import { realEstateLogicAbi } from '../../contracts/abis';
import { useIPFS } from '../../hooks/useIPFS';
import type { PropertyMetadataInput } from '../../services/ipfs/metadata';
import { REGIONS, PROPERTY_TYPES, type Region, type PropertyType } from '../../constants/assets';
import { usePublisherProperties, type PublisherProperty } from '../../hooks/usePublisherProperties';

// 铸造计算信息卡片
function MintingCalculationCard({ 
  property, 
  amount 
}: { 
  property: PublisherProperty; 
  amount: number;
}) {
  // 优先使用链上数据，其次使用 IPFS 数据
  const unitPrice = property.unitPriceWei > 0n 
    ? Number(property.unitPriceWei) / 1e18 
    : property.unitPriceUSD || 0;
  const yieldPercent = property.annualYieldBps > 0n
    ? Number(property.annualYieldBps) / 100
    : property.yieldPercent || 0;

  const totalValue = unitPrice * amount;
  const annualReturn = totalValue * (yieldPercent / 100);

  if (unitPrice === 0 && yieldPercent === 0) {
    return null;
  }

  return (
    <div style={{
      padding: '16px',
      borderRadius: '10px',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: '#fff',
      marginBottom: '16px',
    }}>
      <h5 style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: 600, opacity: 0.9 }}>
        预计信息
      </h5>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '13px' }}>
        {unitPrice > 0 && (
          <div>
            <div style={{ opacity: 0.8, marginBottom: '4px' }}>预计总价值</div>
            <div style={{ fontSize: '18px', fontWeight: 600 }}>
              {unitPrice >= 1 ? `$${totalValue.toLocaleString('en-US', { maximumFractionDigits: 2 })}` : `${totalValue.toFixed(6)} ETH`}
            </div>
          </div>
        )}
        {yieldPercent > 0 && (
          <div>
            <div style={{ opacity: 0.8, marginBottom: '4px' }}>预计年化收益</div>
            <div style={{ fontSize: '18px', fontWeight: 600 }}>
              {unitPrice >= 1 ? `$${annualReturn.toLocaleString('en-US', { maximumFractionDigits: 2 })}` : `${annualReturn.toFixed(6)} ETH`}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// 铸造建议组件
function MintingRecommendation({ 
  property, 
  currentAmount 
}: { 
  property: PublisherProperty; 
  currentAmount: number;
}) {
  const availableToMint = property.maxSupply > 0n 
    ? Number(property.maxSupply - property.totalSupply) 
    : Infinity;
  const isFirstMint = property.totalSupply === 0n;
  const mintedPercentage = property.maxSupply > 0n 
    ? (Number(property.totalSupply) / Number(property.maxSupply)) * 100 
    : 0;

  let recommendation: { type: 'info' | 'warning' | 'success'; message: string } | null = null;

  if (isFirstMint && currentAmount > 100) {
    recommendation = {
      type: 'info',
      message: '💡 首次铸造建议：建议先铸造少量份额（10-100）进行测试，验证流程后再批量铸造。',
    };
  } else if (currentAmount > availableToMint) {
    recommendation = {
      type: 'warning',
      message: `⚠️ 铸造数量超过剩余可发行量（${availableToMint}），请调整数量。`,
    };
  } else if (currentAmount > 0 && currentAmount <= 10 && !isFirstMint) {
    recommendation = {
      type: 'info',
      message: '💡 建议：小额铸造适合测试，如需批量发行可增加数量。',
    };
  } else if (mintedPercentage > 80 && currentAmount > 0) {
    recommendation = {
      type: 'warning',
      message: `⚠️ 已发行 ${mintedPercentage.toFixed(1)}% 的份额，接近上限，请谨慎铸造。`,
    };
  }

  if (!recommendation) return null;

  const bgColor = recommendation.type === 'warning' 
    ? 'rgba(239, 68, 68, 0.1)' 
    : recommendation.type === 'success'
    ? 'rgba(16, 185, 129, 0.1)'
    : 'rgba(59, 130, 246, 0.1)';
  const textColor = recommendation.type === 'warning'
    ? '#dc2626'
    : recommendation.type === 'success'
    ? '#059669'
    : '#1d4ed8';

  return (
    <div style={{
      padding: '12px',
      borderRadius: '8px',
      background: bgColor,
      color: textColor,
      fontSize: '13px',
      lineHeight: '1.5',
    }}>
      {recommendation.message}
    </div>
  );
}

// 铸造交易状态组件
function MintTransactionStatus({ 
  propertyId, 
  hash, 
  onSuccess 
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
        交易确认中... 哈希: {hash}
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
        交易失败: {hash}
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
        ✓ 份额铸造成功！交易哈希: {hash}
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

export default function IssuancePage() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const addresses = useNetworkAddresses();
  const { writeContractAsync, isPending } = useWriteContract();
  
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
  const [txStatus, setTxStatus] = useState<string | null>(null);
  const { uploadMetadata, isUploading: isUploadingIPFS, error: ipfsError, clearError } = useIPFS();
  
  const { isLoading: isConfirmingProperty, isSuccess: isPropertyCreated } = useWaitForTransactionReceipt({
    hash: createPropertyHash,
  });

  // 铸造份额相关状态
  const [mintFormExpanded, setMintFormExpanded] = useState<Record<number, boolean>>({});
  const [mintForms, setMintForms] = useState<Record<number, { to: string; amount: string }>>({});
  const [mintHashes, setMintHashes] = useState<Record<number, `0x${string}` | null>>({});
  const [mintStatus, setMintStatus] = useState<Record<number, string | null>>({});

  // 获取发布者的房产列表
  const { properties: publisherProperties, isLoading: isLoadingProperties } = usePublisherProperties();

  // 检查是否为发布者
  const publisherRoleId = useMemo(() => keccak256(toBytes('PUBLISHER_ROLE')), []);
  const { data: isPublisher } = useReadContract({
    address: addresses?.realEstateLogic,
    abi: realEstateLogicAbi as any,
    functionName: 'hasRole',
    args: [
      publisherRoleId,
      address ?? '0x0000000000000000000000000000000000000000'
    ],
    query: { enabled: isConnected && !!addresses && !!address },
  } as any);

  // 申请成为发布者相关状态
  const [applicationForm, setApplicationForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    companyName: '',
    kycFile: null as File | null,
  });
  const [isApplicationFormExpanded, setIsApplicationFormExpanded] = useState(false);
  const [applicationStatus, setApplicationStatus] = useState<string | null>(null);
  const [applicationHash, setApplicationHash] = useState<`0x${string}` | null>(null);
  const [isSubmittingApplication, setIsSubmittingApplication] = useState(false);
  const [withdrawHash, setWithdrawHash] = useState<`0x${string}` | null>(null);
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  // 等待交易确认
  const { isLoading: isConfirmingApplication, isSuccess: isApplicationConfirmed, isError: isApplicationError } = useWaitForTransactionReceipt({
    hash: applicationHash,
  });

  // 等待撤回交易确认
  const { isLoading: isConfirmingWithdraw, isSuccess: isWithdrawConfirmed, isError: isWithdrawError } = useWaitForTransactionReceipt({
    hash: withdrawHash,
  });

  // 查询用户的申请状态（链上）
  const { data: chainApplication } = useReadContract({
    address: addresses?.realEstateLogic,
    abi: realEstateLogicAbi as any,
    functionName: 'getApplication',
    args: address ? [address] : undefined,
    query: { enabled: isConnected && !!addresses && !!address && !isPublisher },
  } as any);

  // 查询数据库中的申请状态
  const [dbApplication, setDbApplication] = useState<any>(null);
  
  // 当账号切换或成为发布者时，清除所有申请相关状态
  useEffect(() => {
    // 立即清除状态，避免显示其他账号的申请
    setDbApplication(null);
    setApplicationStatus(null);
    setIsApplicationFormExpanded(false);
    setApplicationHash(null);
    setWithdrawHash(null);
    setIsWithdrawing(false);
    setIsSubmittingApplication(false);
    
    if (isPublisher) {
      return;
    }
  }, [address, isPublisher]);
  
  // 查询数据库中的申请状态
  useEffect(() => {
    // 立即清除状态，避免显示其他账号的申请
    setDbApplication(null);
    
    // 只有当用户不是发布者且有地址时才查询申请状态
    if (address && !isPublisher) {
      fetch(`/api/kyc/applications/${address}`)
        .then(res => res.json())
        .then(data => {
          // 再次验证地址，确保数据属于当前账号
          if (data.application && 
              data.application.applicantAddress && 
              data.application.applicantAddress.toLowerCase() === address.toLowerCase()) {
            setDbApplication(data.application);
          } else {
            // 如果地址不匹配或没有申请记录，清除状态
            setDbApplication(null);
          }
        })
        .catch(err => {
          console.error('Failed to fetch application:', err);
          setDbApplication(null);
        });
    }
  }, [address, isPublisher]);

  // 监听交易确认状态
  useEffect(() => {
    if (isApplicationConfirmed && applicationHash) {
      setApplicationStatus(`✅ 申请已成功提交并确认！交易哈希: ${applicationHash.slice(0, 10)}...`);
      // 清空表单
      setApplicationForm({
        fullName: '',
        email: '',
        phone: '',
        companyName: '',
        kycFile: null,
      });
      setIsApplicationFormExpanded(false);
      // 重置哈希，以便下次申请
      setTimeout(() => {
        setApplicationHash(null);
      }, 5000);
    } else if (isApplicationError && applicationHash) {
      setApplicationStatus(`❌ 交易失败，请检查交易哈希: ${applicationHash.slice(0, 10)}...`);
    } else if (isConfirmingApplication && applicationHash) {
      setApplicationStatus(`等待交易确认... 哈希: ${applicationHash.slice(0, 10)}...`);
    }
  }, [isApplicationConfirmed, isApplicationError, isConfirmingApplication, applicationHash]);

  // 监听撤回交易确认状态
  useEffect(() => {
    if (isWithdrawConfirmed && withdrawHash) {
      setApplicationStatus(`✅ 申请已成功撤回！交易哈希: ${withdrawHash.slice(0, 10)}...`);
      // 刷新申请状态
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } else if (isWithdrawError && withdrawHash) {
      setApplicationStatus(`❌ 撤回失败，请检查交易哈希: ${withdrawHash.slice(0, 10)}...`);
      setIsWithdrawing(false);
    } else if (isConfirmingWithdraw && withdrawHash) {
      setApplicationStatus(`等待撤回交易确认... 哈希: ${withdrawHash.slice(0, 10)}...`);
    }
  }, [isWithdrawConfirmed, isWithdrawError, isConfirmingWithdraw, withdrawHash]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPropertyForm({ ...propertyForm, imageFile: file });
      clearError();
    }
  };

  const handleMintShares = async (e: React.FormEvent, propertyId: bigint) => {
    e.preventDefault();
    if (!addresses) return;

    const form = mintForms[Number(propertyId)];
    if (!form || !form.to || !form.amount) {
      setMintStatus(prev => ({ ...prev, [Number(propertyId)]: '请填写接收地址和数量' }));
      return;
    }

    if (!form.to.startsWith('0x') || form.to.length !== 42) {
      setMintStatus(prev => ({ ...prev, [Number(propertyId)]: '请输入合法的钱包地址' }));
      return;
    }

    const amount = BigInt(form.amount);
    if (amount <= 0n) {
      setMintStatus(prev => ({ ...prev, [Number(propertyId)]: '数量必须大于 0' }));
      return;
    }

    try {
      setMintStatus(prev => ({ ...prev, [Number(propertyId)]: '提交交易中...' }));
      
      // @ts-ignore - 避免深度类型推断问题
      const hash = await writeContractAsync({
        address: addresses.realEstateLogic,
        abi: realEstateLogicAbi as any,
        functionName: 'mintShares',
        args: [
          propertyId,
          form.to as `0x${string}`,
          amount,
        ],
      } as any);

      setMintHashes(prev => ({ ...prev, [Number(propertyId)]: hash }));
      setMintStatus(prev => ({ ...prev, [Number(propertyId)]: `交易已提交：${hash}` }));
      
      // 清空表单
      setMintForms(prev => ({
        ...prev,
        [Number(propertyId)]: { to: '', amount: '' },
      }));
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '铸造份额失败';
      setMintStatus(prev => ({ ...prev, [Number(propertyId)]: errorMsg }));
      console.error('铸造份额失败:', err);
    }
  };

  // 处理发布者申请
  const handleSubmitApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address || !addresses) {
      setApplicationStatus('请先连接钱包');
      return;
    }

    // 检查是否已经是发布者
    if (isPublisher) {
      setApplicationStatus('您已经是发布者，无需再次申请');
      return;
    }

    if (!applicationForm.kycFile) {
      setApplicationStatus('请上传KYC文件');
      return;
    }

    if (!applicationForm.fullName || !applicationForm.email || !applicationForm.phone) {
      setApplicationStatus('请填写所有必填字段');
      return;
    }

    // 检查链上是否已有申请
    let chainStatus = null;
    if (chainApplication) {
      // chainApplication 是一个元组，status 是第4个元素（索引3）
      // 或者可能是对象格式 { status, applicantAddr, applicationId, ... }
      const applicantAddr = Array.isArray(chainApplication) 
        ? chainApplication[0] 
        : (chainApplication as any)?.applicantAddr;
      
      // 验证申请人地址是否匹配
      if (applicantAddr && applicantAddr.toLowerCase() === address.toLowerCase()) {
        chainStatus = Array.isArray(chainApplication) 
          ? chainApplication[3] 
          : (chainApplication as any)?.status;
        
        if (chainStatus !== undefined && chainStatus !== null) {
          if (chainStatus === 0) { // Pending
            setApplicationStatus('您已有一个待审核的申请（链上），请等待审核结果');
            return;
          } else if (chainStatus === 1) { // Approved
            setApplicationStatus('您的申请已通过，您应该已经是发布者了');
            return;
          }
          // Rejected (2) 或 Withdrawn (3) 可以重新申请
        }
      }
    }
    
    // 检查数据库中是否已有待审核的申请
    if (dbApplication && dbApplication.status === 'pending') {
      // 如果数据库有 pending 申请，但链上没有，说明可能未同步
      if (chainStatus === null || chainStatus === undefined) {
        setApplicationStatus('检测到数据库中有待审核的申请，但链上未找到。可能是链上交易未确认，请稍后再试，或联系管理员。');
        return;
      }
      // 如果链上也有 pending 申请，则阻止提交
      if (chainStatus === 0) {
        setApplicationStatus('您已有一个待审核的申请，请等待审核结果');
        return;
      }
    }

    setIsSubmittingApplication(true);
    setApplicationStatus('提交申请中...');

    try {
      // 1. 先上传KYC文件到服务器，获取applicationId
      const formDataToSend = new FormData();
      formDataToSend.append('applicantAddress', address);
      formDataToSend.append('fullName', applicationForm.fullName);
      formDataToSend.append('email', applicationForm.email);
      formDataToSend.append('phone', applicationForm.phone);
      if (applicationForm.companyName) {
        formDataToSend.append('companyName', applicationForm.companyName);
      }
      formDataToSend.append('kycFile', applicationForm.kycFile);

      setApplicationStatus('上传KYC文件...');
      const response = await fetch('/api/kyc/apply', {
        method: 'POST',
        body: formDataToSend,
      });

      // 检查响应内容类型
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('API returned non-JSON response:', text);
        throw new Error('服务器返回了非 JSON 响应，请检查服务器日志');
      }

      const result = await response.json();
      
      if (!response.ok) {
        // 如果数据库返回已有 pending 申请的错误
        if (result.error && (result.error.includes('pending') || result.error.includes('already have'))) {
          throw new Error('数据库中已有待审核的申请。如果链上没有对应申请，可能是链上交易未确认，请稍后再试或联系管理员。');
        }
        throw new Error(result.error || result.details || 'Failed to submit application');
      }

      // 2. 调用链上合约提交申请
      setApplicationStatus('提交链上交易...');
      const hash = await writeContractAsync({
        address: addresses.realEstateLogic,
        abi: realEstateLogicAbi as any,
        functionName: 'applyForPublisher',
        args: [result.applicationId],
      } as any);

      setApplicationHash(hash);
      setApplicationStatus(`交易已提交，等待确认... 哈希: ${hash.slice(0, 10)}...`);
      
      // 注意：交易确认会通过 useWaitForTransactionReceipt hook 自动处理
      // 我们会在 useEffect 中监听 isApplicationConfirmed 状态
      
      // 清空表单
      setApplicationForm({
        fullName: '',
        email: '',
        phone: '',
        companyName: '',
        kycFile: null,
      });
      setIsApplicationFormExpanded(false);
    } catch (err: any) {
      console.error('申请失败:', err);
      
      // 解析错误信息
      let errorMsg = '申请失败';
      if (err instanceof Error) {
        errorMsg = err.message;
        
        // 检查是否是合约 revert 错误
        if (errorMsg.includes('reverted') || errorMsg.includes('aborted')) {
          // 尝试从错误中提取更详细的信息
          if (errorMsg.includes('already a publisher')) {
            errorMsg = '您已经是发布者，无需再次申请';
          } else if (errorMsg.includes('application already exists')) {
            errorMsg = '您已有一个待审核的申请，请等待审核结果';
          } else {
            errorMsg = '合约执行失败，可能是：1) 您已经是发布者 2) 您已有待审核的申请 3) 交易被取消或 Gas 不足';
          }
        } else if (errorMsg.includes('User rejected')) {
          errorMsg = '交易被用户取消';
        } else if (errorMsg.includes('insufficient funds')) {
          errorMsg = 'Gas 不足，请确保账户有足够的 ETH';
        }
      }
      
      setApplicationStatus(`错误: ${errorMsg}`);
    } finally {
      setIsSubmittingApplication(false);
    }
  };

  // 处理撤回申请
  const handleWithdrawApplication = async () => {
    if (!address || !addresses) {
      setApplicationStatus('请先连接钱包');
      return;
    }

    // 检查链上申请状态
    if (!chainApplication) {
      setApplicationStatus('错误: 链上未找到申请记录');
      return;
    }

    const status = Array.isArray(chainApplication) 
      ? chainApplication[3] 
      : (chainApplication as any)?.status;

    if (status !== 0) { // 不是 Pending 状态
      setApplicationStatus('错误: 只能撤回待审核的申请');
      return;
    }

    const confirmWithdraw = window.confirm('确认撤回申请？撤回后可以重新提交申请。');
    if (!confirmWithdraw) return;

    setIsWithdrawing(true);
    setApplicationStatus('提交撤回交易...');

    try {
      const hash = await writeContractAsync({
        address: addresses.realEstateLogic,
        abi: realEstateLogicAbi as any,
        functionName: 'withdrawApplication',
        args: [],
      } as any);

      setWithdrawHash(hash);
      setApplicationStatus(`撤回交易已提交，等待确认... ${hash.slice(0, 10)}...`);
    } catch (error: any) {
      console.error('撤回申请失败:', error);
      
      let errorMsg = '撤回失败';
      if (error instanceof Error) {
        errorMsg = error.message;
        
        if (errorMsg.includes('reverted') || errorMsg.includes('JSON-RPC')) {
          if (errorMsg.includes('can only withdraw pending applications')) {
            errorMsg = '只能撤回待审核的申请';
          } else {
            errorMsg = '合约执行失败，请检查申请状态';
          }
        } else if (errorMsg.includes('User rejected')) {
          errorMsg = '交易被用户取消';
        } else if (errorMsg.includes('insufficient funds')) {
          errorMsg = 'Gas 不足，请确保账户有足够的 ETH';
        }
      }
      
      setApplicationStatus(`错误: ${errorMsg}`);
      setIsWithdrawing(false);
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
      // @ts-ignore - 避免深度类型推断问题
      const hash = await writeContractAsync({
        address: addresses.realEstateLogic,
        abi: realEstateLogicAbi as any,
        functionName: 'createProperty',
        args: [
          propertyForm.name,
          propertyForm.location,
          metadataURI,
          BigInt(propertyForm.maxSupply),
        ],
      } as any);

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
      <section className="page-hero" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <div className="container">
          <Breadcrumb
            items={[
              { label: '首页', href: '/' },
              { label: '份额发行' },
            ]}
          />
          <h1 className="page-title">份额发行</h1>
          <p className="page-subtitle">
            发行房地产ETF份额，将优质资产代币化
          </p>
        </div>
      </section>

      <div className="container" style={{ padding: '2.5rem 1rem' }}>
        {!isConnected && (
          <div style={cardStyle}>
            <p style={{ margin: 0, color: '#64748b' }}>请先连接钱包以使用份额发行功能。</p>
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
            {!isPublisher && (
              <div style={cardStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <div>
                    <h3 style={{ margin: '0 0 8px', fontSize: '18px', fontWeight: 600 }}>
                      申请成为发布者
                    </h3>
                    <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>
                      提交KYC认证后，管理员将审核您的申请。审核通过后，您将获得发布者权限，可以创建房产和发行份额。
                    </p>
                  </div>
                  <button
                    onClick={() => setIsApplicationFormExpanded(!isApplicationFormExpanded)}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      background: '#fff',
                      cursor: 'pointer',
                      fontSize: '14px',
                      color: '#4338ca',
                    }}
                  >
                    {isApplicationFormExpanded ? '收起' : '填写申请'}
                  </button>
                </div>

                {/* 显示申请状态 */}
                {!isPublisher && (() => {
                  // 验证 chainApplication 是否属于当前账号
                  let validChainApplication = null;
                  if (chainApplication && address) {
                    const applicantAddr = Array.isArray(chainApplication) 
                      ? chainApplication[0] 
                      : (chainApplication as any)?.applicantAddr;
                    
                    // 只有当申请人地址与当前地址匹配时才使用
                    if (applicantAddr && applicantAddr.toLowerCase() === address.toLowerCase()) {
                      validChainApplication = chainApplication;
                    }
                  }
                  
                  // 验证 dbApplication 是否属于当前账号
                  let validDbApplication = null;
                  if (dbApplication && address) {
                    if (dbApplication.applicantAddress && 
                        dbApplication.applicantAddress.toLowerCase() === address.toLowerCase()) {
                      validDbApplication = dbApplication;
                    }
                  }
                  
                  // 只有当有有效的申请数据时才显示
                  if (!validChainApplication && !validDbApplication) {
                    return null;
                  }
                  
                  // 解析链上申请状态
                  const chainStatus = validChainApplication 
                    ? (Array.isArray(validChainApplication) ? validChainApplication[3] : (validChainApplication as any)?.status)
                    : null;
                  
                  // 检查是否未同步：数据库有申请但链上没有
                  const isUnsynced = validDbApplication && validDbApplication.status === 'pending' && (chainStatus === null || chainStatus === undefined);
                  
                  const isPending = chainStatus === 0 || validDbApplication?.status === 'pending';
                  const isApproved = chainStatus === 1 || validDbApplication?.status === 'approved';
                  const isRejected = chainStatus === 2 || validDbApplication?.status === 'rejected';
                  const isWithdrawn = chainStatus === 3;

                  return (
                    <div style={{
                      padding: '12px',
                      borderRadius: '8px',
                      background: isApproved
                        ? 'rgba(16, 185, 129, 0.1)'
                        : isRejected
                        ? 'rgba(239, 68, 68, 0.1)'
                        : isWithdrawn
                        ? 'rgba(148, 163, 184, 0.1)'
                        : 'rgba(59, 130, 246, 0.1)',
                      color: isApproved
                        ? '#059669'
                        : isRejected
                        ? '#dc2626'
                        : isWithdrawn
                        ? '#64748b'
                        : '#1d4ed8',
                      fontSize: '14px',
                      marginBottom: '16px',
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, marginBottom: '4px' }}>申请状态</div>
                          <div>
                            状态: {isPending ? '待审核' : 
                                  isApproved ? '已通过' :
                                  isRejected ? '已拒绝' :
                                  isWithdrawn ? '已撤回' : '未知'}
                          </div>
                          {isUnsynced && (
                            <div style={{ 
                              fontSize: '12px', 
                              marginTop: '8px', 
                              padding: '8px',
                              borderRadius: '6px',
                              background: 'rgba(245, 158, 11, 0.1)',
                              color: '#92400e',
                              border: '1px solid rgba(245, 158, 11, 0.3)',
                            }}>
                              ⚠️ 检测到数据库中有申请记录，但链上未找到对应申请。可能是链上交易未确认，请稍后刷新页面或联系管理员。
                            </div>
                          )}
                          {validDbApplication?.submittedAt && (
                            <div style={{ fontSize: '12px', opacity: 0.8, marginTop: '4px' }}>
                              提交时间: {new Date(validDbApplication.submittedAt).toLocaleString('zh-CN')}
                            </div>
                          )}
                          {validDbApplication?.rejectionReason && (
                            <div style={{ fontSize: '12px', marginTop: '4px' }}>
                              拒绝原因: {validDbApplication.rejectionReason}
                            </div>
                          )}
                        </div>
                        {isPending && (
                          <button
                            onClick={handleWithdrawApplication}
                            disabled={isWithdrawing || isConfirmingWithdraw}
                            style={{
                              padding: '6px 12px',
                              borderRadius: '6px',
                              border: '1px solid #dc2626',
                              background: isWithdrawing || isConfirmingWithdraw ? '#fca5a5' : '#fee2e2',
                              color: '#991b1b',
                              cursor: isWithdrawing || isConfirmingWithdraw ? 'not-allowed' : 'pointer',
                              fontSize: '13px',
                              fontWeight: 500,
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {isWithdrawing || isConfirmingWithdraw ? '撤回中...' : '撤回申请'}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })()}

                {/* 申请表单 */}
                {isApplicationFormExpanded && (
                  <form onSubmit={handleSubmitApplication} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div>
                        <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: 500 }}>
                          姓名 *
                        </label>
                        <input
                          type="text"
                          value={applicationForm.fullName}
                          onChange={(e) => setApplicationForm({ ...applicationForm, fullName: e.target.value })}
                          placeholder="请输入您的真实姓名"
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
                          邮箱 *
                        </label>
                        <input
                          type="email"
                          value={applicationForm.email}
                          onChange={(e) => setApplicationForm({ ...applicationForm, email: e.target.value })}
                          placeholder="example@email.com"
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

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div>
                        <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: 500 }}>
                          电话 *
                        </label>
                        <input
                          type="tel"
                          value={applicationForm.phone}
                          onChange={(e) => setApplicationForm({ ...applicationForm, phone: e.target.value })}
                          placeholder="请输入联系电话"
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
                          公司名称（可选）
                        </label>
                        <input
                          type="text"
                          value={applicationForm.companyName}
                          onChange={(e) => setApplicationForm({ ...applicationForm, companyName: e.target.value })}
                          placeholder="如有公司，请输入公司名称"
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
                        KYC认证文件 *
                      </label>
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setApplicationForm({ ...applicationForm, kycFile: file });
                          }
                        }}
                        required
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          borderRadius: '8px',
                          border: '1px solid #cbd5e1',
                          fontSize: '14px',
                        }}
                      />
                      <small style={{ fontSize: '12px', color: '#64748b', marginTop: '4px', display: 'block' }}>
                        支持 PDF、JPG、PNG 格式，文件大小不超过 10MB
                      </small>
                    </div>

                    {/* 交易状态 */}
                    {applicationHash && (
                      <div style={{
                        padding: '12px',
                        borderRadius: '8px',
                        background: 'rgba(59, 130, 246, 0.1)',
                        color: '#1d4ed8',
                        fontSize: '14px',
                      }}>
                        交易确认中... 哈希: {applicationHash.slice(0, 10)}...
                      </div>
                    )}

                    {applicationStatus && !applicationHash && (
                      <div style={{
                        padding: '12px',
                        borderRadius: '8px',
                        background: applicationStatus.includes('错误') || applicationStatus.includes('失败')
                          ? 'rgba(239, 68, 68, 0.1)'
                          : 'rgba(59, 130, 246, 0.1)',
                        color: applicationStatus.includes('错误') || applicationStatus.includes('失败')
                          ? '#dc2626'
                          : '#1d4ed8',
                        fontSize: '14px',
                      }}>
                        {applicationStatus}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={isSubmittingApplication || !applicationForm.kycFile}
                      style={{
                        padding: '12px 24px',
                        borderRadius: '8px',
                        border: 'none',
                        background: isSubmittingApplication || !applicationForm.kycFile
                          ? '#9ca3af'
                          : '#4338ca',
                        color: '#fff',
                        cursor: isSubmittingApplication || !applicationForm.kycFile
                          ? 'not-allowed'
                          : 'pointer',
                        fontSize: '16px',
                        fontWeight: 500,
                        transition: 'all 0.2s',
                      }}
                    >
                      {isSubmittingApplication ? '提交中...' : '提交申请'}
                    </button>
                  </form>
                )}
              </div>
            )}

            {isPublisher && (
              <>
                {/* 创建房产表单 */}
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
                        <span>创建新房产</span>
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

                {/* 我的房产列表 */}
                <div style={cardStyle}>
                  <h3 style={{ marginTop: 0, marginBottom: '12px' }}>我的房产列表</h3>
                  <p style={{ margin: '0 0 16px', color: '#475569', fontSize: '14px' }}>
                    管理你创建的房产，为它们铸造份额
                  </p>

                  {isLoadingProperties ? (
                    <p style={{ color: '#64748b' }}>加载中...</p>
                  ) : publisherProperties.length === 0 ? (
                    <p style={{ color: '#64748b' }}>你还没有创建任何房产。请先使用上方的表单创建房产。</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      {publisherProperties.map((property) => {
                        const propertyIdNum = Number(property.propertyId);
                        const isExpanded = mintFormExpanded[propertyIdNum] || false;
                        const mintForm = mintForms[propertyIdNum] || { to: address || '', amount: '' };
                        const mintHash = mintHashes[propertyIdNum];
                        const status = mintStatus[propertyIdNum];

                        return (
                          <div
                            key={propertyIdNum}
                            style={{
                              border: '1px solid #e2e8f0',
                              borderRadius: '12px',
                              padding: '16px',
                              background: '#f8fafc',
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                              <div style={{ flex: 1 }}>
                                <h4 style={{ margin: '0 0 6px', fontSize: '16px', fontWeight: 600 }}>
                                  #{propertyIdNum} - {property.name}
                                </h4>
                                <p style={{ margin: '0 0 8px', color: '#64748b', fontSize: '14px' }}>
                                  {property.location}
                                </p>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', fontSize: '13px', color: '#475569', marginTop: '8px' }}>
                                  <span>
                                    <strong>已发行：</strong>
                                    {property.totalSupply.toString()} / {property.maxSupply.toString() === '0' ? '∞' : property.maxSupply.toString()}
                                  </span>
                                  <span>
                                    <strong>状态：</strong>
                                    <span style={{ color: property.active ? '#059669' : '#dc2626' }}>
                                      {property.active ? '✓ 活跃' : '✗ 已停用'}
                                    </span>
                                  </span>
                                  {(property.unitPriceWei > 0n || property.unitPriceUSD) && (
                                    <span>
                                      <strong>单价：</strong>
                                      {property.unitPriceWei > 0n 
                                        ? `${(Number(property.unitPriceWei) / 1e18).toFixed(4)} ETH`
                                        : property.unitPriceUSD 
                                        ? `$${property.unitPriceUSD.toLocaleString()}`
                                        : '未设置'}
                                    </span>
                                  )}
                                  {(property.annualYieldBps > 0n || property.yieldPercent) && (
                                    <span>
                                      <strong>年化收益：</strong>
                                      {property.annualYieldBps > 0n
                                        ? `${(Number(property.annualYieldBps) / 100).toFixed(2)}%`
                                        : property.yieldPercent
                                        ? `${property.yieldPercent}%`
                                        : '未设置'}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                <button
                                  onClick={() => setMintFormExpanded(prev => ({ ...prev, [propertyIdNum]: !isExpanded }))}
                                  style={{
                                    padding: '8px 12px',
                                    borderRadius: '8px',
                                    border: '1px solid #cbd5e1',
                                    background: '#fff',
                                    cursor: 'pointer',
                                    fontSize: '13px',
                                    color: '#4338ca',
                                  }}
                                >
                                  {isExpanded ? '收起' : '铸造份额'}
                                </button>
                                {(property.unitPriceWei === 0n || property.annualYieldBps === 0n) && (
                                  <button
                                    onClick={async () => {
                                      if (!addresses) return;

                                      // 必须先在 IPFS 元数据里配置过单价和年化收益
                                      if (!property.unitPriceUSD || !property.yieldPercent) {
                                        alert('请在创建房产时填写单价和年化收益率后，再同步到链上。');
                                        return;
                                      }

                                      try {
                                        // 将 IPFS 中的 USD 单价转换为 18 位精度的代币数量（TUSDC）
                                        const unitPriceWei = parseEther(
                                          property.unitPriceUSD.toString()
                                        );
                                        // 年化收益率（例如 8.5% -> 850 bps）
                                        const annualYieldBps = BigInt(
                                          Math.round(property.yieldPercent * 100)
                                        );

                                        const confirmSync = window.confirm(
                                          `确认将 IPFS 中的金融参数同步到链上？\n\n` +
                                            `单价：$${property.unitPriceUSD} -> ${property.unitPriceUSD} TUSDC（18 位精度）\n` +
                                            `年化收益率：${property.yieldPercent}% -> ${annualYieldBps} bps`
                                        );
                                        if (!confirmSync) return;

                                        // @ts-ignore - 避免深度类型推断问题
                                        const hash = await writeContractAsync({
                                          address: addresses.realEstateLogic,
                                          abi: realEstateLogicAbi as any,
                                          functionName: 'setPropertyFinancials',
                                          args: [property.propertyId, unitPriceWei, annualYieldBps],
                                        } as any);

                                        alert(`链上参数已提交交易：${hash}`);
                                      } catch (err) {
                                        console.error('设置链上金融参数失败:', err);
                                        alert(
                                          err instanceof Error
                                            ? `设置失败：${err.message}`
                                            : '设置链上金融参数失败，请稍后重试。'
                                        );
                                      }
                                    }}
                                    style={{
                                      padding: '8px 12px',
                                      borderRadius: '8px',
                                      border: '1px solid #f59e0b',
                                      background: '#fef3c7',
                                      cursor: 'pointer',
                                      fontSize: '13px',
                                      color: '#92400e',
                                    }}
                                    title="设置链上金融参数"
                                  >
                                    ⚙️ 设置参数
                                  </button>
                                )}
                              </div>
                            </div>

                            {isExpanded && (
                              <div style={{
                                marginTop: '16px',
                                paddingTop: '16px',
                                borderTop: '1px solid #e2e8f0',
                              }}>
                                {/* 计算信息卡片 */}
                                {mintForm.amount && Number(mintForm.amount) > 0 && (
                                  <MintingCalculationCard 
                                    property={property}
                                    amount={Number(mintForm.amount)}
                                  />
                                )}

                                {/* 铸造表单 */}
                                <form
                                  onSubmit={(e) => handleMintShares(e, property.propertyId)}
                                  style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '12px',
                                    marginTop: '16px',
                                  }}
                                >
                                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                    <div>
                                      <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: 500 }}>
                                        接收地址 *
                                      </label>
                                      <input
                                        type="text"
                                        value={mintForm.to}
                                        onChange={(e) => setMintForms(prev => ({
                                          ...prev,
                                          [propertyIdNum]: { ...mintForm, to: e.target.value },
                                        }))}
                                        placeholder="0x..."
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
                                        数量 *
                                      </label>
                                      <input
                                        type="number"
                                        value={mintForm.amount}
                                        onChange={(e) => setMintForms(prev => ({
                                          ...prev,
                                          [propertyIdNum]: { ...mintForm, amount: e.target.value },
                                        }))}
                                        placeholder="如：100"
                                        required
                                        min="1"
                                        max={property.maxSupply > 0n ? Number(property.maxSupply - property.totalSupply) : undefined}
                                        style={{
                                          width: '100%',
                                          padding: '10px 12px',
                                          borderRadius: '8px',
                                          border: '1px solid #cbd5e1',
                                          fontSize: '14px',
                                        }}
                                      />
                                      {property.maxSupply > 0n && (
                                        <small style={{ fontSize: '12px', color: '#64748b', marginTop: '4px', display: 'block' }}>
                                          最多可铸造: {Number(property.maxSupply - property.totalSupply)} 个
                                        </small>
                                      )}
                                    </div>
                                  </div>

                                  {/* 铸造建议 */}
                                  <MintingRecommendation 
                                    property={property}
                                    currentAmount={mintForm.amount ? Number(mintForm.amount) : 0}
                                  />

                                  {mintHash && (
                                    <MintTransactionStatus 
                                      propertyId={propertyIdNum}
                                      hash={mintHash}
                                      onSuccess={() => {
                                        // 交易成功后清空状态和表单
                                        setMintHashes(prev => {
                                          const newState = { ...prev };
                                          delete newState[propertyIdNum];
                                          return newState;
                                        });
                                        setMintStatus(prev => {
                                          const newState = { ...prev };
                                          delete newState[propertyIdNum];
                                          return newState;
                                        });
                                        setMintForms(prev => ({
                                          ...prev,
                                          [propertyIdNum]: { to: address || '', amount: '' },
                                        }));
                                      }}
                                    />
                                  )}

                                  {status && !mintHash && (
                                    <div style={{
                                      padding: '12px',
                                      borderRadius: '8px',
                                      background: 'rgba(239, 68, 68, 0.1)',
                                      color: '#dc2626',
                                      fontSize: '14px',
                                    }}>
                                      {status}
                                    </div>
                                  )}

                                  <button
                                    type="submit"
                                    disabled={isPending}
                                    style={{
                                      padding: '10px 16px',
                                      borderRadius: '8px',
                                      border: 'none',
                                      background: '#4338ca',
                                      color: '#fff',
                                      cursor: isPending ? 'not-allowed' : 'pointer',
                                      fontSize: '14px',
                                      fontWeight: 500,
                                      opacity: isPending ? 0.7 : 1,
                                    }}
                                  >
                                    {isPending ? '提交中...' : '铸造份额'}
                                  </button>
                                </form>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </>
  );
}
