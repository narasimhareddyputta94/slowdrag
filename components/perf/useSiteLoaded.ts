"use client";

import { useEffect, useState } from "react";

declare global {
  interface Window {
    __slowdrag_siteLoaded?: boolean;
  }
}

export default function useSiteLoaded() {
  const [siteLoaded, setSiteLoaded] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.__slowdrag_siteLoaded === true;
  });

  useEffect(() => {
    if (siteLoaded) return;

    const onLoaded = () => {
      window.__slowdrag_siteLoaded = true;
      setSiteLoaded(true);
    };

    window.addEventListener("slowdrag:siteLoaded", onLoaded);
    return () => window.removeEventListener("slowdrag:siteLoaded", onLoaded);
  }, [siteLoaded]);

  return siteLoaded;
}
