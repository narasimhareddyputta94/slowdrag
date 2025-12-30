"use client";

import { useEffect } from "react";

type LayoutShiftLoggerProps = {
  enabled?: boolean;
};

export default function LayoutShiftLogger({ enabled = false }: LayoutShiftLoggerProps) {
  useEffect(() => {
    if (!enabled) return;
    if (typeof window === "undefined") return;
    if (typeof PerformanceObserver === "undefined") return;

    let sessionValue = 0;
    let sessionEntries: any[] = [];
    let lastTs = 0;

    const po = new PerformanceObserver((list) => {
      for (const entry of list.getEntries() as any[]) {
        // Ignore shifts after user input.
        if (entry.hadRecentInput) continue;

        const ts = entry.startTime as number;
        const withinSession = ts - lastTs < 1000;
        lastTs = ts;

        if (!withinSession) {
          sessionValue = 0;
          sessionEntries = [];
        }

        sessionValue += entry.value;
        sessionEntries.push(entry);

        // eslint-disable-next-line no-console
        console.log("[CLS shift]", {
          value: entry.value,
          sessionValue,
          sources: entry.sources?.map((s: any) => {
            const node = s.node;
            const tag = node?.tagName?.toLowerCase?.();
            const id = node?.id ? `#${node.id}` : "";
            const cls = node?.className ? `.${String(node.className).replace(/\s+/g, ".")}` : "";
            return {
              node: tag ? `${tag}${id}${cls}` : "(unknown)",
              previousRect: s.previousRect,
              currentRect: s.currentRect,
            };
          }),
        });
      }
    });

    try {
      po.observe({ type: "layout-shift", buffered: true } as any);
    } catch {
      // Older browsers
      po.observe({ entryTypes: ["layout-shift"] } as any);
    }

    return () => po.disconnect();
  }, [enabled]);

  return null;

}
