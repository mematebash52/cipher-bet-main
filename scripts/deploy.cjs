const { writeFileSync, readFileSync } = require("fs");
const { join } = require("path");

async function deployContract(contractName) {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with:", deployer.address);

  const Factory = await ethers.getContractFactory(contractName);
  const contract = await Factory.deploy();
  await contract.waitForDeployment();
  const address = await contract.getAddress();
  console.log(`${contractName} deployed:`, address);
  return address;
}

function updateFrontendAddress(address) {
  // 写回前端地址常量
  const constantsPath = join(__dirname, "../src/lib/constants.ts");
  const content = readFileSync(constantsPath, "utf8");
  const updated = content.replace(
    /export const CONFIDENTIAL_MARKET_ADDRESS: `0x\$\{string\}` = "0x[0-9a-fA-F]{40}";/,
    `export const CONFIDENTIAL_MARKET_ADDRESS: \`0x\${string}\` = "${address}";`
  );
  writeFileSync(constantsPath, updated);
  console.log("Updated src/lib/constants.ts with address.");
}

async function main() {
  // 查找显式传参 --target=<v1|v2|all> 或者裸参数放在 -- 后
  const argv = process.argv.slice(2);
  let target = "v1";
  if (process.env.TARGET) {
    target = process.env.TARGET;
  }
  for (const a of argv) {
    if (a.startsWith("--target=")) {
      target = a.split("=")[1];
    } else if (!a.startsWith("--network")) {
      // 支持在 -- 之后的第一个位置参数作为目标
      if (a !== "--") target = a;
    }
  }
  target = (target || "v1").toLowerCase();

  if (target === "v1") {
    const addr = await deployContract("ConfidentialMarket");
    updateFrontendAddress(addr);
  } else if (target === "v2") {
    const addr = await deployContract("ConfidentialMarketV2");
    updateFrontendAddress(addr);
  } else if (target === "all") {
    const addrV1 = await deployContract("ConfidentialMarket");
    const addrV2 = await deployContract("ConfidentialMarketV2");
    updateFrontendAddress(addrV2);
    console.log("All deployments done.", { v1: addrV1, v2: addrV2 });
  } else {
    console.log('Unknown target. Use "v1", "v2", or "all".');
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});


