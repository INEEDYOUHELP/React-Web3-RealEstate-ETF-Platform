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

  // ============================================
  // 步骤 1: 部署 MyToken (代理)
  // ============================================
  console.log("\n📦 Step 1: Deploying MyToken as upgradeable proxy...");

  const MyToken = await ethers.getContractFactory("MyToken");

  // 通过 Hardhat Upgrades 插件部署可升级合约
  const myToken = await upgrades.deployProxy(
    MyToken,
    [defaultAdmin, pauser, minter], // initialize 参数
    { initializer: "initialize" }
  );

  await myToken.deployed();
  
  // 获取实现合约地址
  const myTokenImplementation = await upgrades.erc1967.getImplementationAddress(myToken.address);

  console.log("✅ MyToken deployed!");
  console.log("   Proxy address:", myToken.address);
  console.log("   Implementation address:", myTokenImplementation);

  // ============================================
  // 步骤 2: 部署 RealEstateStorage (代理)
  // ============================================
  console.log("\n📦 Step 2: Deploying RealEstateStorage as upgradeable proxy...");
  
  const RealEstateStorage = await ethers.getContractFactory("RealEstateStorage");
  
  const storage = await upgrades.deployProxy(
    RealEstateStorage,
    [deployer.address], // initialize 参数：initialOwner = deployer
    { initializer: "initialize" }
  );

  await storage.deployed();
  
  const storageImplementation = await upgrades.erc1967.getImplementationAddress(storage.address);
  
  console.log("✅ RealEstateStorage deployed!");
  console.log("   Proxy address:", storage.address);
  console.log("   Implementation address:", storageImplementation);

  // ============================================
  // 步骤 3: 部署 RealEstateLogic (代理)
  // ============================================
  console.log("\n📦 Step 3: Deploying RealEstateLogic as upgradeable proxy...");
  
  const RealEstateLogic = await ethers.getContractFactory("RealEstateLogic");
  
  const logic = await upgrades.deployProxy(
    RealEstateLogic,
    [
      myToken.address,  // myToken
      storage.address,   // storageAddr
      deployer.address  // admin
    ],
    { initializer: "initialize" }
  );

  await logic.deployed();
  
  const logicImplementation = await upgrades.erc1967.getImplementationAddress(logic.address);
  
  console.log("✅ RealEstateLogic deployed!");
  console.log("   Proxy address:", logic.address);
  console.log("   Implementation address:", logicImplementation);

  // ============================================
  // 步骤 4: 设置 Storage 的 manager 为 Logic
  // ============================================
  console.log("\n🔗 Step 4: Setting RealEstateStorage manager to RealEstateLogic...");
  
  const setManagerTx = await storage.setManager(logic.address);
  await setManagerTx.wait();
  
  console.log("✅ Manager set successfully!");
  console.log("   RealEstateStorage.manager =", logic.address);

  // ============================================
  // 步骤 5: 在 MyToken 中授予 MINTER_ROLE 给 Logic
  // ============================================
  console.log("\n🔐 Step 5: Granting MINTER_ROLE to RealEstateLogic in MyToken...");
  
  // 计算 MINTER_ROLE 的 keccak256 哈希
  const MINTER_ROLE = ethers.utils.keccak256(
    ethers.utils.toUtf8Bytes("MINTER_ROLE")
  );
  
  // 检查是否已经有权限
  const hasRole = await myToken.hasRole(MINTER_ROLE, logic.address);
  
  if (hasRole) {
    console.log("⚠️  RealEstateLogic already has MINTER_ROLE");
  } else {
    const grantRoleTx = await myToken.grantRole(MINTER_ROLE, logic.address);
    await grantRoleTx.wait();
    
    console.log("✅ MINTER_ROLE granted successfully!");
    console.log("   MyToken granted MINTER_ROLE to:", logic.address);
  }

  // ============================================
  // 部署总结
  // ============================================
  console.log("\n" + "=".repeat(60));
  console.log("🎉 All Contracts Deployed and Linked Successfully!");
  console.log("=".repeat(60));
  console.log("\n📋 Contract Addresses:");
  console.log("   MyToken Proxy:        ", myToken.address);
  console.log("   RealEstateStorage:    ", storage.address);
  console.log("   RealEstateLogic:      ", logic.address);
  console.log("\n💡 Next Steps:");
  console.log("   1. Save these addresses to your frontend config");
  console.log("   2. Use RealEstateLogic to add publishers:");
  console.log(`      await logic.addPublisher("0x...")`);
  console.log("   3. Publishers can create properties:");
  console.log(`      await logic.createProperty("Name", "Location", maxSupply)`);
  console.log("   4. Publishers can mint shares:");
  console.log(`      await logic.mintShares(propertyId, to, amount)`);
  
  if (isLocalNetwork) {
    console.log("\n💡 Tip: This is a local deployment. Restart Hardhat to reset the network.");
    console.log("   To deploy to Sepolia testnet, use: npx hardhat run script/deploy.ts --network sepolia");
    console.log("   To deploy to mainnet, use: npx hardhat run script/deploy.ts --network mainnet");
  } else {
    console.log("\n📋 You can verify the deployments by running:");
    console.log(`   npx hardhat verify --network ${network.name} ${myTokenImplementation}`);
    console.log(`   npx hardhat verify --network ${network.name} ${storageImplementation}`);
    console.log(`   npx hardhat verify --network ${network.name} ${logicImplementation}`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });