import { Shield, Lock, Zap, Eye } from "lucide-react";

const features = [
  {
    icon: Lock,
    title: "Fully Homomorphic Encryption (FHE)",
    description: "Bet amounts and choices are encrypted end-to-end to ensure privacy.",
  },
  {
    icon: Shield,
    title: "Secure & Verifiable",
    description: "Results are decrypted upon reveal; the process is transparent and verifiable.",
  },
  {
    icon: Zap,
    title: "Instant Settlement",
    description: "Smart contracts execute automatically, payouts are fast and accurate with no delay.",
  },
  {
    icon: Eye,
    title: "Privacy Protection",
    description: "Other users cannot see your bet details or amounts.",
  },
];

const FeaturesSection = () => {
  return (
    <section className="py-24 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="glow-text">How It Works</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            A privacy-preserving prediction market powered by FHE, keeping your predictions fully confidential.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <div
              key={index}
              className="glass-card rounded-2xl p-6 hover:shadow-[var(--shadow-card)] transition-all group"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mb-4 group-hover:shadow-[var(--shadow-glow)] transition-all">
                <feature.icon className="w-6 h-6 text-background" />
              </div>
              <h3 className="text-xl font-semibold mb-2 group-hover:text-accent transition-colors">
                {feature.title}
              </h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>

        {/* FHE Explanation */}
        <div className="mt-16 glass-card rounded-2xl p-8 border-accent/30">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent to-primary flex items-center justify-center flex-shrink-0">
              <Lock className="w-6 h-6 text-background" />
            </div>
            <div>
              <h3 className="text-2xl font-bold mb-3 glow-accent-text">
                What is Fully Homomorphic Encryption (FHE)?
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                Fully Homomorphic Encryption allows computation directly on encrypted data without decryption. In prediction markets, this means:
                <br />
                <br />
                <span className="text-accent">1.</span> Your bet amounts and choices are encrypted at submission
                <br />
                <span className="text-accent">2.</span> Odds calculation and market stats run on encrypted data
                <br />
                <span className="text-accent">3.</span> Only upon result reveal are values decrypted for automatic payouts
                <br />
                <br />
                This ensures privacy and fairness throughout the process—no one can see the market’s direction before reveal.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
