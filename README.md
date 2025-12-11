# Graduation Project

一个基于 Next.js 和 Hardhat 的全栈 Web3 应用项目，集成了 ERC1155 可升级代币合约和 MetaMask 钱包连接功能。

## 📋 项目简介

本项目是一个毕业设计项目，包含以下主要功能：

- **前端应用**: 基于 Next.js 15 + React 19 构建的现代化 Web 应用
- **智能合约**: ERC1155 可升级代币合约（MyToken），支持铸造、销毁、暂停等功能
- **钱包集成**: 使用 RainbowKit 和 Wagmi 实现 MetaMask 等钱包连接
- **合约部署**: 支持本地 Hardhat 网络、Sepolia 测试网和以太坊主网部署

## 🏗️ 项目结构

```
毕业项目/
├── src/
│   ├── app/                    # Next.js 应用目录
│   │   ├── components/          # React 组件
│   │   │   └── wallet/         # 钱包相关组件
│   │   ├── layout.tsx          # 应用布局
│   │   └── page.tsx            # 首页
│   ├── hardhat/                # Hardhat 智能合约项目
│   │   ├── contracts/          # Solidity 合约文件
│   │   │   ├── MyToken.sol     # ERC1155 可升级代币合约
│   │   │   └── Lock.sol        # 示例合约
│   │   ├── script/             # 部署脚本
│   │   │   └── deploy.ts       # 合约部署脚本
│   │   ├── test/               # 测试文件
│   │   ├── hardhat.config.ts   # Hardhat 配置
│   │   └── package.json        # Hardhat 依赖
│   └── wagmi.ts                # Wagmi 配置
├── package.json                # 项目主依赖
└── README.md                   # 项目说明文档
```

## 🚀 快速开始

### 前置要求

- Node.js 18.x 或更高版本（推荐使用 Node.js 18 或 20，Hardhat 不完全支持 Node.js 22）
- npm 或 yarn 包管理器
- MetaMask 浏览器扩展（用于钱包连接）

### 安装依赖

1. **安装项目根目录依赖**（Next.js 应用）:
```bash
npm install
```

2. **安装 Hardhat 项目依赖**:
```bash
cd src/hardhat
npm install
```

### 环境配置

在 `src/hardhat` 目录下创建 `.env` 文件（用于部署到测试网/主网）：

```env
# Infura API Key (从 https://infura.io 获取)
INFURA_API_KEY=your_infura_api_key_here

# MetaMask 私钥（从 MetaMask 导出，以 0x 开头）
PRIVATE_KEY=your_metamask_private_key_here
```

**⚠️ 重要提示**: 
- `.env` 文件已添加到 `.gitignore`，不会被提交到 Git
- 请妥善保管私钥，不要泄露给他人
- 不要将包含私钥的文件提交到公共仓库

## 💻 运行项目

### 启动 Next.js 开发服务器

在项目根目录运行：

```bash
npm run dev
```

