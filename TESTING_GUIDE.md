# 🧪 收益分配系统测试指南

本指南将帮助你测试完整的收益分配系统。

## 📋 前置条件

1. ✅ 已编译智能合约（`npx hardhat compile`）
2. ✅ 已安装所有依赖
3. ✅ 已配置 Pinata IPFS（`.env.local` 文件）

## 🚀 测试步骤

### 步骤 1：启动 Hardhat 本地节点

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

### 步骤 2：部署智能合约

打开**第二个终端窗口**，进入 Hardhat 目录：

```bash
cd src/hardhat
```

执行部署脚本：

```bash
npx hardhat run script/deploy.ts --network localhost
```

npm run dev

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

### 步骤 3：更新前端合约地址

打开 `src/contracts/addresses.ts`，更新 `localhost` 配置：

```typescript
export const contracts = {
  localhost: {
    myToken: "0x...", // 从部署输出复制
    realEstateStorage: "0x...", // 从部署输出复制
    realEstateLogic: "0x...", // 从部署输出复制
    testToken: "0x...", // 从部署输出复制 TestToken 地址
  },
} as const;
```

### 步骤 4：配置 MetaMask

1. 打开 MetaMask
2. 点击网络下拉菜单 → "添加网络"
3. 填写以下信息：
   - **网络名称**: Hardhat Local
   - **RPC URL**: `http://127.0.0.1:8545`
   - **链 ID**: `31337`
   - **货币符号**: `ETH`
   - **区块浏览器 URL**: （留空）

4. 导入测试账户：
   - 在步骤 1 的终端中找到第一个账户的私钥（Account #0）
   - 在 MetaMask 中点击账户图标 → "导入账户"
   - 粘贴私钥并导入

### 步骤 5：启动前端

打开**第三个终端窗口**，在项目根目录：

```bash
npm run dev
```

访问 `http://localhost:3000`

### 步骤 6：测试收益分配功能

#### 6.1 创建房产（发布者）

1. 连接 MetaMask（使用步骤 4 导入的账户）
2. 访问 `/roles` 页面
3. 如果你是管理员，先添加发布者角色：
   - 在"添加发布者"输入框中输入你的地址
   - 点击"添加发布者"
4. 创建房产：
   - 填写房产信息（名称、位置、类型等）
   - **重要**：填写"单价 (USD)"，例如：`10000`
   - 填写"年化收益率 (%)"，例如：`8.5`
   - 填写"最大供应量"，例如：`1000`
   - 上传房产图片
   - 点击"创建房产"
   - 等待交易确认

#### 6.2 设置链上金融参数

1. 在"我的房产列表"中找到刚创建的房产
2. 点击"设置参数"按钮
3. 填写：
   - **链上单价 (USD)**: `10000`（注意：这是 wei 单位，但前端会自动转换）
   - **链上年化收益率 (%)**: `8.5`
4. 点击"更新链上参数"
5. 等待交易确认

#### 6.3 铸造份额

1. 在房产卡片中点击"铸造份额"
2. 填写：
   - **接收地址**: 你的地址（或另一个测试地址）
   - **数量**: `100`（例如）
3. 查看"预计总价值"和"预计年化收益"
4. 点击"铸造份额"
5. 等待交易确认

**提示**：可以铸造给多个地址，模拟多个投资者。

#### 6.4 充值收益（发布者）

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

#### 6.5 提取收益（持有者）

1. 确保你持有该房产的份额（通过步骤 6.3）
2. 在房产卡片中点击"💰 收益管理"
3. 查看"收益池信息"卡片：
   - "收益池总额"应该显示充值的金额
   - "你可提取"应该显示根据你持有的份额计算出的可提取金额
4. 点击"提取收益"按钮
5. 等待交易确认
6. 检查你的 TUSDC 余额是否增加

### 步骤 7：验证收益分配

#### 验证场景 1：单个持有者

1. 创建房产，设置单价和年化收益
2. 铸造 100 个份额给地址 A
3. 充值 1000 TUSDC 到收益池
4. 地址 A 应该可以提取 1000 TUSDC（100% 份额）

#### 验证场景 2：多个持有者

1. 创建房产，设置单价和年化收益
2. 铸造 60 个份额给地址 A
3. 铸造 40 个份额给地址 B
4. 充值 1000 TUSDC 到收益池
5. 地址 A 应该可以提取 600 TUSDC（60% 份额）
6. 地址 B 应该可以提取 400 TUSDC（40% 份额）

#### 验证场景 3：多次充值

1. 创建房产，铸造份额
2. 第一次充值 500 TUSDC
3. 持有者提取部分收益
4. 第二次充值 500 TUSDC
5. 持有者应该可以提取剩余收益

## 🐛 常见问题排查

### 问题 1：部署失败 - "could not detect network"

**原因**：Hardhat 节点未启动或连接失败

**解决**：
1. 确保步骤 1 中的 `hardhat node` 正在运行
2. 检查端口 8545 是否被占用
3. 重新启动 Hardhat 节点

### 问题 2：前端无法连接钱包

**原因**：MetaMask 未正确配置本地网络

**解决**：
1. 确认 MetaMask 已添加 Hardhat Local 网络
2. 确认 Chain ID 为 `31337`
3. 确认 RPC URL 为 `http://127.0.0.1:8545`

### 问题 3：充值收益失败 - "insufficient allowance"

**原因**：未授权足够的代币额度

**解决**：
- 前端会自动处理授权，如果失败，请检查：
  1. 账户是否有足够的 TUSDC
  2. 是否已授权 RealEstateLogic 合约

### 问题 4：提取收益失败 - "no claimable reward"

**原因**：没有可提取的收益或份额为 0

**解决**：
1. 确认你持有该房产的份额
2. 确认收益池中有足够的资金
3. 确认你还没有提取完所有收益

### 问题 5：收益池显示为 0

**原因**：数据未刷新或查询失败

**解决**：
1. 刷新页面
2. 检查浏览器控制台是否有错误
3. 确认合约地址配置正确

## 📊 测试检查清单

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

## 🎉 测试完成

如果所有步骤都成功，恭喜！收益分配系统已正常工作。

**下一步**：
- 可以尝试更复杂的场景（多个房产、多个持有者）
- 可以测试边界情况（空收益池、零份额等）
- 可以优化 UI/UX
- 可以添加更多功能（收益历史记录、自动分配等）

