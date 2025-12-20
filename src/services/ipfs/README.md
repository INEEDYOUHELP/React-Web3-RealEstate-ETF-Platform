# IPFS / Pinata 服务

本目录包含与 IPFS 和 Pinata 集成的服务代码，用于上传和管理房地产资产的元数据。

## 文件说明

- `pinata.ts` - Pinata API 客户端封装，提供文件上传、JSON 上传等功能
- `metadata.ts` - 元数据处理，生成符合 ERC1155 标准的元数据并上传到 IPFS

## 配置

在项目根目录的 `.env.local` 文件中添加以下环境变量：

```bash
NEXT_PUBLIC_PINATA_API_KEY=your_api_key
NEXT_PUBLIC_PINATA_SECRET_KEY=your_secret_key
NEXT_PUBLIC_PINATA_GATEWAY=https://gateway.pinata.cloud/ipfs/
```

### 获取 Pinata API 凭证

1. 访问 [Pinata](https://app.pinata.cloud/)
2. 注册/登录账户
3. 进入 API Keys 页面
4. 创建新的 API Key
5. 复制 `API Key` 和 `Secret Key` 到环境变量

## 使用方法

### 在 React 组件中使用

```typescript
import { useIPFS } from '@/hooks/useIPFS';

function CreatePropertyForm() {
  const { uploadMetadata, isUploading, error } = useIPFS();

  const handleSubmit = async (formData: PropertyMetadataInput) => {
    try {
      // 上传元数据到 IPFS，返回 metadataURI
      const metadataURI = await uploadMetadata({
        name: formData.name,
        description: formData.description,
        image: formData.imageFile, // File 对象
        location: formData.location,
        type: formData.type,
        region: formData.region,
        price: formData.price,
        yield: formData.yield,
      });

      // 调用智能合约创建房产
      // await contract.createProperty(name, location, metadataURI, maxSupply);
    } catch (err) {
      console.error('上传失败:', err);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* 表单内容 */}
      {isUploading && <p>上传中...</p>}
      {error && <p>错误: {error}</p>}
    </form>
  );
}
```

### 直接使用服务函数

```typescript
import { uploadPropertyMetadata } from '@/services/ipfs/metadata';
import { getIPFSUrl } from '@/services/ipfs/pinata';

// 上传元数据
const metadataURI = await uploadPropertyMetadata({
  name: '曼哈顿写字楼',
  description: '位于纽约曼哈顿核心区域的优质写字楼',
  image: imageFile, // File 对象
  location: 'New York, USA',
  type: '写字楼',
  region: '北美',
  price: 5000,
  yield: 8.5,
});

// metadataURI 格式: https://gateway.pinata.cloud/ipfs/Qm...
```

## 工作流程

1. **上传图片** - 用户选择房产图片，自动上传到 IPFS
2. **生成元数据** - 根据用户输入生成符合 ERC1155 标准的 JSON 元数据
3. **上传元数据** - 将元数据 JSON 上传到 IPFS，获得 metadataURI
4. **调用合约** - 使用 metadataURI 调用 `RealEstateLogic.createProperty()`

## 元数据格式

生成的元数据符合 [ERC1155 Metadata URI](https://eips.ethereum.org/EIPS/eip-1155#metadata) 标准：

```json
{
  "name": "房产名称",
  "description": "详细描述",
  "image": "https://gateway.pinata.cloud/ipfs/Qm...",
  "external_url": "https://example.com",
  "attributes": [
    {
      "trait_type": "Location",
      "value": "New York, USA"
    },
    {
      "trait_type": "Type",
      "value": "写字楼"
    }
  ],
  "properties": {
    "location": "New York, USA",
    "type": "写字楼",
    "price": 5000,
    "yield": 8.5
  }
}
```

## 注意事项

- 确保 Pinata API 凭证已正确配置
- 上传的文件大小受 Pinata 免费计划限制（通常为 1GB）
- IPFS 内容一旦上传就无法修改，请确保数据正确
- 建议在生产环境中使用自定义 IPFS 网关以提高性能

