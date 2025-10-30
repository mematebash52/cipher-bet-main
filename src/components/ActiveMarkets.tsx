import MarketCard from "./MarketCard";
import { useMarkets } from "@/hooks/use-markets";

const ActiveMarkets = () => {
  const { markets, loading, error } = useMarkets();

  return (
    <section className="py-24 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Active Markets
            </span>
          </h2>
          <p className="text-xl text-muted-foreground">
            加密预测热门市场，选择您感兴趣的话题参与
          </p>
        </div>

        {loading && (
          <div className="text-center text-muted-foreground">
            加载市场数据中...
          </div>
        )}

        {error && (
          <div className="text-center text-destructive">
            {error}
          </div>
        )}

        {!loading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {markets.map((market) => (
              <MarketCard key={market.id} marketId={market.id} {...market} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default ActiveMarkets;
