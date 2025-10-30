const { writeFileSync, readFileSync } = require("fs");
const { join } = require("path");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with:", deployer.address);

  const balance = await deployer.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "ZAMA");

  if (balance === 0n) {
    console.log("\n⚠️  警告: 账户余额为 0!");
    console.log("请访问 https://faucet.zama.ai/ 获取测试币");
    process.exit(1);
  }

  // 部署 ConfidentialMarketV2
  const Factory = await ethers.getContractFactory("ConfidentialMarketV2");
  console.log("\nDeploying ConfidentialMarketV2...");

  const contract = await Factory.deploy();
  console.log("Waiting for deployment transaction...");

  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log("✅ ConfidentialMarketV2 deployed to:", address);

  // 更新前端配置
  const constantsPath = join(__dirname, "../src/lib/constants.ts");
  let content;
  try {
    content = readFileSync(constantsPath, "utf8");
  } catch (e) {
    console.log("⚠️  constants.ts not found, creating...");
    content = `// 请将此地址替换为实际部署后的合约地址\nexport const CONFIDENTIAL_MARKET_ADDRESS: \`0x\${string}\` = "0x0000000000000000000000000000000000000000";\n`;
  }

  const updated = content.replace(
    /export const CONFIDENTIAL_MARKET_ADDRESS: `0x\$\{string\}` = "0x[0-9a-fA-F]{40}";/,
    `export const CONFIDENTIAL_MARKET_ADDRESS: \`0x\${string}\` = "${address}";`
  );
  writeFileSync(constantsPath, updated);
  console.log("✅ Updated src/lib/constants.ts");

  // 显示合约信息
  console.log("\n" + "=".repeat(60));
  console.log("📋 Contract Deployment Summary");
  console.log("=".repeat(60));
  console.log("Network:     Zama Devnet (Chain ID: 8009)");
  console.log("Contract:    ConfidentialMarketV2");
  console.log("Address:     " + address);
  console.log("Explorer:    https://explorer.zama.ai/address/" + address);
  console.log("Owner:       " + deployer.address);
  console.log("=".repeat(60));

  console.log("\n✅ 部署完成! 下一步:");
  console.log("1. 在 MetaMask 中切换到 Zama Devnet");
  console.log("2. 运行: npm run dev");
  console.log("3. 访问: http://localhost:8080");
  console.log("4. 测试投注功能");
}

main().catch((e) => {
  console.error("\n❌ 部署失败:");
  console.error(e);
  process.exit(1);
});
