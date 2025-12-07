import { ethers, upgrades } from "hardhat";

async function main() {
  // 获取网络信息
  const network = await ethers.provider.getNetwork();
  const chainId = typeof network.chainId === "bigint" ? Number(network.chainId) : network.chainId;
  const isLocalNetwork = chainId === 31337 || network.name === "hardhat" || network.name === "localhost";
  
  console.log("🌐 Network:", network.name, `(Chain ID: ${network.chainId})`);
  
  if (isLocalNetwork) {
    console.log("✅ Using Hardhat local network - perfect for development and testing!");
  } else {
    console.log("🌍 Deploying to public network:", network.name);
    // 检查环境变量（仅对公共网络）
    if (!process.env.PRIVATE_KEY) {
      console.error("❌ ERROR: PRIVATE_KEY not found in .env file!");
      console.error("   Please configure your .env file with your MetaMask private key.");
      process.exit(1);
    }
    if (!process.env.INFURA_API_KEY) {
      console.error("❌ ERROR: INFURA_API_KEY not found in .env file!");
      console.error("   Please configure your .env file with your Infura API key.");
      process.exit(1);
    }
  }
  
  // 获取部署账号
  const [deployer] = await ethers.getSigners();
  
  console.log("\n📝 Deploying contracts with the account:", deployer.address);
  
  const balance = await deployer.getBalance();
  const balanceInEth = ethers.utils.formatEther(balance);
  console.log("💰 Account balance:", balanceInEth, "ETH");
  
  // 检查余额是否足够（仅对公共网络）
  if (!isLocalNetwork && balance.lt(ethers.utils.parseEther("0.01"))) {
    console.warn("⚠️  WARNING: Low balance! You may not have enough ETH for deployment.");
    console.warn("   Please ensure you have sufficient test ETH in your account.");
  }

  // 如果只有一个账号，所有角色都使用部署者地址
  // 你可以根据需要修改这些地址
  const defaultAdmin = deployer.address;
  const pauser = deployer.address;
  const minter = deployer.address;

  console.log("\nInitial roles configuration:");
  console.log("  Default Admin:", defaultAdmin);
  console.log("  Pauser:", pauser);
  console.log("  Minter:", minter);

  // 获取合约工厂
  const MyToken = await ethers.getContractFactory("MyToken");

  console.log("\nDeploying MyToken as upgradeable proxy...");

  // 通过 Hardhat Upgrades 插件部署可升级合约
  const myToken = await upgrades.deployProxy(
    MyToken,
    [defaultAdmin, pauser, minter], // initialize 参数
    { initializer: "initialize" }
  );

  await myToken.deployed();
  
  // 获取实现合约地址
  const implementationAddress = await upgrades.erc1967.getImplementationAddress(myToken.address);

  console.log("\n✅ Deployment successful!");
  console.log("Proxy address:", myToken.address);
  console.log("Implementation address:", implementationAddress);
  
  if (isLocalNetwork) {
    console.log("\n💡 Tip: This is a local deployment. Restart Hardhat to reset the network.");
    console.log("   To deploy to Sepolia testnet, use: npx hardhat run script/deploy.ts --network sepolia");
    console.log("   To deploy to mainnet, use: npx hardhat run script/deploy.ts --network mainnet");
  } else {
    console.log("\n📋 You can verify the deployment by running:");
    console.log(`  npx hardhat verify --network ${network.name} ${implementationAddress}`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });