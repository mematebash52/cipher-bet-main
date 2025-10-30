async function main() {
  const address = "0xECc0e6c47D4544055a8CF9DdE029EcCaACA5287e";

  console.log("Checking deployment at:", address);
  console.log("Network:", await ethers.provider.getNetwork());

  const code = await ethers.provider.getCode(address);
  console.log("Contract code length:", code.length);
  console.log("Has code:", code !== "0x");

  if (code !== "0x") {
    console.log("✅ Contract is deployed!");

    const ConfidentialMarketV2 = await ethers.getContractAt(
      "ConfidentialMarketV2",
      address
    );

    try {
      const owner = await ConfidentialMarketV2.owner();
      console.log("Contract owner:", owner);

      const marketCounter = await ConfidentialMarketV2.marketCounter();
      console.log("Market counter:", marketCounter.toString());
    } catch (e) {
      console.log("Error calling contract functions:", e.message);
    }
  } else {
    console.log("❌ No contract code found at this address");
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
