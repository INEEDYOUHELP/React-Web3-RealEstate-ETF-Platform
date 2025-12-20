# IPFS/Pinata 集成设置说明

## 步骤 1: 配置前端环境变量

由于 `.env.local` 文件被 gitignore 保护，需要手动在**项目根目录**创建 `.env.local` 文件：

```bash
# 在项目根目录创建 .env.local 文件
# 内容如下：

NEXT_PUBLIC_PINATA_API_KEY=9efa6ccb04a87a5f9994
NEXT_PUBLIC_PINATA_SECRET_KEY=0a7ec948e107c32b00172818fa386708eddd92d967d3ef6f2cf1e30283022cc1
NEXT_PUBLIC_PINATA_GATEWAY=https://gateway.pinata.cloud/ipfs/
```

**注意**：这些值已经从 `src/hardhat/.env` 中读取，请确保它们是正确的。

## 步骤 2: 重新部署合约

由于合约结构已更改（添加了 `metadataURI` 字段），需要重新部署合约：

### 2.1 启动本地 Hardhat 节点

打开第一个终端窗口：

```bash
cd src/hardhat
npx hardhat node
```

**保持此终端运行**，不要关闭。

### 2.2 编译合约

打开第二个终端窗口：

```bash
cd src/hardhat
npx hardhat compile
```

### 2.3 部署合约

在同一个终端（步骤 2.2 的终端）：

```bash
npx hardhat run script/deploy.ts --network localhost
```

### 2.4 更新合约地址

部署完成后，复制输出的合约地址，更新 `src/contracts/addresses.ts`：

```typescript
export const contracts = {
  localhost: {
    myToken: "0x...",           // 替换为新的 MyToken Proxy 地址
    realEstateStorage: "0x...", // 替换为新的 RealEstateStorage Proxy 地址
    realEstateLogic: "0x...",   // 替换为新的 RealEstateLogic Proxy 地址
  },
}
```

## 步骤 3: 使用创建房产功能

1. **启动前端应用**：

```bash
npm run dev
```

2. **连接钱包**：
   - 打开浏览器访问 `http://localhost:3000`
   - 点击"连接钱包"
   - 确保 MetaMask 连接到 Hardhat Local 网络（Chain ID: 31337）

3. **获取发布者权限**：
   - 访问 `/roles` 页面
   - 如果你是管理员，可以添加发布者地址
   - 或者使用管理员账户直接创建房产

4. **创建房产**：
   - 在 `/roles` 页面的"发布者专区"
   - 填写房产信息（名称、描述、位置等）
   - 上传房产图片
   - 点击"创建房产"
   - 系统会自动：
     - 上传图片到 IPFS
     - 生成元数据 JSON
     - 上传元数据到 IPFS
     - 调用智能合约创建房产记录

## 功能说明

### 创建房产流程

1. **上传图片** → IPFS 返回图片 URL
2. **生成元数据** → 包含图片 URL 和所有房产信息
3. **上传元数据** → IPFS 返回 metadataURI
4. **调用合约** → `RealEstateLogic.createProperty(name, location, metadataURI, maxSupply)`

### 元数据格式

生成的元数据符合 ERC1155 标准，包含：
- `name`: 房产名称
- `description`: 详细描述
- `image`: IPFS 图片 URL
- `attributes`: 位置、类型、地区、价格、收益率等
- `properties`: 扩展属性

## 故障排查

### 问题 1: Pinata 上传失败

- 检查 `.env.local` 文件是否存在且配置正确
- 确认 Pinata API Key 和 Secret Key 有效
- 检查网络连接

### 问题 2: 合约调用失败

- 确认合约已重新部署
- 检查 `src/contracts/addresses.ts` 中的地址是否正确
- 确认当前账户有 PUBLISHER_ROLE 权限
- 检查 MetaMask 是否连接到正确的网络

### 问题 3: 交易失败

- 确认 Hardhat 本地节点正在运行
- 检查账户余额（本地网络默认有 10000 ETH）
- 查看浏览器控制台和 Hardhat 节点终端的错误信息

## 下一步

创建房产后，你可以：
- 在 `/assets` 页面查看所有资产
- 使用 `mintShares` 函数为房产铸造份额
- 在 `/trading` 页面进行交易

