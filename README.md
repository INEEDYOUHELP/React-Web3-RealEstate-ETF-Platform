# 基于React与Web3的房地产平台设计与实现（毕业项目）

一个以 **「房地产平台设计与实现」** 为主题的全栈 Web3 毕业项目，整合 Next.js 应用、房地产资产管理界面，以及 Hardhat 智能合约项目（包含 ERC1155 代币与房地产逻辑合约）。

---

## 📋 项目总览

- **产品定位**：一个基于Web3技术的去中心化「房地产平台」，提供资产浏览、房产发行、收益分配与份额管理功能。
- **前端应用**：基于 Next.js App Router，提供多页面仪表板式界面（首页、资产展示、房产发行、收益分配、角色管理、转账中心）。
- **智能合约**：`src/hardhat/contracts` 中包含：
  - `MyToken.sol`：ERC1155 型态的基础代币（可升级架构）。
  - `RealEstateStorage.sol`：房地产相关的存储层。
  - `RealEstateLogic.sol`：房地产业务逻辑层（通过接口 `IMyToken` 与代币互动）。
- **Web3 / 钱包整合**：使用 RainbowKit + Wagmi + WalletConnect，支持多链（Mainnet / Polygon / Optimism / Arbitrum / Base / Localhost，并可选择启用 Sepolia 测试网）。
- **使用场景**：作为毕业专题展示 **前端 UI/UX + 数据模型 + 智能合约结构 + Web3 基础整合** 的完整范例。

---

## 🎥 项目演示视频

