"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const PerfLogger = dynamic(() => import("./PerfLogger"), { ssr: false });

function shouldEnable() {
  if (typeof window === "undefined") return false;
  const dev = process.env.NODE_ENV !== "production";
  const qp = new URLSearchParams(window.location.search);
  return dev || qp.get("perf") === "1";
}

export default function PerfLoggerGate() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => {
      setEnabled(shouldEnable());
    }, 0);
    return () => window.clearTimeout(t);
  }, []);

  if (!enabled) return null;
  return <PerfLogger />;
}
