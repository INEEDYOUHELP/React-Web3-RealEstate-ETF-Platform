// 合约地址配置（前端使用）
// TODO: 部署完成后，把下面的地址替换为真实的 Proxy 地址

export const contracts = {
  localhost: {
    myToken: "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0",
    realEstateStorage: "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9",
    realEstateLogic: "0x0165878A594ca255338adfa4d48449f69242Eb8F",
    testToken: "0x8A791620dd6260079BF849Dc5567aDC3F2FdC318",
  },
  // sepolia: {
  //   myToken: "0x...",
  //   realEstateStorage: "0x...",
  //   realEstateLogic: "0x...",
  //   testToken: "0x...",
  // },
} as const;

export type SupportedNetwork = keyof typeof contracts;


