import { useEffect, useState } from "react";
import { getPublicClient } from "@/lib/viem";
import { CONFIDENTIAL_MARKET_ADDRESS } from "@/lib/constants";
import { getMarketInfo, getMarketCounter } from "@/lib/contract";
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

      // Helper: fetch logs in chunks to avoid freetier 10k-block range limits
      async function fetchLogsChunked<TLog = unknown>(params: {
        startBlock: bigint;
        endBlock: bigint;
        chunkSize?: bigint;
        address: `0x${string}`;
        eventName: string;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        args?: any;
      }) {
        const maxRange = params.chunkSize ?? 9000n; // keep below 10000
        const all: TLog[] = [] as TLog[];
        let start = params.startBlock;
        while (start <= params.endBlock) {
          const end = (start + maxRange) < params.endBlock ? (start + maxRange) : params.endBlock;
          // @ts-expect-error viem typed generics
          const part = await client.getLogs({
            address: params.address,
            abi: ConfidentialMarketAbi,
            eventName: params.eventName as never,
            fromBlock: start,
            toBlock: end,
            args: params.args,
          });
          // @ts-expect-error accumulate logs
          all.push(...part);
          start = end + 1n;
        }
        return all as TLog[];
      }

      // Prefer counter-based enumeration to avoid heavy log queries
      let result: Market[] = [];
      try {
        const counter = await getMarketCounter();
        console.log(`🔢 marketCounter = ${counter.toString()}`);
        const total = Number(counter);
        for (let id = 1; id <= total; id++) {
          try {
            console.log(`📍 Loading market ${id} via counter...`);
            const [question, endTime, resolved, outcome, totalParticipants] = await getMarketInfo(BigInt(id));
            result.push({
              id,
              title: question,
              category: resolved ? (outcome ? 'Resolved: YES' : 'Resolved: NO') : 'Active',
              endDate: new Date(Number(endTime) * 1000).toLocaleString(),
              totalVolume: `$${totalParticipants.toString()}`,
              participants: Number(totalParticipants),
              options: [
                { name: 'Yes', odds: '—', percentage: 50 },
                { name: 'No', odds: '—', percentage: 50 },
              ],
            });
          } catch (e) {
            console.warn('❌ Failed to load market via counter for id', id, e);
          }
        }
      } catch (e) {
        console.warn('⚠️ counter path failed, fallback to logs...', e);
        // If counter fails, fallback to logs in small chunks
        const createdLogs = await fetchLogsChunked({
          address: CONFIDENTIAL_MARKET_ADDRESS,
          eventName: 'MarketCreated',
          startBlock: 0n,
          endBlock: latest,
        });
        console.log(`✅ Found ${createdLogs.length} MarketCreated events (chunked)`);
        const idSet = new Set<number>();
        const ids: number[] = [];
        for (const log of createdLogs) {
          const id = Number(log.args.marketId as bigint);
          if (!idSet.has(id)) {
            idSet.add(id);
            ids.push(id);
          }
        }
        for (const id of ids) {
          try {
            const [question, endTime, resolved, outcome, totalParticipants] = await getMarketInfo(BigInt(id));
            result.push({
              id,
              title: question,
              category: resolved ? (outcome ? 'Resolved: YES' : 'Resolved: NO') : 'Active',
              endDate: new Date(Number(endTime) * 1000).toLocaleString(),
              totalVolume: `$${totalParticipants.toString()}`,
              participants: Number(totalParticipants),
              options: [
                { name: 'Yes', odds: '—', percentage: 50 },
                { name: 'No', odds: '—', percentage: 50 },
              ],
            });
          } catch (e2) {
            console.warn('❌ Failed to load market info for id', id, e2);
          }
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