[![项目演示视频](https://img.youtube.com/vi/faK5KfY7MRA/maxresdefault.jpg)](https://youtu.be/faK5KfY7MRA)


**点击上方图片观看完整演示视频**

---

## 🏗️ 项目目录结构（实际）

```text
毕业项目/
├── src/
│   ├── app/                         # Next.js App Router 应用
│   │   ├── page.tsx                 # 首页（热门资产介绍）
│   │   ├── layout.tsx               # 全局 Layout（Navbar + Footer + Providers）
│   │   ├── assets/                  # 资产展示页（全球房地产资产）
│   │   ├── issuance/                # 房产发行页（创建房产、设置参数、存入保障金、结束项目）
│   │   ├── distribution/             # 收益分配页（查看收益池、充值收益、提取收益、退款）
│   │   ├── roles/                   # 角色管理页（管理发布者角色）
│   │   ├── transfer/                 # 转账中心（ERC1155 代币转账）
│   │   ├── api/                     # API 路由
│   │   │   └── kyc/                 # KYC 申请相关 API
│   │   └── components/
│   │       ├── layout/              # Navbar / Footer / Breadcrumb
│   │       ├── wallet/              # `WalletProvider`，包装 Wagmi/RainbowKit
│   │       ├── assets/             # 资产卡片、搜索、筛选、Modal 等组件
│   │       └── common/             # 通用组件（Button、Card、Loading、Modal、Notification）
│   │
│   ├── hooks/                       # 前端数据与 UI 状态 hooks
│   │   ├── useAssets.ts             # 资产搜索 / 筛选 / 收藏（localStorage）
│   │   ├── useChainAssets.ts        # 从链上获取资产数据
│   │   ├── useIPFS.ts               # IPFS 元数据上传和获取
│   │   └── usePublisherProperties.ts # 发布者房产管理
│   │
│   ├── data/                        # 假数据（Mock Data），支持整个前端展示
│   │   └── assets.ts                # 房地产资产清单（用于演示和测试）
│   │
│   ├── contracts/
│   │   ├── addresses.ts             # 前端使用的合约地址设置（localhost / sepolia 等）
│   │   └── abis.ts                  # 合约 ABI 定义（用于前端交互）
│   │
│   ├── hardhat/                     # Hardhat 智能合约子项目（独立 package.json）
│   │   ├── contracts/               # Solidity 合约
│   │   │   ├── MyToken.sol          # ERC1155 代币合约
│   │   │   ├── RealEstateStorage.sol # 房地产存储层
│   │   │   ├── RealEstateLogic.sol  # 房地产业务逻辑层
│   │   │   └── TestToken.sol        # 测试代币（用于收益分配）
│   │   ├── script/
│   │   │   └── deploy.ts            # 自定义部署脚本（部署所有合约）
│   │   └── hardhat.config.ts        # Hardhat 设置
│   │
│   ├── styles/
│   │   ├── globals.css              # 全局样式
│   │   └── components.css           # 各页与组件使用的 UI 样式
│   │
│   ├── types/
│   │   └── index.ts                 # 共用 TypeScript 类型定义
│   ├── constants/
│   │   └── assets.ts                # 资产相关常量（地区、类型、标签等）
│   ├── services/
│   │   └── ipfs/                    # IPFS/Pinata 服务集成
│   │       ├── pinata.ts            # Pinata API 客户端
│   │       └── metadata.ts          # 元数据处理和上传
│   └── lib/
│       └── db.ts                    # Prisma 数据库客户端
│   │
│   └── wagmi.ts                     # Wagmi + RainbowKit 网络与 config 设置
│
├── package.json                     # Next.js 主项目依赖
└── README.md                        # 本文件（项目总览）
```

---

## 💡 主要功能说明（前端）

### 首页（`/`）

- **产品介绍**：说明「基于React与Web3的房地产平台」定位，展示总资产价值、活跃用户数、房产项目数等指标（静态示意）。
- **特色模块**：以卡片形式说明「全球资产、安全透明、智能组合、即时交易」等卖点。
- **热门资产区块**：展示数个精选房产项目（图片 + 城市 + 年化收益 + 市值），引导前往 `资产展示` 页面。
- **钱包连线 CTA**：若尚未连线，显示 RainbowKit `ConnectButton`；已连线则引导前往 `/assets`。

### 资产展示（`/assets`）

- 使用 `useAssets` 和 `useChainAssets` 获取房地产资产清单，支持：
  - 从链上实时获取房产数据
  - 关键字搜索（名称 / 地点 / 类型 / 地区）
  - 地区筛选（例如：北美 / 欧洲 / 亚太等）
  - 类型筛选（商业地产 / 住宅地产 / 零售地产等）
  - 依年化收益或价格排序
  - **自动过滤已结束项目**：已结束的项目（`projectEndTime > 0`）不会显示在资产列表中
- 资产卡片支持 **收藏功能**：使用 localStorage 储存书签（`bookmarkedAssets`）
- 点击资产可开启 `AssetDetailModal`，显示更完整的资产信息（包括链上数据和 IPFS 元数据）

### 房产发行（`/issuance`）

- 发布者可以创建新的房地产资产并管理项目生命周期
- 主要功能：
  - **创建房产**：填写房产信息（名称、描述、位置、类型、地区、价格、收益率等）
  - **上传图片**：自动上传到 IPFS 并生成元数据
  - **设置链上参数**：设置单价（`unitPriceWei`）和年化收益率（`annualYieldBps`）
  - **存入保障金**：根据实际铸造份额（`totalSupply`）计算所需保障金，发布者需在项目结束前存入足够的收益代币到收益池
  - **结束项目**：项目结束前会检查保障金是否充足，只有保障金充足才能结束项目
- 使用 `useIPFS` hook 处理 IPFS 上传
- 使用 `usePublisherProperties` hook 管理发布者的房产列表
- **保障金机制**：保障金金额 = `totalSupply × unitPriceWei × annualYieldBps / 10000`，确保发布者有足够资金支付投资者的年化收益

### 收益分配（`/distribution`）

- 管理房地产资产的收益分配系统和退款功能
- 主要功能：
  - **查看收益池信息**：
    - 持有份额（`userShares`）
    - 预计年化收益（`estimatedAnnualYield`）
    - 收益池份额百分比（`poolSharePercent`）
    - 年化收益率（`annualYieldBps`）
    - 已提取收益（`claimedYield`）
    - 总供应量（`totalSupply` / `maxSupply`）
    - 总收益（`totalEarnedYield`）
  - **充值收益**：发布者可以向收益池充值测试代币（TUSDC），用于支付投资者的收益
  - **提取收益**：所有持有者（包括发布者和管理员）根据持有的份额比例提取收益
    - 收益计算基于实际铸造份额（`totalSupply`），而非最大供应量（`maxSupply`）
    - 收益锁定期为 1 年，或直到项目结束
  - **退款功能**：所有用户（包括发布者和管理员）可以退款通过 `buyShares` 购买的份额
    - 退款条件：锁定期满（1 年）或项目已结束
    - 退款金额：按购买时的支付金额全额退还
    - 注意：通过 `mintShares` 获得的份额无法退款（因为没有购买记录）
- 支持按份额比例自动计算可提取收益
- 使用 ERC20 代币（TestToken）作为收益代币

### 角色管理（`/roles`）

- 管理平台角色和权限
- 主要功能：
  - **添加发布者**：管理员可以添加新的发布者地址
  - **申请发布者**：用户可以通过 KYC 申请成为发布者
  - **查看角色**：查看当前账户的角色权限
- 支持链上角色验证和 KYC 申请流程

### 转账中心（`/transfer`）

- ERC1155 代币转账和销毁功能
- 主要功能：
  - **查看持仓**：查看当前账户持有的所有房产份额
  - **转账份额**：将房产份额代币转账给其他地址
  - **销毁份额**：销毁持有的份额代币（例如退款后）
  - **批量查询**：支持批量查询多个房产的余额
  - **实时刷新**：转账或销毁后自动刷新余额显示
- 使用标准的 ERC1155 `safeTransferFrom` 和 `burn` 函数

---

## 🎯 核心业务逻辑

### 收益分配方案

- **基于实际铸造份额**：收益计算使用实际铸造份额（`totalSupply`）作为分母，而非最大供应量（`maxSupply`）
- **收益锁定期**：收益锁定 1 年，或直到项目结束（`projectEndTime > 0`）
- **收益提取**：持有者按持有份额比例提取收益，收益池会相应减少

### 保障金机制

- **保障金计算**：`requiredGuaranteeFund = totalSupply × unitPriceWei × annualYieldBps / 10000`
  - 基于实际铸造份额（`totalSupply`），确保发布者有足够资金支付投资者的年化收益
- **保障金检查**：项目结束前必须检查保障金是否充足
  - 如果 `totalSupply == 0` 且 `yieldPools[propertyId] == 0`，保障金显示为不足
- **项目结束限制**：只有保障金充足时才能结束项目（`setProjectEndTime`）

### 购买与退款机制

- **购买份额**（`buyShares`）：
  - 用户支付 ETH，资金存入托管池（`escrowPools`）
  - 创建购买记录（`PurchaseRecord`），包含购买数量、支付金额、购买时间
  - 铸造 ERC1155 份额代币给购买者
- **退款份额**（`refundShares`）：
  - 退款条件：锁定期满（1 年）或项目已结束
  - 从托管池退还购买时的支付金额
  - 销毁对应的份额代币
  - 注意：只有通过 `buyShares` 购买的份额才能退款（有购买记录），通过 `mintShares` 获得的份额无法退款

### 项目生命周期

1. **创建阶段**：发布者创建房产，设置金融参数
2. **发行阶段**：用户购买份额或发布者铸造份额
3. **运营阶段**：发布者定期充值收益，持有者提取收益
4. **结束阶段**：
   - 发布者存入足够的保障金
   - 发布者结束项目（设置 `projectEndTime`）
   - 项目结束后，已结束的项目不再显示在资产展示页面
   - 持有者可以退款或继续持有份额

---

## 🔐 智能合约与 Hardhat 项目

### 合约结构（位于 `src/hardhat/contracts`）

- **`MyToken.sol`**
  - 基于 ERC1155 的多代币标准，可作为房地产单位的基础代币
  - 采用可升级架构（使用 OpenZeppelin Upgrades 套件）
  - 支持角色控制、铸造 / 销毁、暂停等功能

- **`RealEstateStorage.sol`**
  - 负责储存房地产相关的数据结构
  - 存储房产信息（名称、位置、元数据 URI、发行者、供应量等）
  - 存储金融参数（单价、年化收益率等）

- **`RealEstateLogic.sol`**
  - 通过接口 `IMyToken` 操作 `MyToken`，实现房地产的高层业务逻辑
  - 主要功能：
    - **房产管理**：
      - 创建房产（`createProperty`）
      - 设置金融参数（`setPropertyFinancials`）：单价和年化收益率
      - 结束项目（`setProjectEndTime`）：需要保障金充足才能结束
    - **份额管理**：
      - 铸造份额（`mintShares`）：发布者可以直接铸造份额（不创建购买记录）
      - 购买份额（`buyShares`）：用户购买份额，创建购买记录，资金存入托管池
      - 退款份额（`refundShares`）：用户退款购买的份额，从托管池退还资金
    - **收益分配**：
      - 充值收益（`depositYield`）：发布者向收益池充值收益代币
      - 提取收益（`claimYield`）：持有者按份额比例提取收益
      - 收益计算基于实际铸造份额（`totalSupply`），而非最大供应量（`maxSupply`）
    - **保障金机制**：
      - 计算所需保障金（`calculateRequiredGuaranteeFund`）：基于 `totalSupply × unitPriceWei × annualYieldBps / 10000`
      - 检查保障金是否充足（`isGuaranteeFundSufficient`）：确保收益池中有足够资金
      - 项目结束前必须保障金充足
    - **角色管理**：
      - 添加发布者（`addPublisher`）：管理员添加发布者
      - 申请发布者（`applyForPublisher`）：用户提交发布者申请
      - 审核申请（`reviewPublisherApplication`）：管理员审核发布者申请

- **`TestToken.sol`**
  - ERC20 测试代币，用于收益分配系统
  - 部署时自动给部署者铸造 1,000,000 代币用于测试

### 部署脚本（`src/hardhat/script/deploy.ts`）

- 自定义部署流程，大致涵盖：
  - 部署 / 初始化 `MyToken`。
  - 部署 `RealEstateStorage` 与 `RealEstateLogic`，并建立彼此间的关联。
  - 输出部署后的合约地址。

### 前端合约地址配置（`src/contracts/addresses.ts`）

- `contracts.localhost` 配置本地 Hardhat 网络上的合约地址：
  - `myToken` - MyToken 代理合约地址
  - `realEstateStorage` - RealEstateStorage 代理合约地址
  - `realEstateLogic` - RealEstateLogic 代理合约地址
  - `testToken` - TestToken 合约地址（用于收益分配）
- **部署后更新地址**：
  - 每次部署后，需要将实际的 Proxy 合约地址更新到 `addresses.ts`
  - 未来部署到测试网 / 主网时，在对应网络字段中填入地址

---

## 🌐 Wagmi / RainbowKit 设置

Wagmi 设置位于 `src/wagmi.ts`：

- 使用 `getDefaultConfig` 建立 RainbowKit / Wagmi config。
- **支持网络**：
  - Ethereum Mainnet
  - Polygon
  - Optimism
  - Arbitrum
  - Base
  - Localhost（开发用）
  - Sepolia（当 `NEXT_PUBLIC_ENABLE_TESTNETS === 'true'` 时启用）
- 需要设置的环境变量（前端）：

```bash
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=你的_walletconnect_project_id # 建议替换掉预设 'demo'
NEXT_PUBLIC_ENABLE_TESTNETS=true # 若要显示 Sepolia 测试网
```

---

## 🚀 快速开始

### 前置需求

- Node.js 18.x 或 20.x（**不建议使用 22，目前 Hardhat 支持度较差**）
- npm（或 yarn / pnpm）
- MetaMask 或其他 EVM 兼容钱包（用于体验钱包连线）

### 快速安装

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

### 📖 完整操作指南

**详细的设置、部署和测试步骤，请参考 [OPERATION_GUIDE.md](./OPERATION_GUIDE.md)**

该文档包含：
- ✅ 环境配置（IPFS/Pinata 设置）
- ✅ 智能合约部署流程
- ✅ 前端配置和 MetaMask 设置
- ✅ 完整的功能测试指南
- ✅ 收益分配系统测试
- ✅ 故障排查和常见问题解答

### 快速启动（本地开发）

1. **启动 Hardhat 本地节点**（终端 1）：
```bash
cd src/hardhat
npx hardhat node
```

2. **编译并部署合约**（终端 2）：
```bash
cd src/hardhat
npx hardhat compile
npx hardhat run script/deploy.ts --network localhost
```

3. **更新合约地址**：
   - 复制部署输出的合约地址
   - 更新 `src/contracts/addresses.ts` 中的 `localhost` 配置

4. **配置环境变量**：
   - 在项目根目录创建 `.env.local` 文件
   - 配置 Pinata API 密钥（详见 [OPERATION_GUIDE.md](./OPERATION_GUIDE.md)）

5. **启动前端**（终端 3）：
```bash
npm run dev
```

6. **访问应用**：
   - 打开浏览器访问 `http://localhost:3000`
   - 配置 MetaMask 连接到本地网络（Chain ID: 31337）

---

## 🔧 Hardhat：编译与部署合约（其他网络）

### 编译合约

进入 Hardhat 子项目：

```bash
cd src/hardhat
```

**编译合约：**

```bash
npx hardhat compile
```

### 在本地 Hardhat 网络部署（使用内置网络）

如果你想使用 Hardhat 内置的临时网络（每次运行都会重置），可以直接运行：

```bash
npx hardhat run script/deploy.ts
```

> 注意：这种方式每次运行都会创建新的网络状态，适合快速测试，但不适合与前端持续交互。

### 部署到 Sepolia 测试网

1. 在 `src/hardhat` 目录下创建 `.env`：

```env
INFURA_API_KEY=your_infura_api_key_here
PRIVATE_KEY=your_metamask_private_key_here   # 以 0x 开头
```

2. 执行部署：

```bash
npx hardhat run script/deploy.ts --network sepolia
```

3. 将部署得到的地址填入 `src/contracts/addresses.ts` 中的 `sepolia` 区块，并在前端环境变量中启用 `NEXT_PUBLIC_ENABLE_TESTNETS=true`。

### 部署到主网（选填）

```bash
npx hardhat run script/deploy.ts --network mainnet
```

> ⚠️ 需自备真实 ETH，请在完成审计与充分测试后再考虑。

### 执行测试

```bash
npx hardhat test
```

### 其他常用 Hardhat 指令

```bash
npx hardhat node        # 启动本地节点（见上方完整流程）
npx hardhat clean       # 清除编译缓存
npx hardhat verify      # 验证合约（用于 Etherscan）
```

---

## 📦 技术栈整理

### 前端

- **Next.js 15（App Router）**
- **React 18/19（以实际 package.json 为准）**
- **TypeScript**
- **RainbowKit**（钱包连线 UI）
- **Wagmi**（React Hooks 操作 EVM 链）
- **Viem**（EVM 工具函数库）
- CSS Modules + 自定义 CSS（`globals.css` / `components.css`）

### 智能合约 / 后端链上

- **Hardhat 2.22.x**
- **Solidity 0.8.27**
- **OpenZeppelin Contracts 5.x**
- **OpenZeppelin Upgrades**
- **Ethers.js 5.7.x**

### 支持链

- Hardhat 本地开发链（Chain ID: 31337）
- Sepolia 测试网（Chain ID: 11155111）
- 以太坊主网（Chain ID: 1）
- 其他 EVM 公链（如 Polygon / Optimism / Arbitrum / Base，视 Wagmi 设置与实际部署情况而定）

---

## ⚠️ 安全与注意事项

1. **私钥安全**：请务必将部署用私钥只放在 `.env` 中，且 `.env` 已应加入 `.gitignore`，不要推送到任何远端存储库。
2. **测试网部署**：部署到 Sepolia 前，确认钱包中有足够测试 ETH（可从 Faucet 取得）。
3. **主网部署风险**：主网合约一经部署与互动即会产生真实费用且不可逆，务必完成审计与测试。
4. **Gas 费用**：部署与交易都需要 Gas，请注意当前网络费率。
5. **前端为示范性质**：目前交易流程多为「模拟 / 假数据」，若要接上真实合约请先检查合约接口与安全性。

---

## 📚 相关文档

- **[OPERATION_GUIDE.md](./OPERATION_GUIDE.md)** - 完整的操作指南（设置、部署、测试、故障排查）

---

## 📄 授权与作者

- **授权**：MIT License
- **作者**：毕业项目

如有问题或建议，欢迎提交 Issue 或 Pull Request。
