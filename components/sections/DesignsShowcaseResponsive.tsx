"use client";

import React, { useEffect, useState } from "react";
import DesignsShowcase from "./DesignsShowcase";
import MobileDesignShowcase from "./MobileDesignShowcase";

export default function DesignsShowcaseResponsive() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const apply = () => setIsMobile(mq.matches);
    apply();
    mq.addEventListener?.("change", apply);
    return () => mq.removeEventListener?.("change", apply);
  }, []);

  return isMobile ? <MobileDesignShowcase /> : <DesignsShowcase />;
}
