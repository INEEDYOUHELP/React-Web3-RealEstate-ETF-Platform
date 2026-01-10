'use client';

import { useReadContract, useReadContracts } from 'wagmi';
import { useChainId } from 'wagmi';
import { contracts } from '../contracts/addresses';
import { realEstateStorageAbi } from '../contracts/abis';
import { fetchMetadataFromIPFS, type ERC1155Metadata } from '../services/ipfs/metadata';
import { Asset } from '../types';
import { useEffect, useMemo, useState } from 'react';

interface ChainProperty {
  name: string;
  location: string;
  metadataURI: string;
  tokenId: bigint;
  publisher: string;
  totalSupply: bigint;
  maxSupply: bigint;
  active: boolean;
  projectEndTime?: bigint; // 项目结束时间（0 表示未结束）
}

export function useChainAssets() {
  const chainId = useChainId();
  
  // 获取合约地址（支持 Hardhat 31337 和 Anvil 1337）
  const storageAddress = useMemo(() => {
    const key = chainId === 31337 || chainId === 1337 ? 'localhost' : undefined;
    return key ? contracts[key]?.realEstateStorage : undefined;
  }, [chainId]);

  // 读取 nextPropertyId
  const { data: nextPropertyId, isLoading: isLoadingCount } = useReadContract({
    address: storageAddress,
    abi: realEstateStorageAbi,
    functionName: 'nextPropertyId',
    query: { enabled: !!storageAddress },
  });

  // 生成所有 propertyId 的数组（从 1 到 nextPropertyId-1）
  const propertyIds = useMemo(() => {
    if (!nextPropertyId || nextPropertyId === BigInt(0)) return [];
    const ids: bigint[] = [];
    const one = BigInt(1);
    for (let i = one; i < nextPropertyId; i++) {
      ids.push(i);
    }
    return ids;
  }, [nextPropertyId]);

  // 批量读取所有房产数据
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
  const { data: propertiesData, isLoading: isLoadingProperties } = useReadContracts({
    contracts: contractsConfig,
    query: { enabled: contractsConfig.length > 0 },
  });

  // 解析房产数据并获取 IPFS 元数据
  const [chainAssets, setChainAssets] = useState<Asset[]>([]);
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(false);

  useEffect(() => {
    // 调试信息
    console.log('useChainAssets Debug:', {
      chainId,
      storageAddress,
      nextPropertyId: nextPropertyId?.toString(),
      propertyIdsCount: propertyIds.length,
      propertiesDataLength: propertiesData?.length,
      propertiesData,
    });

    if (!propertiesData || propertiesData.length === 0) {
      setChainAssets([]);
      return;
    }

    const loadMetadata = async () => {
      setIsLoadingMetadata(true);
      try {
        const assets: (Asset | null)[] = await Promise.all(
          propertiesData.map(async (item, index) => {
            // 调试每个结果
            console.log(`Property ${index} item:`, item);
            
            // 检查结果是否有效
            if (!item) {
              console.log(`Property ${index} skipped: item is null/undefined`);
              return null;
            }
            
            // wagmi v2 的 useReadContracts 返回结构是 {result: {...}, status: 'success'}
            // 数据在 item.result 中
            if (item.status && item.status !== 'success') {
              console.log(`Property ${index} skipped: status is not success`, item.status);
              return null;
            }
            
            // 获取 result 对象（wagmi v2 的结构是 {result: {...}, status: 'success'}）
            const resultObj = (item as any).result;
            if (!resultObj) {
              console.log(`Property ${index} skipped: no result in item`, item);
              return null;
            }
            
            console.log(`Property ${index} resultObj:`, resultObj);
            
            // 检查是否有错误
            if (resultObj.error) {
              console.log(`Property ${index} skipped: has error`, resultObj.error);
              return null;
            }
            
            // resultObj 应该就是合约返回的 Property 结构
            // 但为了兼容，也检查 resultObj.data
            const propertyData = resultObj.data || resultObj;
            if (!propertyData) {
              console.log(`Property ${index} skipped: no propertyData`);
              return null;
            }
            
            console.log(`Property ${index} propertyData:`, propertyData);
            
            const property = propertyData as ChainProperty;
            
            // 验证必要字段
            if (!property.name || !property.location) {
              console.log(`Property ${index} skipped: missing required fields`, property);
              return null;
            }
            
            console.log(`Property ${index} final property:`, property);
            
            // 检查 publisher 是否为非零地址（表示房产存在）
            if (property.publisher === '0x0000000000000000000000000000000000000000' || !property.publisher) {
              console.log(`Property ${index} skipped: invalid publisher`);
              return null;
            }
            
            if (!property.active) {
              console.log(`Property ${index} is inactive`);
              return null;
            }

            // 过滤已结束的项目：projectEndTime > 0 表示项目已结束
            const projectEndTime = property.projectEndTime ? BigInt(property.projectEndTime.toString()) : BigInt(0);
            if (projectEndTime > BigInt(0)) {
              console.log(`Property ${index} skipped: project ended (projectEndTime: ${projectEndTime})`);
              return null;
            }

            try {
              // 从 IPFS 获取元数据
              const metadata: ERC1155Metadata = await fetchMetadataFromIPFS(property.metadataURI);
              
              // 从元数据中提取属性
              const properties = metadata.properties || {};
              
              // 计算市值：优先使用 unitPrice × maxSupply，其次使用 price（总市值），最后使用默认值
              let marketValue = 0;
              if (properties.unitPrice && property.maxSupply > BigInt(0)) {
                // 方案1：单价 × 总份额（推荐）
                marketValue = Number(properties.unitPrice) * Number(property.maxSupply);
              } else if (properties.price) {
                // 方案2：直接使用总市值（向后兼容）
                marketValue = Number(properties.price);
              } else if (property.maxSupply > BigInt(0)) {
                // 方案3：默认计算（如果没有价格信息，使用默认单价）
                const defaultUnitPrice = 10000; // 默认每个份额 $10,000
                marketValue = defaultUnitPrice * Number(property.maxSupply);
              }
              
              // 转换为 Asset 格式
              const asset: Asset = {
                id: Number(property.tokenId) + 10000, // 使用大数字避免与假数据冲突
                name: property.name,
                location: property.location,
                price: marketValue, // 总市值
                yield: properties.yield || 0,
                image: metadata.image || '',
                type: properties.type || '商业地产',
                region: properties.region || '其他',
                tags: ['链上资产'],
                minInvestment: properties.minInvestment || 1000,
                totalUnits: Number(property.maxSupply),
                soldUnits: Number(property.totalSupply),
                description: metadata.description || '',
              };
              
              return asset;
            } catch (error) {
              console.error(`Failed to fetch metadata for property ${property.tokenId}:`, error);
              // 即使元数据获取失败，也返回基本信息
              // 使用默认单价计算市值
              const defaultUnitPrice = 10000;
              const defaultMarketValue = property.maxSupply > BigInt(0) 
                ? defaultUnitPrice * Number(property.maxSupply) 
                : 0;
              
              return {
                id: Number(property.tokenId) + 10000,
                name: property.name,
                location: property.location,
                price: defaultMarketValue,
                yield: 0,
                image: '',
                type: '商业地产',
                region: '其他',
                tags: ['链上资产'],
                minInvestment: 1000,
                totalUnits: Number(property.maxSupply),
                soldUnits: Number(property.totalSupply),
                description: '',
              } as Asset;
            }
          })
        );

        const validAssets = assets.filter((a): a is Asset => a !== null);
        console.log('Loaded chain assets:', validAssets);
        setChainAssets(validAssets);
      } catch (error) {
        console.error('Failed to load chain assets:', error);
        setChainAssets([]);
      } finally {
        setIsLoadingMetadata(false);
      }
    };

    loadMetadata();
  }, [propertiesData, chainId, storageAddress, nextPropertyId, propertyIds]);

  const isLoading = isLoadingCount || isLoadingProperties || isLoadingMetadata;

  return {
    chainAssets,
    isLoading,
    count: propertyIds.length,
  };
}

