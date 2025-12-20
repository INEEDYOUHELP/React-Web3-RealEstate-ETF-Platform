/**
 * Pinata IPFS 服务封装
 * 用于上传文件、JSON 数据到 IPFS 网络
 */

const PINATA_API_URL = 'https://api.pinata.cloud';
const PINATA_GATEWAY = process.env.NEXT_PUBLIC_PINATA_GATEWAY || 'https://gateway.pinata.cloud/ipfs/';

export interface PinataResponse {
  IpfsHash: string;
  PinSize: number;
  Timestamp: string;
}

export interface PinataMetadata {
  name?: string;
  keyvalues?: Record<string, string | number>;
}

/**
 * 上传文件到 Pinata IPFS
 * @param file 要上传的文件（File 对象或 Blob）
 * @param fileName 文件名
 * @param metadata 可选的元数据
 * @returns IPFS CID (Hash)
 */
export async function uploadFileToPinata(
  file: File | Blob,
  fileName: string,
  metadata?: PinataMetadata
): Promise<string> {
  const apiKey = process.env.NEXT_PUBLIC_PINATA_API_KEY;
  const apiSecret = process.env.NEXT_PUBLIC_PINATA_SECRET_KEY;

  if (!apiKey || !apiSecret) {
    throw new Error('Pinata API credentials not configured. Please set NEXT_PUBLIC_PINATA_API_KEY and NEXT_PUBLIC_PINATA_SECRET_KEY in your .env.local file.');
  }

  const formData = new FormData();
  formData.append('file', file, fileName);

  if (metadata) {
    formData.append('pinataMetadata', JSON.stringify(metadata));
  }

  // 设置选项：不自动固定到 IPFS（如果需要的话可以调整）
  const options = JSON.stringify({
    cidVersion: 0,
  });
  formData.append('pinataOptions', options);

  try {
    const response = await fetch(`${PINATA_API_URL}/pinning/pinFileToIPFS`, {
      method: 'POST',
      headers: {
        pinata_api_key: apiKey,
        pinata_secret_api_key: apiSecret,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `Pinata upload failed: ${response.status} ${response.statusText}. ${JSON.stringify(errorData)}`
      );
    }

    const data: PinataResponse = await response.json();
    return data.IpfsHash;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to upload file to Pinata');
  }
}

/**
 * 上传 JSON 数据到 Pinata IPFS
 * @param jsonData 要上传的 JSON 对象
 * @param metadata 可选的元数据
 * @returns IPFS CID (Hash)
 */
export async function uploadJSONToPinata(
  jsonData: Record<string, any>,
  metadata?: PinataMetadata
): Promise<string> {
  const apiKey = process.env.NEXT_PUBLIC_PINATA_API_KEY;
  const apiSecret = process.env.NEXT_PUBLIC_PINATA_SECRET_KEY;

  if (!apiKey || !apiSecret) {
    throw new Error('Pinata API credentials not configured. Please set NEXT_PUBLIC_PINATA_API_KEY and NEXT_PUBLIC_PINATA_SECRET_KEY in your .env.local file.');
  }

  const body: any = {
    pinataContent: jsonData,
  };

  if (metadata) {
    body.pinataMetadata = metadata;
  }

  const options = {
    cidVersion: 0,
  };
  body.pinataOptions = options;

  try {
    const response = await fetch(`${PINATA_API_URL}/pinning/pinJSONToIPFS`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        pinata_api_key: apiKey,
        pinata_secret_api_key: apiSecret,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `Pinata upload failed: ${response.status} ${response.statusText}. ${JSON.stringify(errorData)}`
      );
    }

    const data: PinataResponse = await response.json();
    return data.IpfsHash;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to upload JSON to Pinata');
  }
}

/**
 * 根据 IPFS CID 获取完整的 IPFS URL
 * @param cid IPFS Content Identifier
 * @returns 完整的 IPFS URL
 */
export function getIPFSUrl(cid: string): string {
  // 移除可能的 ipfs:// 前缀
  const cleanCid = cid.replace(/^ipfs:\/\//, '');
  return `${PINATA_GATEWAY}${cleanCid}`;
}

/**
 * 验证 Pinata 配置是否完整
 * @returns 配置是否有效
 */
export function isPinataConfigured(): boolean {
  const apiKey = process.env.NEXT_PUBLIC_PINATA_API_KEY;
  const secretKey = process.env.NEXT_PUBLIC_PINATA_SECRET_KEY;
  
  // 调试信息（仅在开发环境）
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    console.log('Pinata 配置检查:', {
      hasApiKey: !!apiKey,
      hasSecretKey: !!secretKey,
      apiKeyLength: apiKey?.length || 0,
      secretKeyLength: secretKey?.length || 0,
    });
  }
  
  return !!(apiKey && secretKey);
}

