"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Bitta tugma uchun "so'rov ketyapti" holati: ikki marta bosilsa ikkinchi so'rov yuborilmaydi
 * va komponent yopilib ketgan bo'lsa setState chaqirilmaydi.
 */
export function useAsyncAction() {
  const [pending, setPending] = useState(false);
  const running = useRef(false);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);
  const run = useCallback(async (action: () => Promise<unknown>) => {
    if (running.current) return;
    running.current = true;
    setPending(true);
    try { await action(); }
    finally {
      running.current = false;
      if (mounted.current) setPending(false);
    }
  }, []);
  return { pending, run };
}
