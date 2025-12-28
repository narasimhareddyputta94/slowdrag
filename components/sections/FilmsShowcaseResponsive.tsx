"use client";

import React, { useEffect, useState } from "react";
import FilmsShowcase from "./FilmsShowcase";
import MobileFilmsShowcase from "./MobileFilmsShowcase";

export default function FilmsShowcaseResponsive() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const apply = () => setIsMobile(mq.matches);
    apply();
    mq.addEventListener?.("change", apply);
    return () => mq.removeEventListener?.("change", apply);
  }, []);

  return isMobile ? <MobileFilmsShowcase /> : <FilmsShowcase />;
}
