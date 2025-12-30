"use client";

import { useMemo } from "react";
import LayoutShiftLogger from "@/components/perf/LayoutShiftLogger";
import WebVitalsReporter from "@/components/perf/WebVitalsReporter";

export default function PerfDiagnosticsGate() {
  const enabled = useMemo(() => {
    if (typeof window === "undefined") return false;
    try {
      const params = new URLSearchParams(window.location.search);
      return params.get("vitals") === "1";
    } catch {
      return false;
    }
  }, []);

  return (
    <>
      <WebVitalsReporter enabled={enabled} />
      <LayoutShiftLogger enabled={enabled} />
    </>
  );
}
