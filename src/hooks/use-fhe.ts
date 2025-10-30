import { useEffect, useRef, useState } from "react";
import { initializeFHE, type FHEInstance } from "@/lib/fhe";

export function useFHE() {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const instanceRef = useRef<FHEInstance | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const inst = await initializeFHE();
        if (cancelled) return;
        instanceRef.current = inst;
        setReady(true);
      } catch (e) {
        if (cancelled) return;
        const error = e as Error;
        setError(error?.message ?? String(e));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return {
    ready,
    error,
    instance: instanceRef.current,
  } as const;
}


