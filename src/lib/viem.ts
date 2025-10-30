import { createPublicClient, createWalletClient, custom, http } from "viem";
import { sepolia } from "viem/chains";

// Window.ethereum is declared in use-wallet.ts as any
// We reference it here without redeclaring

const RPC_URL: string =
  // Vite front-end env (preferred)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ((typeof import.meta !== 'undefined' && (import.meta as any).env && (import.meta as any).env.VITE_SEPOLIA_RPC_URL)
    // Node-like env (fallback for previews)
    || (typeof process !== 'undefined' && (process as any)?.env?.VITE_SEPOLIA_RPC_URL)
    // Safe default RPC that supports browser CORS
    || 'https://sepolia.drpc.org');

export function getPublicClient() {
  return createPublicClient({ chain: sepolia, transport: http(RPC_URL) });
}

export function getWalletClient() {
  if (typeof window !== "undefined" && window.ethereum) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return createWalletClient({ chain: sepolia, transport: custom(window.ethereum as any) });
  }
  throw new Error("No wallet provider detected");
}


