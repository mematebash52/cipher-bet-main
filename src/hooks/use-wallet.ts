import { useCallback, useEffect, useState } from "react";

interface EthereumProvider {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on?: (event: string, callback: (...args: unknown[]) => void) => void;
  removeListener?: (event: string, callback: (...args: unknown[]) => void) => void;
}

declare global {
  interface Window {
    ethereum?: EthereumProvider;
  }
}

export function useWallet() {
  const [account, setAccount] = useState<string | null>(null);
  const [chainId, setChainId] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);

  const connect = useCallback(async () => {
    if (!window.ethereum) throw new Error("No wallet detected (MetaMask)");
    setConnecting(true);
    try {
      const accs = await window.ethereum.request({ method: "eth_requestAccounts" }) as string[];
      setAccount(accs?.[0] ?? null);
      const cid = await window.ethereum.request({ method: "eth_chainId" }) as string;
      setChainId(cid);
    } finally {
      setConnecting(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    setAccount(null);
  }, []);

  // 自动检测已连接的账户
  useEffect(() => {
    if (!window.ethereum) return;

    // 检查是否已经连接
    const checkConnection = async () => {
      try {
        const accs = await window.ethereum.request({ method: "eth_accounts" }) as string[];
        if (accs && accs.length > 0) {
          setAccount(accs[0]);
          const cid = await window.ethereum.request({ method: "eth_chainId" }) as string;
          setChainId(cid);
        }
      } catch (error) {
        console.error("Failed to check wallet connection:", error);
      }
    };

    checkConnection();

    const handleAccountsChanged = (accs: string[]) => setAccount(accs?.[0] ?? null);
    const handleChainChanged = (cid: string) => setChainId(cid);
    window.ethereum.on?.("accountsChanged", handleAccountsChanged);
    window.ethereum.on?.("chainChanged", handleChainChanged);
    return () => {
      window.ethereum?.removeListener?.("accountsChanged", handleAccountsChanged);
      window.ethereum?.removeListener?.("chainChanged", handleChainChanged);
    };
  }, []);

  return { account, chainId, connecting, connect, disconnect } as const;
}


