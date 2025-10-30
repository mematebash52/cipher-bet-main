async function main() {
  const address = "0xECc0e6c47D4544055a8CF9DdE029EcCaACA5287e";

  console.log("Checking markets at:", address);

  const contract = await ethers.getContractAt("ConfidentialMarketV2", address);

  const marketCounter = await contract.marketCounter();
  console.log("\n📊 Total markets created:", marketCounter.toString());

  for (let i = 0; i < marketCounter; i++) {
    console.log(`\n--- Market ${i} ---`);
    const market = await contract.markets(i);
    console.log("Question:", market.question);
    console.log("End Time:", new Date(Number(market.endTime) * 1000).toLocaleString());
    console.log("Resolved:", market.resolved);
    console.log("Total Participants:", market.totalParticipants.toString());
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
