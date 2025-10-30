const { readFileSync } = require("fs");
const { join } = require("path");

function getDeployedAddress() {
  const constantsPath = join(__dirname, "../src/lib/constants.ts");
  const content = readFileSync(constantsPath, "utf8");
  const m = content.match(/CONFIDENTIAL_MARKET_ADDRESS:[^=]*=\s*"(0x[0-9a-fA-F]{40})"/);
  if (!m) throw new Error("无法从 src/lib/constants.ts 解析合约地址");
  return m[1];
}

async function main() {
  const [signer] = await ethers.getSigners();
  console.log("Seeding with:", signer.address);
  const address = getDeployedAddress();
  console.log("Using ConfidentialMarketV2:", address);

  const v2 = await ethers.getContractAt("ConfidentialMarketV2", address);

  const seeds = [
    { q: "Will BTC close above $100k this year?", days: 30 },
    { q: "Will Team A win the championship?", days: 15 },
    { q: "Will interest rates decrease next quarter?", days: 45 },
  ];

  for (const s of seeds) {
    const tx = await v2.createMarket(s.q, BigInt(s.days * 24 * 60 * 60));
    const rcpt = await tx.wait();
    console.log("Created:", s.q, "tx:", rcpt?.hash ?? tx.hash);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});


