'use client';

import { useReadContract, useReadContracts } from 'wagmi';
import { useChainId, useAccount } from 'wagmi';
import { contracts } from '../contracts/addresses';
import { realEstateStorageAbi } from '../contracts/abis';
import { useMemo, useState, useEffect } from 'react';
import { fetchMetadataFromIPFS, type ERC1155Metadata } from '../services/ipfs/metadata';

export interface PublisherProperty {
  propertyId: bigint;
  name: string;
  location: string;
  metadataURI: string;
  tokenId: bigint;
  publisher: string;
  totalSupply: bigint;
  maxSupply: bigint;
  active: boolean;
  unitPriceWei: bigint;
  annualYieldBps: bigint;
  lastYieldTimestamp: bigint;
  // IPFS 元数据（异步加载）
  ipfsMetadata?: ERC1155Metadata;
  unitPriceUSD?: number; // 从 IPFS 获取的单价（USD）
  yieldPercent?: number; // 从 IPFS 获取的年化收益率（%）
}

export function usePublisherProperties() {
  const chainId = useChainId();
  const { address } = useAccount();
  
  // 获取合约地址
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

  // 生成所有 propertyId 的数组
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
    query: { enabled: contractsConfig.length > 0 && !!address },
  });

  // 处理房产数据，只返回当前发布者的房产
  const properties = useMemo(() => {
    if (!propertiesData || !address) return [];

    const publisherProperties: PublisherProperty[] = [];

    propertiesData.forEach((item, index) => {
      if (!item || item.status !== 'success') return;

      const resultObj = (item as any).result;
      if (!resultObj || resultObj.error) return;

      const propertyData = resultObj.data || resultObj;
      if (!propertyData) return;

      const property = propertyData as any;

      // 只返回当前地址是发布者的房产
      if (property.publisher && property.publisher.toLowerCase() === address.toLowerCase()) {
        publisherProperties.push({
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
      }
    });

    return publisherProperties;
  }, [propertiesData, address, propertyIds]);

  // 加载 IPFS 元数据
  const [propertiesWithMetadata, setPropertiesWithMetadata] = useState<PublisherProperty[]>([]);
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(false);

  useEffect(() => {
    if (properties.length === 0) {
      setPropertiesWithMetadata([]);
      return;
    }

    const loadMetadata = async () => {
      setIsLoadingMetadata(true);
      try {
        const propertiesWithMeta = await Promise.all(
          properties.map(async (property) => {
            try {
              const metadata = await fetchMetadataFromIPFS(property.metadataURI);
              const properties_data = metadata.properties || {};
              
              // 从 IPFS 元数据中提取单价和收益率
              const unitPriceUSD = properties_data.unitPrice || (properties_data.price && property.maxSupply > 0n 
                ? Number(properties_data.price) / Number(property.maxSupply) 
                : undefined);
              const yieldPercent = properties_data.yield;

              return {
                ...property,
                ipfsMetadata: metadata,
                unitPriceUSD,
                yieldPercent,
              };
            } catch (error) {
              console.error(`Failed to load metadata for property ${property.propertyId}:`, error);
              return property;
            }
          })
        );
        setPropertiesWithMetadata(propertiesWithMeta);
      } catch (error) {
        console.error('Failed to load metadata:', error);
        setPropertiesWithMetadata(properties);
      } finally {
        setIsLoadingMetadata(false);
      }
    };

    loadMetadata();
  }, [properties]);

  const isLoading = isLoadingCount || isLoadingProperties || isLoadingMetadata;

  return {
    properties: propertiesWithMetadata,
    isLoading,
    count: propertiesWithMetadata.length,
  };
}