应用将在 [http://localhost:3000](http://localhost:3000) 启动。

### 编译智能合约

进入 Hardhat 目录并编译合约：

```bash
cd src/hardhat
npx hardhat compile
```

### 部署智能合约

#### 部署到本地 Hardhat 网络（默认）

```bash
cd src/hardhat
npx hardhat run script/deploy.ts
```

#### 部署到 Sepolia 测试网

1. 确保 `.env` 文件已配置 `INFURA_API_KEY` 和 `PRIVATE_KEY`
2. 确保 MetaMask 账号中有足够的 Sepolia 测试 ETH（可从 [Sepolia Faucet](https://sepoliafaucet.com/) 获取）

```bash
cd src/hardhat
npx hardhat run script/deploy.ts --network sepolia
```

#### 部署到以太坊主网

⚠️ **谨慎操作**: 主网部署需要真实的 ETH，且操作不可逆。

```bash
cd src/hardhat
npx hardhat run script/deploy.ts --network mainnet
```

### 运行测试

```bash
cd src/hardhat
npx hardhat test
```

## 📦 技术栈

### 前端
- **Next.js 15**: React 全栈框架
- **React 19**: UI 库
- **TypeScript**: 类型安全
- **RainbowKit**: 钱包连接 UI 组件
- **Wagmi**: React Hooks for Ethereum
- **Viem**: 以太坊 TypeScript 库

### 智能合约
- **Hardhat 2.22.5**: 以太坊开发环境
- **Solidity 0.8.27**: 智能合约编程语言
- **OpenZeppelin Contracts 5.x**: 安全的标准合约库
- **OpenZeppelin Upgrades**: 可升级合约插件
- **Ethers.js 5.7.2**: 以太坊 JavaScript 库

### 网络支持
- Hardhat 本地网络（Chain ID: 31337）
- Sepolia 测试网（Chain ID: 11155111）
- 以太坊主网（Chain ID: 1）

## 🔐 智能合约功能

### MyToken (ERC1155 可升级代币)

MyToken 是一个基于 ERC1155 标准的可升级代币合约，具有以下功能：

- ✅ **可升级性**: 使用 OpenZeppelin Upgrades 实现可升级代理模式
- ✅ **访问控制**: 基于角色的权限管理（DEFAULT_ADMIN_ROLE, PAUSER_ROLE, MINTER_ROLE）
- ✅ **铸造功能**: 支持单个和批量铸造代币
- ✅ **销毁功能**: 支持代币销毁
- ✅ **暂停功能**: 管理员可以暂停/恢复合约操作
- ✅ **供应量追踪**: 自动追踪每个代币 ID 的总供应量

### 角色说明

- **DEFAULT_ADMIN_ROLE**: 默认管理员，拥有所有权限
- **PAUSER_ROLE**: 可以暂停/恢复合约
- **MINTER_ROLE**: 可以铸造新代币
- **URI_SETTER_ROLE**: 可以设置代币元数据 URI

## 📝 可用脚本

### Next.js 应用脚本

```bash
# 开发模式
npm run dev

# 构建生产版本
npm run build

# 启动生产服务器
npm start
```

### Hardhat 脚本

```bash
cd src/hardhat

# 编译合约
npx hardhat compile

# 运行测试
npx hardhat test

# 启动本地节点
npx hardhat node

# 清理编译缓存
npx hardhat clean

# 验证合约（测试网/主网）
npx hardhat verify --network <network> <contract_address>
```

## 🔧 配置说明

### Hardhat 配置

Hardhat 配置文件位于 `src/hardhat/hardhat.config.ts`，已配置：

- Solidity 编译器版本: 0.8.27
- 网络配置: hardhat（本地）、sepolia（测试网）、mainnet（主网）
- OpenZeppelin Upgrades 插件支持

### Wagmi 配置

Wagmi 配置文件位于 `src/wagmi.ts`，支持以下网络：

- Ethereum Mainnet
- Polygon
- Optimism
- Arbitrum
- Base
- Sepolia (测试网，需设置环境变量启用)

## 📚 相关资源

- [Next.js 文档](https://nextjs.org/docs)
- [Hardhat 文档](https://hardhat.org/docs)
- [OpenZeppelin 文档](https://docs.openzeppelin.com/)
- [RainbowKit 文档](https://www.rainbowkit.com/docs)
- [Wagmi 文档](https://wagmi.sh/)

## ⚠️ 注意事项

1. **Node.js 版本**: Hardhat 不完全支持 Node.js 22，建议使用 Node.js 18 或 20
2. **私钥安全**: 永远不要将私钥提交到 Git 仓库
3. **测试网部署**: 部署到测试网前确保账号有足够的测试 ETH
4. **主网部署**: 主网部署需要真实 ETH，操作不可逆，请谨慎操作
5. **Gas 费用**: 部署和交互合约需要支付 Gas 费用

## 📄 许可证

MIT License

## 👤 作者

毕业项目

---

如有问题或建议，欢迎提交 Issue 或 Pull Request。
