"use client";

import { useEffect } from "react";

/** Ochiq overlay (modal, katalog menyusi) ortidagi sahifa siljib ketmasligi uchun. */
export function useScrollLock(active: boolean) {
  useEffect(() => {
    if (!active) return;
    const { body } = document;
    const previous = body.style.getPropertyValue("overflow");
    body.style.setProperty("overflow", "hidden");
    return () => {
      if (previous) body.style.setProperty("overflow", previous);
      else body.style.removeProperty("overflow");
    };
  }, [active]);
}
