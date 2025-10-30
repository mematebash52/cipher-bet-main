async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with:", deployer.address);

  const balance = await deployer.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "ETH");

  // 部署 ConfidentialMarketV2
  const Factory = await ethers.getContractFactory("ConfidentialMarketV2");
  console.log("\nDeploying ConfidentialMarketV2...");

  const contract = await Factory.deploy();
  console.log("Waiting for deployment transaction...");

  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log("✅ ConfidentialMarketV2 deployed to:", address);

  // 显示合约信息
  console.log("\n" + "=".repeat(60));
  console.log("📋 Contract Deployment Summary");
  console.log("=".repeat(60));
  console.log("Network:     Local Hardhat Network");
  console.log("Contract:    ConfidentialMarketV2");
  console.log("Address:     " + address);
  console.log("Owner:       " + deployer.address);
  console.log("=".repeat(60));

  console.log("\n✅ 部署完成! 现在可以运行:");
  console.log(`npx hardhat fhevm check-fhevm-compatibility --network hardhat --address ${address}`);

  return address;
}

main().catch((e) => {
  console.error("\n❌ 部署失败:");
  console.error(e);
  process.exit(1);
});
