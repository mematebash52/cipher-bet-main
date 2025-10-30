import { Lock, TrendingUp, Users, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useWallet } from "@/hooks/use-wallet";
import { useFHE } from "@/hooks/use-fhe";
import { encryptUint32 } from "@/lib/fhe";
import { toast } from "@/components/ui/sonner";
import { CONFIDENTIAL_MARKET_ADDRESS } from "@/lib/constants";
import { useState } from "react";

interface MarketCardProps {
  marketId: number;
  title: string;
  category: string;
  endDate: string;
  totalVolume: string;
  participants: number;
  options: { name: string; odds: string; percentage: number }[];
}

const MarketCard = ({
  marketId,
  title,
  category,
  endDate,
  totalVolume,
  participants,
  options,
}: MarketCardProps) => {
  const { account } = useWallet();
  const { ready, error: fheError } = useFHE();
  const [loadingOption, setLoadingOption] = useState<number | null>(null);

  async function onPlaceEncryptedBet(optionIndex: number) {
    // Immediately set loading state
    setLoadingOption(optionIndex);

    try {
      // Perform checks inside try block
      if (!account) {
        toast.error("Please connect your wallet first");
        return;
      }
      if (!ready) {
        if (fheError) {
          toast.error(fheError, { duration: 6000 });
        } else {
          toast.error("FHE is initializing, please try again later");
        }
        return;
      }
      toast.info("Generating encryption proof...");
      const { handle, proof } = await encryptUint32(CONFIDENTIAL_MARKET_ADDRESS, account, optionIndex);

      toast.info("Sending transaction...");
      const { placeBetOnchain } = await import("@/lib/contract");
      const hash = await placeBetOnchain({
        marketId: BigInt(marketId),
        handle,
        proof,
        account: account as `0x${string}`,
      });

      toast.success(`Bet placed! Tx hash: ${hash.slice(0, 10)}...`);
      toast.info("Your vote is encrypted on-chain, privacy protected 🔒");
    } catch (e) {
      console.error("Bet failed:", e);
      const error = e as { message?: string; shortMessage?: string; name?: string };

      // 检查是否是用户取消交易
      if (error?.message?.includes("User rejected") ||
          error?.message?.includes("User denied") ||
          error?.shortMessage?.includes("User rejected")) {
        toast.info("Transaction cancelled");
        return;
      }

      // 检查其他常见错误
      if (error?.message?.includes("insufficient funds")) {
        toast.error("Insufficient funds. Ensure you have enough ETH for gas.");
        return;
      }

      if (error?.message?.includes("Already voted")) {
        toast.error("You have already voted on this market");
        return;
      }

      // 显示通用错误消息
      toast.error(error?.shortMessage || error?.message || "Bet failed, please retry");
    } finally {
      setLoadingOption(null);
    }
  }
  return (
    <div className="glass-card rounded-2xl p-6 hover:shadow-[var(--shadow-card)] transition-all group">
      <div className="flex items-start justify-between mb-4">
        <Badge variant="outline" className="border-accent text-accent">
          {category}
        </Badge>
        <Lock className="w-4 h-4 text-primary group-hover:text-accent transition-colors" />
      </div>

      <h3 className="text-xl font-semibold mb-4 line-clamp-2 group-hover:text-accent transition-colors">
        {title}
      </h3>

      <div className="space-y-3 mb-6">
        {options.map((option, index) => (
          <div key={index} className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-foreground">{option.name}</span>
              <span className="font-bold text-accent">{option.odds}</span>
            </div>
            <div className="relative h-2 bg-secondary rounded-full overflow-hidden">
              <div
                className="absolute left-0 top-0 h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all"
                style={{ width: `${option.percentage}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between mb-4 pt-4 border-t border-border">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <TrendingUp className="w-4 h-4" />
            <span>{totalVolume}</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="w-4 h-4" />
            <span>{participants}</span>
          </div>
        </div>
        <span className="text-xs text-muted-foreground">Ends {endDate}</span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {options.map((o, i) => {
          const isLoading = loadingOption === i;
          const isAnyLoading = loadingOption !== null;

          return (
            <Button
              key={o.name}
              className="bg-gradient-to-r from-primary to-primary-glow hover:shadow-[var(--shadow-glow)] transition-all"
              onClick={() => onPlaceEncryptedBet(i)}
              disabled={isAnyLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4 mr-2" />
                  Bet {o.name}
                </>
              )}
            </Button>
          );
        })}
      </div>
    </div>
  );
};

export default MarketCard;
