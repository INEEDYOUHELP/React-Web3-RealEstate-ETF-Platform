# IPFS/Pinata 使用示例

本文档展示如何在实际项目中使用 IPFS 和 Pinata 服务来创建房地产资产。

## 完整示例：创建房产表单组件

```typescript
'use client';

import { useState } from 'react';
import { useIPFS } from '@/hooks/useIPFS';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { contracts } from '@/contracts/addresses';
import { realEstateLogicAbi } from '@/contracts/abis';
import type { PropertyMetadataInput } from '@/services/ipfs/metadata';

export default function CreatePropertyForm() {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    location: '',
    type: '',
    region: '',
    price: 0,
    yield: 0,
    maxSupply: 0,
    imageFile: null as File | null,
  });

  const { uploadMetadata, isUploading: isUploadingIPFS, error: ipfsError } = useIPFS();
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData({ ...formData, imageFile: file });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.imageFile) {
      alert('请选择房产图片');
      return;
    }

    try {
      // 步骤 1: 上传元数据到 IPFS
      const metadataInput: PropertyMetadataInput = {
        name: formData.name,
        description: formData.description,
        image: formData.imageFile,
        location: formData.location,
        type: formData.type,
        region: formData.region,
        price: formData.price,
        yield: formData.yield,
      };

      const metadataURI = await uploadMetadata(metadataInput);
      console.log('元数据已上传到 IPFS:', metadataURI);

      // 步骤 2: 调用智能合约创建房产
      const addresses = contracts.localhost; // 根据实际网络选择
      await writeContract({
        address: addresses.realEstateLogic,
        abi: realEstateLogicAbi,
        functionName: 'createProperty',
        args: [
          formData.name,
          formData.location,
          metadataURI,
          BigInt(formData.maxSupply),
        ],
      });
    } catch (error) {
      console.error('创建房产失败:', error);
      alert('创建失败: ' + (error instanceof Error ? error.message : '未知错误'));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="create-property-form">
      <h2>创建新房产</h2>

      <div>
        <label>房产名称 *</label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />
      </div>

      <div>
        <label>描述 *</label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          required
        />
      </div>

      <div>
        <label>位置 *</label>
        <input
          type="text"
          value={formData.location}
          onChange={(e) => setFormData({ ...formData, location: e.target.value })}
          required
        />
      </div>

      <div>
        <label>类型</label>
        <input
          type="text"
          value={formData.type}
          onChange={(e) => setFormData({ ...formData, type: e.target.value })}
        />
      </div>

      <div>
        <label>地区</label>
        <input
          type="text"
          value={formData.region}
          onChange={(e) => setFormData({ ...formData, region: e.target.value })}
        />
      </div>

      <div>
        <label>价格</label>
        <input
          type="number"
          value={formData.price}
          onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
        />
      </div>

      <div>
        <label>年化收益率 (%)</label>
        <input
          type="number"
          value={formData.yield}
          onChange={(e) => setFormData({ ...formData, yield: Number(e.target.value) })}
        />
      </div>

      <div>
        <label>最大供应量 *</label>
        <input
          type="number"
          value={formData.maxSupply}
          onChange={(e) => setFormData({ ...formData, maxSupply: Number(e.target.value) })}
          required
        />
      </div>

      <div>
        <label>房产图片 *</label>
        <input type="file" accept="image/*" onChange={handleImageChange} required />
        {formData.imageFile && (
          <img
            src={URL.createObjectURL(formData.imageFile)}
            alt="预览"
            style={{ maxWidth: '200px', marginTop: '10px' }}
          />
        )}
      </div>

      {ipfsError && <div className="error">IPFS 错误: {ipfsError}</div>}

      <button
        type="submit"
        disabled={isUploadingIPFS || isPending || isConfirming}
      >
        {isUploadingIPFS
          ? '上传中...'
          : isPending || isConfirming
          ? '处理中...'
          : isSuccess
          ? '创建成功！'
          : '创建房产'}
      </button>

      {isSuccess && (
        <div className="success">
          房产创建成功！交易哈希: {hash}
        </div>
      )}
    </form>
  );
}
```

## 简化示例：仅上传元数据

```typescript
import { useIPFS } from '@/hooks/useIPFS';

function SimpleUpload() {
  const { uploadMetadata, isUploading, error } = useIPFS();

  const handleUpload = async () => {
    try {
      const metadataURI = await uploadMetadata({
        name: '曼哈顿写字楼',
        description: '位于纽约曼哈顿核心区域的优质写字楼',
        image: imageFile, // File 对象
        location: 'New York, USA',
        type: '写字楼',
        region: '北美',
        price: 5000,
        yield: 8.5,
      });

      console.log('元数据 URI:', metadataURI);
      // 使用 metadataURI 调用合约...
    } catch (err) {
      console.error('上传失败:', err);
    }
  };

  return (
    <button onClick={handleUpload} disabled={isUploading}>
      {isUploading ? '上传中...' : '上传元数据'}
    </button>
  );
}
```

## 从 IPFS 获取元数据

```typescript
import { useIPFS } from '@/hooks/useIPFS';

function PropertyViewer({ metadataURI }: { metadataURI: string }) {
  const { fetchMetadata, error } = useIPFS();
  const [metadata, setMetadata] = useState(null);

  useEffect(() => {
    if (metadataURI) {
      fetchMetadata(metadataURI)
        .then(setMetadata)
        .catch(console.error);
    }
  }, [metadataURI, fetchMetadata]);

  if (error) return <div>错误: {error}</div>;
  if (!metadata) return <div>加载中...</div>;

  return (
    <div>
      <h3>{metadata.name}</h3>
      <p>{metadata.description}</p>
      <img src={metadata.image} alt={metadata.name} />
      {/* 显示其他属性... */}
    </div>
  );
}
```

## 注意事项

1. **环境变量配置**：确保 `.env.local` 中已配置 Pinata API 凭证
2. **文件大小限制**：注意 Pinata 免费计划的文件大小限制
3. **错误处理**：始终处理上传和合约调用可能出现的错误
4. **用户体验**：显示上传进度和状态反馈
5. **网络选择**：根据当前连接的网络选择合适的合约地址

