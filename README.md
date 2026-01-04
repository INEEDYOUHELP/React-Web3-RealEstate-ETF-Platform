# RealEstate ETF 资产选择平台（毕业项目）

一个以 **「房地产 ETF 资产选择与模拟交易」** 为主题的全栈 Web3 毕业项目，整合 Next.js 应用、模拟投资与交易界面，以及 Hardhat 智能合约项目（包含 ERC1155 代币与房地产 ETF 逻辑合约）。

---

## 📋 项目总览

- **产品定位**：模拟一个去中心化的「房地产 ETF 投资平台」，提供资产浏览、数据分析、投资组合检视与交易体验。
- **前端应用**：基于 Next.js App Router，提供多页面仪表板式界面（首页、资产展示、数据分析、投资组合、交易中心、关于页）。
- **智能合约**：`src/hardhat/contracts` 中包含：
  - `MyToken.sol`：ERC1155 型态的基础代币（可升级架构）。
  - `RealEstateStorage.sol`：房地产 ETF 相关的存储层。
  - `RealEstateLogic.sol`：ETF 业务逻辑层（通过接口 `IMyToken` 与代币互动）。
- **Web3 / 钱包整合**：使用 RainbowKit + Wagmi + WalletConnect，支持多链（Mainnet / Polygon / Optimism / Arbitrum / Base / Localhost，并可选择启用 Sepolia 测试网）。
- **使用场景**：作为毕业专题展示 **前端 UI/UX + 数据模型 + 智能合约结构 + Web3 基础整合** 的完整范例。

---

## 🏗️ 项目目录结构（实际）

```text
毕业项目/
├── src/
│   ├── app/                         # Next.js App Router 应用
│   │   ├── page.tsx                 # 首页（英雄区 + 热门资产介绍）
│   │   ├── layout.tsx               # 全局 Layout（Navbar + Footer + Providers）
│   │   ├── about/                   # 关于平台 / 项目介绍页
│   │   ├── assets/                  # 资产展示页（全球房地产 ETF 资产）
│   │   ├── analytics/               # 数据分析中心
│   │   ├── portfolio/               # 我的投资组合
│   │   ├── trading/                 # 交易中心（模拟下单）
│   │   └── components/
│   │       ├── layout/              # Navbar / Footer / Breadcrumb
│   │       ├── wallet/              # `WalletProvider`，包装 Wagmi/RainbowKit
│   │       ├── assets/              # 资产卡片、搜索、筛选、Modal 等组件
│   │       ├── analytics/           # 市场概览、分析卡片、表格等 UI
│   │       ├── portfolio/           # 组合概要、持仓列表、交易记录等组件
│   │       └── trading/             # 交易面板、订单簿、近期成交等组件
│   │
│   ├── hooks/                       # 前端数据与 UI 状态 hooks（以假数据为主）
│   │   ├── useAssets.ts             # 资产搜索 / 筛选 / 收藏（localStorage）
│   │   ├── usePortfolio.ts          # 组合摘要、持仓、模拟绩效
│   │   ├── useTrading.ts            # 交易中心状态（买卖方向、数量、估算金额等）
│   │   └── useAnalytics.ts          # 市场概览与分析卡片数据
│   │
│   ├── data/                        # 假数据（Mock Data），支持整个前端展示
│   │   ├── assets.ts                # 房地产资产清单
│   │   ├── portfolio.ts             # 组合持仓、交易记录与摘要
│   │   ├── trading.ts               # 交易中心用的 ETF 资产列表
│   │   └── analytics.ts             # 市场与指标数据
│   │
│   ├── contracts/
│   │   └── addresses.ts             # 前端使用的合约地址设置（localhost / sepolia 等）
│   │
│   ├── hardhat/                     # Hardhat 智能合约子项目（独立 package.json）
│   │   ├── contracts/               # Solidity 合约
│   │   │   ├── MyToken.sol
│   │   │   ├── RealEstateLogic.sol
│   │   │   └── RealEstateStorage.sol
│   │   ├── script/
│   │   │   └── deploy.ts            # 自定义部署脚本（部署 MyToken + ETF 结构）
│   │   ├── hardhat.config.ts        # Hardhat 设置
│   │   └── README.md                # Hardhat 预设说明（可视需要再补充）
│   │
│   ├── styles/
│   │   ├── globals.css              # 全局样式
│   │   └── components.css           # 各页与组件使用的 UI 样式
│   │
│   ├── types/
│   │   └── index.ts                 # 共用 TypeScript 类型（Asset、TradingAsset 等）
│   │
│   └── wagmi.ts                     # Wagmi + RainbowKit 网络与 config 设置
│
├── package.json                     # Next.js 主项目依赖
└── README.md                        # 本文件（项目总览）
```

---

## 💡 主要功能说明（前端）

### 首页（`/`）

