'use client';

import { useState, useCallback } from 'react';
import {
  uploadImageToIPFS,
  uploadPropertyMetadata,
  fetchMetadataFromIPFS,
  type PropertyMetadataInput,
  type ERC1155Metadata,
} from '../services/ipfs/metadata';
import { isPinataConfigured } from '../services/ipfs/pinata';

export interface UseIPFSReturn {
  // 状态
  isUploading: boolean;
  error: string | null;
  isConfigured: boolean;

  // 方法
  uploadImage: (file: File | Blob, propertyName: string) => Promise<string>;
  uploadMetadata: (input: PropertyMetadataInput) => Promise<string>;
  fetchMetadata: (metadataURI: string) => Promise<ERC1155Metadata>;
  clearError: () => void;
}

/**
 * IPFS 上传和获取的 React Hook
 * 封装了图片上传、元数据上传和获取功能
 */
export function useIPFS(): UseIPFSReturn {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isConfigured = isPinataConfigured();

  const uploadImage = useCallback(
    async (file: File | Blob, propertyName: string): Promise<string> => {
      if (!isConfigured) {
        const err = 'Pinata 未配置。请在 .env.local 中设置 NEXT_PUBLIC_PINATA_API_KEY 和 NEXT_PUBLIC_PINATA_SECRET_KEY';
        setError(err);
        throw new Error(err);
      }

      setIsUploading(true);
      setError(null);

      try {
        const imageUrl = await uploadImageToIPFS(file, propertyName);
        return imageUrl;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : '上传图片失败';
        setError(errorMessage);
        throw err;
      } finally {
        setIsUploading(false);
      }
    },
    [isConfigured]
  );

  const uploadMetadata = useCallback(
    async (input: PropertyMetadataInput): Promise<string> => {
      if (!isConfigured) {
        const err = 'Pinata 未配置。请在 .env.local 中设置 NEXT_PUBLIC_PINATA_API_KEY 和 NEXT_PUBLIC_PINATA_SECRET_KEY';
        setError(err);
        throw new Error(err);
      }

      setIsUploading(true);
      setError(null);

      try {
        const metadataURI = await uploadPropertyMetadata(input);
        return metadataURI;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : '上传元数据失败';
        setError(errorMessage);
        throw err;
      } finally {
        setIsUploading(false);
      }
    },
    [isConfigured]
  );

  const fetchMetadata = useCallback(
    async (metadataURI: string): Promise<ERC1155Metadata> => {
      setError(null);

      try {
        const metadata = await fetchMetadataFromIPFS(metadataURI);
        return metadata;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : '获取元数据失败';
        setError(errorMessage);
        throw err;
      }
    },
    []
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    isUploading,
    error,
    isConfigured,
    uploadImage,
    uploadMetadata,
    fetchMetadata,
    clearError,
  };
}

