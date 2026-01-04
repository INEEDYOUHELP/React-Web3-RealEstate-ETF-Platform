# 🚀 完整操作指南

本指南包含项目设置、测试和故障排查的完整流程。

## 📋 目录

1. [前置条件](#前置条件)
2. [环境配置](#环境配置)
3. [智能合约部署](#智能合约部署)
4. [前端配置](#前端配置)
5. [功能测试](#功能测试)
6. [故障排查](#故障排查)

---

## 前置条件

### 系统要求

- **Node.js**: 18.x 或 20.x（**不建议使用 22，目前 Hardhat 支持度较差**）
- **npm** 或 **yarn** 或 **pnpm**
- **MetaMask** 或其他 EVM 兼容钱包（用于体验钱包连线）
- **Git**（用于克隆项目）

### 安装依赖

1. **安装 Next.js 主项目依赖**（项目根目录）：

```bash
npm install
```

2. **安装 Hardhat 子项目依赖**：

```bash
cd src/hardhat
npm install
cd ../..
```

---

## 环境配置

### 步骤 1: 配置前端环境变量

由于 `.env.local` 文件被 gitignore 保护，需要手动在**项目根目录**创建 `.env.local` 文件：

```bash
# 在项目根目录创建 .env.local 文件
# 内容如下：
NEXT_PUBLIC_PINATA_API_KEY=你的_pinata_api_key
NEXT_PUBLIC_PINATA_SECRET_KEY=你的_pinata_secret_key
NEXT_PUBLIC_PINATA_GATEWAY=https://gateway.pinata.cloud/ipfs/


```

**重要提示**：
- 文件必须在**项目根目录**，不是 `src/hardhat/.env`
- 变量名必须以 `NEXT_PUBLIC_` 开头（Next.js 要求）
- 不要有多余的空格或引号
- 这些值已经从 `src/hardhat/.env` 中读取，请确保它们是正确的

### 步骤 2: 配置 WalletConnect（可选）

如果需要使用 WalletConnect，在 `.env.local` 中添加：

```bash
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=你的_walletconnect_project_id
NEXT_PUBLIC_ENABLE_TESTNETS=true  # 若要显示 Sepolia 测试网
```

---

## 智能合约部署

### 步骤 1: 启动 Hardhat 本地节点

打开**第一个终端窗口**，进入 Hardhat 目录：

```bash
cd src/hardhat
```

启动本地节点：

```bash
npx hardhat node
```

**重要**：
- 保持此终端窗口运行
- 节点启动后会显示 20 个测试账户及其私钥
- 默认 Chain ID: `31337`
- 默认 RPC URL: `http://127.0.0.1:8545`
- 每个账户默认有 10000 ETH（测试用）

**示例输出**：
```
Started HTTP and WebSocket JSON-RPC server at http://127.0.0.1:8545/

Accounts
========
Account #0: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 (10000 ETH)
Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
...
```

### 步骤 2: 编译智能合约

打开**第二个终端窗口**，进入 Hardhat 目录：

```bash
cd src/hardhat
```

编译所有智能合约：

```bash
npx hardhat compile
```

编译成功后，你会看到类似输出：
```
Compiled 3 Solidity files successfully
```

如果遇到编译错误，请检查：
- Solidity 版本是否匹配（`hardhat.config.ts` 中设置为 `0.8.27`）
- 依赖是否正确安装（`@openzeppelin/contracts` 等）

### 步骤 3: 部署智能合约

在同一个终端（步骤 2 的终端），执行部署脚本：

```bash
npx hardhat run script/deploy.ts --network localhost
```

**注意**：必须使用 `--network localhost` 参数，这样 Hardhat 会连接到步骤 1 中启动的本地节点。

**部署成功后，你会看到类似输出：**

```
🌐 Network: localhost (Chain ID: 31337)
✅ Using Hardhat local network - perfect for development and testing!

📝 Deploying contracts with the account: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
💰 Account balance: 10000.0 ETH

📦 Step 1: Deploying MyToken as upgradeable proxy...
✅ MyToken deployed!
   Proxy address: 0x...

📦 Step 2: Deploying RealEstateStorage as upgradeable proxy...
✅ RealEstateStorage deployed!
   Proxy address: 0x...

📦 Step 3: Deploying RealEstateLogic as upgradeable proxy...
✅ RealEstateLogic deployed!
   Proxy address: 0x...

💰 Step 6: Deploying TestToken for yield distribution...
✅ TestToken deployed!
   Address: 0x...
   Deployer balance: 1000000.0 TUSDC

🔧 Step 7: Setting reward token in RealEstateLogic...
✅ Reward token set successfully!

🎉 All Contracts Deployed and Linked Successfully!

📋 Contract Addresses:
   MyToken Proxy:        0x...
   RealEstateStorage:    0x...
   RealEstateLogic:      0x...
   TestToken:            0x...
```

**请复制这些地址！**

### 步骤 4: 更新前端合约地址

打开 `src/contracts/addresses.ts`，更新 `localhost` 配置：

```typescript
export const contracts = {
  localhost: {
    myToken: "0x...",           // 从部署输出复制 MyToken Proxy 地址
    realEstateStorage: "0x...", // 从部署输出复制 RealEstateStorage Proxy 地址
    realEstateLogic: "0x...",   // 从部署输出复制 RealEstateLogic Proxy 地址
    testToken: "0x...",         // 从部署输出复制 TestToken 地址
  },
} as const;
```

**重要**：每次重新启动 `hardhat node` 后，合约地址会改变，需要重新部署合约并更新地址。

---

## 前端配置

### 步骤 1: 配置 MetaMask

1. 打开 MetaMask 浏览器扩展
2. 点击网络下拉菜单 → "添加网络" 或 "添加网络（手动）"
3. 填写以下信息：
   - **网络名称**: Hardhat Local
   - **RPC URL**: `http://127.0.0.1:8545`
   - **链 ID**: `31337`
   - **货币符号**: `ETH`
   - **区块浏览器 URL**: （留空）

4. 点击"保存"

### 步骤 2: 导入测试账户（可选）

如果你想使用部署账户进行测试：

1. 在步骤 1 的终端中找到第一个账户的私钥（Account #0）
2. 在 MetaMask 中点击账户图标 → "导入账户"
3. 粘贴私钥并导入

**安全提示**：这些私钥仅用于本地开发测试，**不要**在主网或测试网上使用这些私钥。

### 步骤 3: 启动前端应用

打开**第三个终端窗口**，在项目根目录：

```bash
npm run dev
```

前端应用将在 `http://localhost:3000` 启动。

**重要**：如果修改了 `.env.local` 文件，必须重启 Next.js 开发服务器才能加载新的环境变量。

---

## 功能测试

### 测试流程概览

1. 创建房产（发布者）
2. 设置链上金融参数
3. 铸造份额
4. 充值收益（发布者）
5. 提取收益（持有者）

### 详细测试步骤

#### 1. 创建房产（发布者）

1. **连接钱包**：
   - 打开浏览器访问 `http://localhost:3000`
   - 点击"连接钱包"
   - 确保 MetaMask 连接到 Hardhat Local 网络（Chain ID: 31337）

2. **获取发布者权限**：
   - 访问 `/roles` 页面
   - 如果你是管理员，可以添加发布者地址
   - 或者使用管理员账户直接创建房产

3. **创建房产**：
   - 在 `/roles` 页面的"发布者专区"
   - 填写房产信息：
     - 名称、描述、位置等
     - **重要**：填写"单价 (USD)"，例如：`10000`
     - 填写"年化收益率 (%)"，例如：`8.5`
     - 填写"最大供应量"，例如：`1000`
   - 上传房产图片
   - 点击"创建房产"
   - 系统会自动：
     - 上传图片到 IPFS
     - 生成元数据 JSON
     - 上传元数据到 IPFS
     - 调用智能合约创建房产记录
   - 等待交易确认

#### 2. 设置链上金融参数

1. 在"我的房产列表"中找到刚创建的房产
2. 点击"设置参数"按钮
3. 填写：
   - **链上单价 (USD)**: `10000`（注意：这是 wei 单位，但前端会自动转换）
   - **链上年化收益率 (%)**: `8.5`
4. 点击"更新链上参数"
5. 等待交易确认

#### 3. 铸造份额

1. 在房产卡片中点击"铸造份额"
2. 填写：
   - **接收地址**: 你的地址（或另一个测试地址）
   - **数量**: `100`（例如）
3. 查看"预计总价值"和"预计年化收益"
4. 点击"铸造份额"
5. 等待交易确认

**提示**：可以铸造给多个地址，模拟多个投资者。

#### 4. 充值收益（发布者）

1. 确保你的账户有足够的 TUSDC（测试代币）
   - 部署时自动给部署者铸造了 1,000,000 TUSDC
   - 如果不够，可以使用 TestToken 的 `mint` 函数给自己铸造更多

2. 在房产卡片中点击"💰 收益管理"
3. 查看"收益池信息"卡片：
   - 当前应该显示"收益池总额: 0 TUSDC"
4. 填写充值金额，例如：`1000` TUSDC
5. 点击"充值收益"
6. 等待授权和充值交易确认
7. 刷新后应该看到"收益池总额: 1000 TUSDC"

#### 5. 提取收益（持有者）

1. 确保你持有该房产的份额（通过步骤 3）
2. 在房产卡片中点击"💰 收益管理"
3. 查看"收益池信息"卡片：
   - "收益池总额"应该显示充值的金额
   - "你可提取"应该显示根据你持有的份额计算出的可提取金额
4. 点击"提取收益"按钮
5. 等待交易确认
6. 检查你的 TUSDC 余额是否增加

### 验证场景

#### 场景 1：单个持有者

1. 创建房产，设置单价和年化收益
2. 铸造 100 个份额给地址 A
3. 充值 1000 TUSDC 到收益池
4. 地址 A 应该可以提取 1000 TUSDC（100% 份额）

#### 场景 2：多个持有者

1. 创建房产，设置单价和年化收益
2. 铸造 60 个份额给地址 A
3. 铸造 40 个份额给地址 B
4. 充值 1000 TUSDC 到收益池
5. 地址 A 应该可以提取 600 TUSDC（60% 份额）
6. 地址 B 应该可以提取 400 TUSDC（40% 份额）

#### 场景 3：多次充值

1. 创建房产，铸造份额
2. 第一次充值 500 TUSDC
3. 持有者提取部分收益
4. 第二次充值 500 TUSDC
5. 持有者应该可以提取剩余收益

### 元数据格式说明

生成的元数据符合 ERC1155 标准，包含：
- `name`: 房产名称
- `description`: 详细描述
- `image`: IPFS 图片 URL
- `attributes`: 位置、类型、地区、价格、收益率等
- `properties`: 扩展属性

### 创建房产流程

1. **上传图片** → IPFS 返回图片 URL
2. **生成元数据** → 包含图片 URL 和所有房产信息
3. **上传元数据** → IPFS 返回 metadataURI
4. **调用合约** → `RealEstateLogic.createProperty(name, location, metadataURI, maxSupply)`

---

## 故障排查

### 问题 1: Pinata 未配置错误

**错误信息**：
```
IPFS 错误: Pinata 未配置。请在 .env.local 中设置 NEXT_PUBLIC_PINATA_API_KEY 和 NEXT_PUBLIC_PINATA_SECRET_KEY
```

**解决方案**：

1. **确认 `.env.local` 文件存在**：
   - 文件必须在**项目根目录**（与 `package.json` 同级）
   - 内容格式：
     ```bash
     NEXT_PUBLIC_PINATA_API_KEY=你的_pinata_api_key
     NEXT_PUBLIC_PINATA_SECRET_KEY=你的_pinata_secret_key
     NEXT_PUBLIC_PINATA_GATEWAY=https://gateway.pinata.cloud/ipfs/
     ```

2. **重启 Next.js 开发服务器**（**这是最关键的步骤！**）：
   - 停止当前的开发服务器（在运行 `npm run dev` 的终端按 `Ctrl+C`）
   - 重新启动：`npm run dev`
   - 刷新浏览器页面（按 `F5` 或 `Ctrl+R`）

3. **检查浏览器控制台**：
   - 打开浏览器开发者工具（F12）
   - 在控制台中查看是否有调试信息：
     ```
     Pinata 配置检查: {
       hasApiKey: true,
       hasSecretKey: true,
       ...
     }
     ```
   - 如果看到 `hasApiKey: false` 或 `hasSecretKey: false`，说明环境变量仍未加载

4. **验证环境变量格式**：
   - ✅ **正确格式**：
     ```bash
     NEXT_PUBLIC_PINATA_API_KEY=你的_pinata_api_key
     ```
   - ❌ **错误格式**（不要这样做）：
     ```bash
     NEXT_PUBLIC_PINATA_API_KEY="你的_pinata_api_key"  # 不要加引号
     NEXT_PUBLIC_PINATA_API_KEY = 你的_pinata_api_key  # 不要有空格
     ```

5. **清除 Next.js 缓存**（如果仍然不行）：
   ```bash
   # 停止开发服务器
   # 删除 .next 目录
   rm -rf .next
   # 或者在 Windows 上：
   rmdir /s .next
   
   # 重新启动
   npm run dev
   ```

### 问题 2: 部署失败 - "could not detect network"

**原因**：Hardhat 节点未启动或连接失败

**解决**：
1. 确保步骤 1 中的 `hardhat node` 正在运行
2. 检查端口 8545 是否被占用
3. 重新启动 Hardhat 节点
4. 确认使用了 `--network localhost` 参数

### 问题 3: 前端无法连接钱包

**原因**：MetaMask 未正确配置本地网络

**解决**：
1. 确认 MetaMask 已添加 Hardhat Local 网络
2. 确认 Chain ID 为 `31337`
3. 确认 RPC URL 为 `http://127.0.0.1:8545`
4. 检查 `hardhat node` 是否仍在运行

### 问题 4: 合约调用失败

**原因**：合约地址不匹配或权限问题

**解决**：
1. 确认合约已重新部署
2. 检查 `src/contracts/addresses.ts` 中的地址是否正确
3. 确认当前账户有 PUBLISHER_ROLE 权限
4. 检查 MetaMask 是否连接到正确的网络

### 问题 5: 交易失败

**原因**：网络问题或余额不足

**解决**：
1. 确认 Hardhat 本地节点正在运行
2. 检查账户余额（本地网络默认有 10000 ETH）
3. 查看浏览器控制台和 Hardhat 节点终端的错误信息
4. 确认 Gas 设置正确

### 问题 6: 充值收益失败 - "insufficient allowance"

**原因**：未授权足够的代币额度

**解决**：
- 前端会自动处理授权，如果失败，请检查：
  1. 账户是否有足够的 TUSDC
  2. 是否已授权 RealEstateLogic 合约
  3. 授权金额是否足够

### 问题 7: 提取收益失败 - "no claimable reward"

**原因**：没有可提取的收益或份额为 0

**解决**：
1. 确认你持有该房产的份额
2. 确认收益池中有足够的资金
3. 确认你还没有提取完所有收益

### 问题 8: 收益池显示为 0

**原因**：数据未刷新或查询失败

**解决**：
1. 刷新页面
2. 检查浏览器控制台是否有错误
3. 确认合约地址配置正确
4. 确认 TestToken 地址已更新到前端配置

### 问题 9: 合约地址不匹配

**原因**：每次重新启动 `hardhat node` 后，合约地址会改变

**解决**：
1. 每次重新启动 `hardhat node` 后，需要重新部署合约
2. 更新 `src/contracts/addresses.ts` 中的地址
3. 或者使用 `hardhat node --fork` 来保持状态（高级用法）

### 快速检查清单

- [ ] `.env.local` 文件在项目根目录
- [ ] 变量名以 `NEXT_PUBLIC_` 开头
- [ ] 没有多余的空格或引号
- [ ] 已重启 Next.js 开发服务器
- [ ] 已刷新浏览器页面
- [ ] Hardhat 节点成功启动
- [ ] 所有合约成功部署
- [ ] TestToken 地址已更新到前端配置
- [ ] MetaMask 已配置本地网络
- [ ] 浏览器控制台没有其他错误

---

## 重置本地网络

如果需要重置本地网络状态：

1. 停止 `hardhat node`（在步骤 1 的终端按 `Ctrl+C`）
2. 重新启动 `hardhat node`
3. 重新执行编译、部署、更新地址的步骤

---

## 测试检查清单

- [ ] Hardhat 节点成功启动
- [ ] 所有合约成功部署
- [ ] TestToken 地址已更新到前端配置
- [ ] MetaMask 已配置本地网络
- [ ] 成功创建房产
- [ ] 成功设置链上金融参数
- [ ] 成功铸造份额
- [ ] 成功充值收益
- [ ] 成功提取收益
- [ ] 收益分配计算正确（按份额比例）

---

## 下一步

完成所有测试后，你可以：

- 在 `/assets` 页面查看所有资产
- 使用 `mintShares` 函数为房产铸造份额
- 在 `/trading` 页面进行交易
- 尝试更复杂的场景（多个房产、多个持有者）
- 测试边界情况（空收益池、零份额等）
- 优化 UI/UX
- 添加更多功能（收益历史记录、自动分配等）

---

## 常见问题 FAQ

**Q: 我已经创建了 .env.local，为什么还是报错？**
A: 必须重启 Next.js 开发服务器才能加载新的环境变量。

**Q: 环境变量在服务端能读取，但在客户端读取不到？**
A: 确保变量名以 `NEXT_PUBLIC_` 开头，这是 Next.js 的要求。

**Q: 我修改了 .env.local，需要重启吗？**
A: 是的，每次修改 `.env.local` 后都需要重启开发服务器。

**Q: 生产环境怎么办？**
A: 在生产环境（如 Vercel、Netlify），需要在平台的环境变量设置中添加这些变量，而不是使用 `.env.local` 文件。

**Q: 如何部署到测试网或主网？**
A: 参考 README.md 中的"部署到 Sepolia 测试网"部分，需要配置相应的网络参数和私钥。

---

## 获取帮助

如果完成以上步骤后仍有问题，请检查：

1. Pinata API Key 和 Secret Key 是否有效
2. 网络连接是否正常
3. 浏览器控制台的完整错误信息
4. Hardhat 节点终端的错误信息
5. 所有依赖是否正确安装