- **英雄区 / 产品介绍**：说明「房地产 ETF 资产选择平台」定位，展示总资产价值、活跃用户数、房产项目数等指标（静态示意）。
- **特色模块**：以卡片形式说明「全球资产、安全透明、智能组合、即时交易」等卖点。
- **热门资产区块**：展示数个精选房产 ETF（图片 + 城市 + 年化收益 + 市值），引导前往 `资产展示` 页面。
- **钱包连线 CTA**：若尚未连线，显示 RainbowKit `ConnectButton`；已连线则引导前往 `/assets`。

### 资产展示（`/assets`）

- 使用 `useAssets` 从 `data/assets.ts` 读取房地产资产清单，支持：
  - 关键字搜索（名称 / 地点 / 类型 / 地区）。
  - 地区筛选（例如：北美 / 欧洲 / 亚太等）。
  - 类型筛选（写字楼 / 商业 / 住宅等）。
  - 依年化收益或价格排序。
- 资产卡片支持 **收藏功能**：使用 localStorage 储存书签（`bookmarkedAssets`）。
- 点击资产可开启 `AssetDetailModal`，显示更完整的资产信息。

### 数据分析中心（`/analytics`）

- 使用 `useAnalytics` 提供市场概览与分析卡片数据。
- 包含以下区块：
  - **市场概览卡片**：总市值、成交量、活跃 ETF 数等。
  - **分析图表区**：不同维度的市场或策略指标（由 `AnalyticsChart` 呈现）。
  - **区域表格**：例如不同地区的表现指数（由 `DataTable` 呈现）。

### 我的投资组合（`/portfolio`）

- 使用 `usePortfolio` 聚合组合相关数据（来自 `data/portfolio.ts`）：
  - 组合总市值、收益率等 **摘要信息**。
  - 持仓列表（不同 ETF、持有数量、成本、现价等）。
  - 交易历史记录（买入/卖出时间、数量、价格）。
- 支持切换 **绩效观察区间**（7 天 / 30 天 / 90 天 / 1 年），利用简单系数模拟不同期间的资产价值变化。
- 使用 `PortfolioChart`、`AllocationChart`、`HoldingsList`、`TransactionHistory` 做整体视觉呈现。

### 交易中心（`/trading`）

- 使用 `useTrading` 管理整个交易流程状态（选中资产、买/卖方向、金额、数量、查询字符串等）。
- 主要区块：
  - **资产选择（`AssetSelector`）**：在可交易的 ETF 清单中搜索并选择标的。
  - **下单表单（`OrderForm`）**：
    - 切换买入 / 卖出。
    - 输入金额与数量。
    - 显示预估成交金额（`estimatedCost`）。
    - 目前提交动作为前端模拟（`alert` 提示），方便未来整合真实合约或 API。
  - **订单簿 & 近期成交（`OrderBook` / `RecentTrades`）**：以假数据模拟市场深度与成交情况。

### 关于页（`/about`）

- 用于说明项目背景、设计目标与技术选择（具体内容可依你实际撰写的文案为准）。

---

## 🔐 智能合约与 Hardhat 项目

### 合约结构（位于 `src/hardhat/contracts`）

- **`MyToken.sol`**
  - 基于 ERC1155 的多代币标准，可作为房地产 ETF 单位的基础代币。
  - 采用可升级架构（使用 OpenZeppelin Upgrades 套件）。
  - 支持角色控制、铸造 / 销毁、暂停等功能（具体逻辑可于文件内查看）。

- **`RealEstateStorage.sol`**
  - 负责储存房地产 ETF 相关的数据结构，例如资产信息、持仓映射等（以实作为准）。

- **`RealEstateLogic.sol`**
  - 通过接口 `IMyToken` 操作 `MyToken`，实现房地产 ETF 的高层业务逻辑（如申购、赎回等，可依程序内容调整说明）。

### 部署脚本（`src/hardhat/script/deploy.ts`）

- 自定义部署流程，大致涵盖：
  - 部署 / 初始化 `MyToken`。
  - 部署 `RealEstateStorage` 与 `RealEstateLogic`，并建立彼此间的关联。
  - 输出部署后的合约地址。

### 前端合约地址配置（`src/contracts/addresses.ts`）

- `contracts.localhost` 预先填入本地 Hardhat 网络上的示范地址：
  - `myToken`
  - `realEstateStorage`
  - `realEstateLogic`
- **未来部署到测试网 / 主网时**：
  - 在部署完成后，请将实际的 Proxy / 合约地址填入对应网络字段（例如解开 `sepolia` 注释并更新地址）。

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
- **[SETUP_INSTRUCTIONS.md](./SETUP_INSTRUCTIONS.md)** - IPFS/Pinata 集成设置说明（已整合到操作指南）
- **[TESTING_GUIDE.md](./TESTING_GUIDE.md)** - 收益分配系统测试指南（已整合到操作指南）
- **[TROUBLESHOOTING.md](./TROUBLESHOOTING.md)** - 故障排查指南（已整合到操作指南）

---

## 📄 授权与作者

- **授权**：MIT License
- **作者**：毕业项目

如有问题或建议，欢迎提交 Issue 或 Pull Request。
