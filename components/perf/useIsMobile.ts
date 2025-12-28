"use client";

import { useEffect, useState } from "react";

export default function useIsMobile(breakpointPx = 768) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia?.(`(max-width: ${breakpointPx}px)`);
    if (!mql) return;

    const onChange = () => setIsMobile(mql.matches);
    onChange();

    if (typeof mql.addEventListener === "function") {
      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener("change", onChange);
    }

    // Legacy Safari
    mql.addListener(onChange);
    return () => mql.removeListener(onChange);
  }, [breakpointPx]);

  return isMobile;
}
