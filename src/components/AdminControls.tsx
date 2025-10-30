import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/sonner";
import { useWallet } from "@/hooks/use-wallet";
import { getOwner, createMarketOnchain } from "@/lib/contract";

const AdminControls = () => {
  const { account } = useWallet();
  const [isOwner, setIsOwner] = useState(false);
  const [question, setQuestion] = useState("");
  const [days, setDays] = useState("30");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const owner = await getOwner();
        setIsOwner(Boolean(account && owner && owner.toLowerCase() === account.toLowerCase()));
      } catch (e) {
        setIsOwner(false);
      }
    })();
  }, [account]);

  if (!isOwner) return null;

  async function onCreate() {
    try {
      if (!account) {
        toast.error("Please connect your wallet first");
        return;
      }
      if (!question.trim()) {
        toast.error("Please enter a question");
        return;
      }
      const d = parseInt(days, 10);
      if (!Number.isFinite(d) || d <= 0) {
        toast.error("Please enter a valid number of days");
        return;
      }
      setLoading(true);
      const hash = await createMarketOnchain({ question, durationSeconds: BigInt(d * 24 * 60 * 60), account: account as `0x${string}` });
      toast.success(`Market created, tx: ${hash.slice(0, 10)}...`);
      setQuestion("");
    } catch (e) {
      const err = e as { message?: string; shortMessage?: string };
      toast.error(err?.message || err?.shortMessage || "Creation failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="px-4 py-6">
      <div className="max-w-3xl mx-auto glass-card rounded-2xl p-6">
        <h3 className="text-xl font-semibold mb-4">Admin Controls</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="question">Question</Label>
            <Input id="question" value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="Type a market question..." />
          </div>
          <div className="space-y-2">
            <Label htmlFor="days">Duration (days)</Label>
            <Input id="days" value={days} onChange={(e) => setDays(e.target.value)} />
          </div>
        </div>
        <div className="mt-4">
          <Button className="bg-gradient-to-r from-primary to-accent" disabled={loading} onClick={onCreate}>
            {loading ? "Creating..." : "Create Market"}
          </Button>
        </div>
      </div>
    </section>
  );
};

export default AdminControls;


