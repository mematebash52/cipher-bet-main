import { Shield, Lock, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";

const Hero = () => {
  function scrollToMarkets() {
    const el = document.getElementById("markets");
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      window.location.hash = "#markets";
    }
  }
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center px-4 overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/20 rounded-full blur-[100px] animate-pulse delay-1000" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 mb-6 glass-card rounded-full">
          <Shield className="w-4 h-4 text-accent" />
          <span className="text-sm font-medium text-muted-foreground">
            Powered by FHE Technology
          </span>
        </div>

        <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
          <span className="glow-text">Encrypted</span>
          <br />
          <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Prediction Market
          </span>
        </h1>

        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
          A privacy-preserving prediction market. Bets and odds are fully encrypted;
          results are decrypted and settled after they are revealed.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
          <Button 
            size="lg" 
            className="bg-gradient-to-r from-primary to-primary-glow hover:shadow-[var(--shadow-glow)] transition-all"
            onClick={scrollToMarkets}
          >
            <Lock className="w-4 h-4 mr-2" />
            Start Encrypted Betting
          </Button>
          <Button 
            size="lg" 
            variant="outline"
            className="border-accent text-accent hover:bg-accent/10"
            onClick={scrollToMarkets}
          >
            <TrendingUp className="w-4 h-4 mr-2" />
            Explore Markets
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
          {[
            { label: "Total Volume", value: "$2.4M", icon: TrendingUp },
            { label: "Active Markets", value: "127", icon: Shield },
            { label: "Encrypted Bets", value: "15.8K", icon: Lock },
          ].map((stat) => (
            <div key={stat.label} className="glass-card rounded-xl p-6 hover:shadow-[var(--shadow-card)] transition-all">
              <stat.icon className="w-6 h-6 text-accent mb-2 mx-auto" />
              <div className="text-3xl font-bold glow-accent-text mb-1">{stat.value}</div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Hero;
