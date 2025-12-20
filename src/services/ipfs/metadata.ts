/**
 * IPFS 元数据处理
 * 用于生成符合 ERC1155 标准的元数据 JSON，并上传到 IPFS
 */

import { uploadFileToPinata, uploadJSONToPinata, getIPFSUrl } from './pinata';

/**
 * ERC1155 元数据标准格式
 * 参考: https://eips.ethereum.org/EIPS/eip-1155#metadata
 */
export interface ERC1155Metadata {
  name: string;
  description: string;
  image: string; // IPFS URL
  external_url?: string;
  attributes?: Array<{
    trait_type: string;
    value: string | number;
  }>;
  properties?: {
    [key: string]: any;
  };
}

/**
 * 房地产资产元数据输入
 */
export interface PropertyMetadataInput {
  name: string;
  description: string;
  image: File | Blob | string; // 可以是文件对象或已上传的 IPFS URL
  location: string;
  type?: string;
  region?: string;
  price?: number; // 总市值（保留向后兼容）
  unitPrice?: number; // 单价（每个份额的价格，推荐使用）
  yield?: number;
  minInvestment?: number;
  totalUnits?: number;
  tags?: string[];
  externalUrl?: string;
}

/**
 * 上传图片到 IPFS
 * @param imageFile 图片文件
 * @param propertyName 房产名称（用于元数据）
 * @returns IPFS URL
 */
export async function uploadImageToIPFS(
  imageFile: File | Blob,
  propertyName: string
): Promise<string> {
  const fileName = `${propertyName.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.${imageFile instanceof File ? imageFile.name.split('.').pop() : 'png'}`;
  
  const cid = await uploadFileToPinata(imageFile, fileName, {
    name: `Property Image: ${propertyName}`,
  });

  return getIPFSUrl(cid);
}

/**
 * 生成并上传房地产资产元数据到 IPFS
 * @param input 元数据输入
 * @returns IPFS URL (metadataURI)
 */
export async function uploadPropertyMetadata(
  input: PropertyMetadataInput
): Promise<string> {
  let imageUrl: string;

  // 如果 image 是文件，先上传图片
  if (input.image instanceof File || input.image instanceof Blob) {
    imageUrl = await uploadImageToIPFS(input.image, input.name);
  } else {
    // 如果已经是 URL，直接使用
    imageUrl = input.image;
  }

  // 构建符合 ERC1155 标准的元数据
  const metadata: ERC1155Metadata = {
    name: input.name,
    description: input.description,
    image: imageUrl,
    external_url: input.externalUrl,
    attributes: [
      {
        trait_type: 'Location',
        value: input.location,
      },
      ...(input.type
        ? [
            {
              trait_type: 'Type',
              value: input.type,
            },
          ]
        : []),
      ...(input.region
        ? [
            {
              trait_type: 'Region',
              value: input.region,
            },
          ]
        : []),
      ...(input.price
        ? [
            {
              trait_type: 'Total Market Value',
              value: input.price,
            },
          ]
        : []),
      ...(input.unitPrice
        ? [
            {
              trait_type: 'Unit Price',
              value: input.unitPrice,
            },
          ]
        : []),
      ...(input.yield
        ? [
            {
              trait_type: 'Annual Yield',
              value: `${input.yield}%`,
            },
          ]
        : []),
    ],
    properties: {
      location: input.location,
      ...(input.type && { type: input.type }),
      ...(input.region && { region: input.region }),
      ...(input.price && { price: input.price }), // 总市值（向后兼容）
      ...(input.unitPrice && { unitPrice: input.unitPrice }), // 单价
      ...(input.yield && { yield: input.yield }),
      ...(input.minInvestment && { minInvestment: input.minInvestment }),
      ...(input.totalUnits && { totalUnits: input.totalUnits }),
      ...(input.tags && { tags: input.tags }),
    },
  };

  // 上传元数据 JSON 到 IPFS
  const cid = await uploadJSONToPinata(metadata, {
    name: `Property Metadata: ${input.name}`,
    keyvalues: {
      propertyName: input.name,
      location: input.location,
      ...(input.type && { type: input.type }),
    },
  });

  return getIPFSUrl(cid);
}

/**
 * 从 IPFS URL 获取元数据
 * @param metadataURI IPFS URL
 * @returns 元数据对象
 */
export async function fetchMetadataFromIPFS(
  metadataURI: string
): Promise<ERC1155Metadata> {
  try {
    // 确保 URL 格式正确
    const url = metadataURI.startsWith('ipfs://')
      ? metadataURI.replace('ipfs://', 'https://gateway.pinata.cloud/ipfs/')
      : metadataURI;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch metadata: ${response.status} ${response.statusText}`);
    }

    const metadata: ERC1155Metadata = await response.json();
    return metadata;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to fetch metadata from IPFS: ${error.message}`);
    }
    throw new Error('Failed to fetch metadata from IPFS');
  }
}

