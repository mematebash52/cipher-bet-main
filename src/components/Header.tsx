import { Wallet, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWallet } from "@/hooks/use-wallet";
import { toast } from "@/components/ui/sonner";

const Header = () => {
  const { account, connecting, connect, disconnect } = useWallet();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 px-4 py-4">
      <div className="max-w-7xl mx-auto">
        <div className="glass-card rounded-2xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <span className="text-xl font-bold">🔐</span>
            </div>
            <span className="text-xl font-bold glow-text hidden sm:inline">
              Encrypted Market
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-6">
            <a
              href="#markets"
              className="text-muted-foreground hover:text-accent transition-colors cursor-pointer"
              onClick={(e) => {
                e.preventDefault();
                const element = document.getElementById('markets');
                if (element) {
                  const offset = 100; // Header height + extra offset
                  const elementPosition = element.getBoundingClientRect().top;
                  const offsetPosition = elementPosition + window.pageYOffset - offset;
                  window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
                }
              }}
            >
              Markets
            </a>
            <a
              href="#how-it-works"
              className="text-muted-foreground hover:text-accent transition-colors cursor-pointer"
              onClick={(e) => {
                e.preventDefault();
                const element = document.getElementById('how-it-works');
                if (element) {
                  const offset = 100;
                  const elementPosition = element.getBoundingClientRect().top;
                  const offsetPosition = elementPosition + window.pageYOffset - offset;
                  window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
                }
              }}
            >
              How It Works
            </a>
            <a
              href="#about"
              className="text-muted-foreground hover:text-accent transition-colors cursor-pointer"
              onClick={(e) => {
                e.preventDefault();
                const element = document.getElementById('about');
                if (element) {
                  const offset = 100;
                  const elementPosition = element.getBoundingClientRect().top;
                  const offsetPosition = elementPosition + window.pageYOffset - offset;
                  window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
                }
              }}
            >
              About
            </a>
          </nav>

          <div className="flex items-center gap-3">
            {account ? (
              <Button
                className="bg-gradient-to-r from-primary to-accent hover:shadow-[var(--shadow-glow)] transition-all"
                onClick={() => {
                  disconnect();
                  toast("Wallet disconnected");
                }}
              >
                <Wallet className="w-4 h-4 mr-2" />
                {account.slice(0, 6)}...{account.slice(-4)}
              </Button>
            ) : (
              <Button
                className="bg-gradient-to-r from-primary to-accent hover:shadow-[var(--shadow-glow)] transition-all"
                disabled={connecting}
                onClick={async () => {
                  try {
                    await connect();
                    toast("Wallet connected");
                  } catch (e) {
                    const error = e as Error;
                    toast(error?.message ?? "Failed to connect wallet");
                  }
                }}
              >
                <Wallet className="w-4 h-4 mr-2" />
                {connecting ? "Connecting..." : "Connect Wallet"}
              </Button>
            )}
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
