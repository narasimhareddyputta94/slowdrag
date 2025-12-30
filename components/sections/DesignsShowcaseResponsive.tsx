"use client";

import React, { useEffect, useState } from "react";
import DesignsShowcase from "./DesignsShowcase";
import MobileDesignShowcase from "./MobileDesignShowcase";

export default function DesignsShowcaseResponsive() {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia?.("(max-width: 1023px)")?.matches ?? false;
  });

  useEffect(() => {
    // Treat tablets as "mobile" for this section (Tailwind lg starts at 1024px)
    const mq = window.matchMedia?.("(max-width: 1023px)");
    if (!mq) return;

    const apply = () => setIsMobile(mq.matches);
    apply();

    if (typeof mq.addEventListener === "function") {
      mq.addEventListener("change", apply);
      return () => mq.removeEventListener("change", apply);
    }

    // Legacy Safari
    mq.addListener(apply);
    return () => mq.removeListener(apply);
  }, []);

  return isMobile ? <MobileDesignShowcase /> : <DesignsShowcase />;
}
