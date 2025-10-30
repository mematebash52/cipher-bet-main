import { useEffect, useState } from "react";
import { getPublicClient } from "@/lib/viem";
import { CONFIDENTIAL_MARKET_ADDRESS } from "@/lib/constants";
import { getMarketInfo } from "@/lib/contract";
import { ConfidentialMarketAbi } from "@/abi/ConfidentialMarket";

export interface Market {
  id: number;
  title: string;
  category: string;
  endDate: string;
  totalVolume: string;
  participants: number;
  options: { name: string; odds: string; percentage: number }[];
}

export function useMarkets() {
  const [markets, setMarkets] = useState<Market[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadMarkets();
  }, []);

  async function loadMarkets() {
    try {
      setLoading(true);
      setError(null);

      const client = getPublicClient();
      // Calculate query window, default 9000 blocks, configurable via VITE_LOGS_WINDOW
      const latest = await client.getBlockNumber();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const windowCfg = (typeof import.meta !== 'undefined' && (import.meta as any).env && (import.meta as any).env.VITE_LOGS_WINDOW)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        || (typeof process !== 'undefined' && (process as any)?.env?.VITE_LOGS_WINDOW)
        || '9000';
      const windowSize = BigInt(parseInt(String(windowCfg), 10) || 9000);
      const fromBlock = latest > windowSize ? latest - windowSize : 0n;

      console.log('📊 Loading markets...', {
        contractAddress: CONFIDENTIAL_MARKET_ADDRESS,
        latestBlock: latest.toString(),
        fromBlock: fromBlock.toString(),
        windowSize: windowSize.toString(),
      });

      // Read MarketCreated events within the window (use ABI to avoid index mismatches)
      let createdLogs = await client.getLogs({
        address: CONFIDENTIAL_MARKET_ADDRESS,
        abi: ConfidentialMarketAbi,
        eventName: 'MarketCreated',
        fromBlock,
        toBlock: 'latest',
      });

      // Fallback: if no logs found, expand to genesis
      if (createdLogs.length === 0 && fromBlock !== 0n) {
        console.warn('⚠️ No MarketCreated logs found in window, retrying from genesis...');
        createdLogs = await client.getLogs({
          address: CONFIDENTIAL_MARKET_ADDRESS,
          abi: ConfidentialMarketAbi,
          eventName: 'MarketCreated',
          fromBlock: 0n,
          toBlock: 'latest',
        });
      }

      console.log(`✅ Found ${createdLogs.length} MarketCreated events`);

      // Deduplicate and keep the latest creation record per id
      const idSet = new Set<number>();
      const ids: number[] = [];
      for (const log of createdLogs) {
        const id = Number(log.args.marketId as bigint);
        if (!idSet.has(id)) {
          idSet.add(id);
          ids.push(id);
        }
      }

      const result: Market[] = [];
      for (const id of ids) {
        try {
          console.log(`📍 Loading market ${id}...`);
          const [question, endTime, resolved, outcome, totalParticipants] = await getMarketInfo(BigInt(id));
          // Count unique participants
          const betLogs = await client.getLogs({
            address: CONFIDENTIAL_MARKET_ADDRESS,
            abi: ConfidentialMarketAbi,
            eventName: 'BetPlaced',
            args: { marketId: BigInt(id) },
            fromBlock,
            toBlock: 'latest',
          });
          const uniqueParticipants = new Set(betLogs.map((l) => l.args.better)).size;
          console.log(`✅ Market ${id} loaded:`, { question, resolved, participants: uniqueParticipants });
          result.push({
            id,
            title: question,
            category: resolved ? (outcome ? 'Resolved: YES' : 'Resolved: NO') : 'Active',
            endDate: new Date(Number(endTime) * 1000).toLocaleString(),
            totalVolume: `$${totalParticipants.toString()}`,
            participants: uniqueParticipants,
            options: [
              { name: 'Yes', odds: '—', percentage: 50 },
              { name: 'No', odds: '—', percentage: 50 },
            ],
          });
        } catch (e) {
          console.warn('❌ Failed to load market info for id', id, e);
        }
      }

      console.log(`🎯 Total markets loaded: ${result.length}`);
      setMarkets(result);
    } catch (err) {
      console.error("Failed to load markets:", err);
      setError("Failed to load market data");
    } finally {
      setLoading(false);
    }
  }

  return { markets, loading, error, reload: loadMarkets };
}
