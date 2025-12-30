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
    setEnabled(shouldEnable());
  }, []);

  if (!enabled) return null;
  return <PerfLogger />;
}
