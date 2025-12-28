"use client";

import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";

const DesignsShowcase = dynamic(() => import("./DesignsShowcase"), {
  ssr: true,
});
const MobileDesignShowcase = dynamic(() => import("./MobileDesignShowcase"), {
  ssr: true,
});

export default function DesignsShowcaseResponsive() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Treat tablets as "mobile" for this section (Tailwind lg starts at 1024px)
    const mq = window.matchMedia("(max-width: 1023px)");
    const apply = () => setIsMobile(mq.matches);
    apply();
    mq.addEventListener?.("change", apply);
    return () => mq.removeEventListener?.("change", apply);
  }, []);

  return isMobile ? <MobileDesignShowcase /> : <DesignsShowcase />;
}
