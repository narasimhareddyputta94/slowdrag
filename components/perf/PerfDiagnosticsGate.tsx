"use client";

import { useEffect, useState } from "react";
import LayoutShiftLogger from "@/components/perf/LayoutShiftLogger";
import WebVitalsReporter from "@/components/perf/WebVitalsReporter";

export default function PerfDiagnosticsGate() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => {
      try {
        const params = new URLSearchParams(window.location.search);
        setEnabled(params.get("vitals") === "1");
      } catch {
        setEnabled(false);
      }
    }, 0);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <>
      <WebVitalsReporter enabled={enabled} />
      <LayoutShiftLogger enabled={enabled} />
    </>
  );
}
