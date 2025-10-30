// FHE SDK initialization and encryption utilities
// Front-end integration via CDN dynamic import

// FHE SDK Types
export interface FHEInstance {
  createEncryptedInput: (contractAddress: string, userAddress: string) => EncryptedInput;
}

interface EncryptedInput {
  add32: (value: number) => void;
  add64: (value: bigint) => void;
  encrypt: () => Promise<{ handles: Uint8Array[]; inputProof: Uint8Array }>;
}

interface FHESDKModule {
  initSDK: () => Promise<void>;
  createInstance: (config: Record<string, unknown>) => Promise<FHEInstance>;
  SepoliaConfig?: Record<string, unknown>;
}

// Note: Window.ethereum type is already declared in use-wallet.ts
// We just reference it here without redeclaring to avoid conflicts

let fheInstance: FHEInstance | null = null;
let initializing: Promise<FHEInstance> | null = null;

export async function initializeFHE(): Promise<FHEInstance> {
  if (fheInstance) return fheInstance;
  if (initializing) return initializing;

  initializing = (async () => {
    try {
      // Get current network chainId
      const chainId = await window.ethereum?.request({ method: 'eth_chainId' }) as string;
      const chainIdNum = parseInt(chainId, 16);

      console.log('FHE SDK: Initializing for chainId', chainIdNum);

      // Dynamic CDN import - type assertions needed for external module
      const sdk = await import(
        'https://cdn.zama.ai/relayer-sdk-js/0.2.0/relayer-sdk-js.js'
      ) as unknown as FHESDKModule;

      const { initSDK, createInstance, SepoliaConfig } = sdk;

      await initSDK();

      // Choose configuration based on network
      let config: Record<string, unknown>;

      if (chainIdNum === 11155111 && SepoliaConfig) {
        // Sepolia testnet - use built-in SepoliaConfig
        console.log('FHE SDK: Using SepoliaConfig for Sepolia testnet');
        config = {
          ...SepoliaConfig,
          network: window.ethereum,
        };
      } else if (chainIdNum === 8009) {
        // Zama Devnet
        console.log('FHE SDK: Using Zama Devnet configuration');
        config = {
          network: window.ethereum,
          networkUrl: 'https://devnet.zama.ai/',
          chainId: chainIdNum,
        };
      } else {
        throw new Error(
          `Unsupported network (Chain ID: ${chainIdNum}).\n\n` +
          'Supported networks:\n' +
          '• Sepolia (Chain ID: 11155111)\n' +
          '• Zama Devnet (Chain ID: 8009)'
        );
      }

      fheInstance = await createInstance(config);
      console.log('FHE SDK: Initialized successfully');
      return fheInstance;
    } catch (error) {
      console.error('FHE SDK initialization failed:', error);
      const err = error as Error;
      throw new Error(err.message || "FHE SDK initialization failed. Please ensure you're connected to a network that supports FHE.");
    }
  })();

  return initializing;
}

export async function getFHE() {
  return initializeFHE();
}

export async function encryptUint32(
  contractAddress: string,
  userAddress: string,
  value: number
): Promise<{ handle: `0x${string}`; proof: `0x${string}` }> {
  const fhe = await initializeFHE();
  const ciphertext = fhe.createEncryptedInput(contractAddress, userAddress);
  ciphertext.add32(value);
  const { handles, inputProof } = await ciphertext.encrypt();
  const handleHex = toHex(handles[0]);
  const proofHex = toHex(inputProof);
  return { handle: handleHex as `0x${string}`, proof: proofHex as `0x${string}` };
}

export async function encryptUint64(
  contractAddress: string,
  userAddress: string,
  value: bigint
): Promise<{ handle: `0x${string}`; proof: `0x${string}` }> {
  const fhe = await initializeFHE();
  const ciphertext = fhe.createEncryptedInput(contractAddress, userAddress);
  ciphertext.add64(value);
  const { handles, inputProof } = await ciphertext.encrypt();
  const handleHex = toHex(handles[0]);
  const proofHex = toHex(inputProof);
  return { handle: handleHex as `0x${string}`, proof: proofHex as `0x${string}` };
}

export async function encryptUint32Batch(
  contractAddress: string,
  userAddress: string,
  values: number[]
): Promise<{ handles: `0x${string}`[]; proof: `0x${string}` }> {
  const fhe = await initializeFHE();
  const ciphertext = fhe.createEncryptedInput(contractAddress, userAddress);
  for (let i = 0; i < values.length; i++) ciphertext.add32(values[i]);
  const { handles, inputProof } = await ciphertext.encrypt();
  const hexHandles = handles.map((h) => toHex(h) as `0x${string}`);
  const proofHex = toHex(inputProof) as `0x${string}`;
  return { handles: hexHandles, proof: proofHex };
}

function toHex(value: string | Uint8Array | number[]): string {
  if (typeof value === 'string' && value.startsWith('0x')) return value;
  const toHexByte = (n: number) => n.toString(16).padStart(2, '0');
  if (value instanceof Uint8Array) {
    let out = '0x';
    for (let i = 0; i < value.length; i++) out += toHexByte(value[i]);
    return out;
  }
  if (Array.isArray(value)) {
    let out = '0x';
    for (let i = 0; i < value.length; i++) out += toHexByte(value[i]);
    return out;
  }
  return String(value);
}


