import { getPublicClient, getWalletClient } from "./viem";
import { ConfidentialMarketAbi } from "@/abi/ConfidentialMarket";
import { CONFIDENTIAL_MARKET_ADDRESS } from "./constants";
import type { Address } from "viem";

export async function placeBetOnchain(params: {
  marketId: bigint;
  handle: `0x${string}`;
  proof: `0x${string}`;
  account: Address;
  contractAddress?: Address;
}) {
  const wallet = getWalletClient();
  const hash = await wallet.writeContract({
    address: (params.contractAddress ?? CONFIDENTIAL_MARKET_ADDRESS) as Address,
    abi: ConfidentialMarketAbi,
    functionName: "placeBet",
    args: [params.marketId, params.handle, params.proof],
    account: params.account,
    chain: wallet.chain,
    gas: 10000000n, // Set a reasonable gas limit, below network max 16777216
  });
  const pub = getPublicClient();
  await pub.waitForTransactionReceipt({ hash });
  return hash;
}

export async function getMarket(params: {
  marketId: bigint;
  contractAddress?: Address;
}) {
  const pub = getPublicClient();
  // @ts-expect-error viem readonly abi inference is incompatible with our const tuple typings
  const result = await pub.readContract({
    address: (params.contractAddress ?? CONFIDENTIAL_MARKET_ADDRESS) as Address,
    abi: ConfidentialMarketAbi,
    functionName: "getMarket",
    args: [params.marketId],
  });
  return result as [bigint, bigint]; // [yesVotes, noVotes]
}

export async function watchBetPlaced(
  onEvent: (e: { marketId: bigint; better: Address }) => void,
  opts?: { contractAddress?: Address }
) {
  const pub = getPublicClient();
  return pub.watchContractEvent({
    address: (opts?.contractAddress ?? CONFIDENTIAL_MARKET_ADDRESS) as Address,
    abi: ConfidentialMarketAbi,
    eventName: "BetPlaced",
    onLogs(logs) {
      for (const l of logs) {
        const args = l.args as { marketId?: bigint; better?: Address };
        if (args.marketId !== undefined && args.better !== undefined) {
          onEvent({ marketId: args.marketId, better: args.better });
        }
      }
    },
  });
}

export async function getOwner(contractAddress?: Address) {
  const pub = getPublicClient();
  // @ts-expect-error viem readonly abi inference is incompatible with our const tuple typings
  const owner = await pub.readContract({
    address: (contractAddress ?? CONFIDENTIAL_MARKET_ADDRESS) as Address,
    abi: ConfidentialMarketAbi,
    functionName: "owner",
    args: [],
  });
  return owner as Address;
}

export async function getMarketInfo(marketId: bigint, contractAddress?: Address) {
  const pub = getPublicClient();
  // @ts-expect-error viem readonly abi inference is incompatible with our const tuple typings
  const info = await pub.readContract({
    address: (contractAddress ?? CONFIDENTIAL_MARKET_ADDRESS) as Address,
    abi: ConfidentialMarketAbi,
    functionName: "getMarketInfo",
    args: [marketId],
  });
  return info as [string, bigint, boolean, boolean, bigint];
}

export async function getMarketCounter(contractAddress?: Address) {
  const pub = getPublicClient();
  // @ts-expect-error viem readonly abi inference is incompatible with our const tuple typings
  const counter = await pub.readContract({
    address: (contractAddress ?? CONFIDENTIAL_MARKET_ADDRESS) as Address,
    abi: ConfidentialMarketAbi,
    functionName: "marketCounter",
    args: [],
  });
  return counter as bigint;
}

export async function createMarketOnchain(params: { question: string; durationSeconds: bigint; account: Address; contractAddress?: Address; }) {
  const wallet = getWalletClient();
  const hash = await wallet.writeContract({
    address: (params.contractAddress ?? CONFIDENTIAL_MARKET_ADDRESS) as Address,
    abi: ConfidentialMarketAbi,
    functionName: "createMarket",
    args: [params.question, params.durationSeconds],
    account: params.account,
    chain: wallet.chain,
    gas: 5000000n, // Set a reasonable gas limit
  });
  const pub = getPublicClient();
  await pub.waitForTransactionReceipt({ hash });
  return hash;
}

export async function resolveMarketOnchain(params: { marketId: bigint; outcome: boolean; account: Address; contractAddress?: Address; }) {
  const wallet = getWalletClient();
  const hash = await wallet.writeContract({
    address: (params.contractAddress ?? CONFIDENTIAL_MARKET_ADDRESS) as Address,
    abi: ConfidentialMarketAbi,
    functionName: "resolveMarket",
    args: [params.marketId, params.outcome],
    account: params.account,
    chain: wallet.chain,
    gas: 3000000n, // Set a reasonable gas limit
  });
  const pub = getPublicClient();
  await pub.waitForTransactionReceipt({ hash });
  return hash;
}


