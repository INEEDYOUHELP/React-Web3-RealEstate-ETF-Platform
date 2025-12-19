import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import type { Chain } from 'wagmi';
import {
  arbitrum,
  base,
  localhost as wagmiLocalhost,
  mainnet,
  optimism,
  polygon,
  sepolia,
} from 'wagmi/chains';

// 自定义 Hardhat 本地链配置：
// - 使用 Hardhat 默认链 ID 31337
// - 名字展示为 "Hardhat"
// - 复用 wagmi 提供的 localhost RPC 配置
const hardhatLocal: Chain = {
  ...wagmiLocalhost,
  id: 31337,
  name: 'Hardhat',
  network: 'hardhat',
};

export const config = getDefaultConfig({
  appName: 'RealEstate ETF',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'demo',
  chains: [
    mainnet,
    polygon,
    optimism,
    arbitrum,
    base,
    hardhatLocal,
    ...(process.env.NEXT_PUBLIC_ENABLE_TESTNETS === 'true' ? [sepolia] : []),
  ],
  ssr: true,
});
