"use client";

import { useEffect, useMemo, useState } from "react";

type LayoutShiftLoggerProps = {
  enabled?: boolean;
};

type LayoutShiftAttribution = {
  node?: Element;
  previousRect?: DOMRectReadOnly;
  currentRect?: DOMRectReadOnly;
};

type LayoutShiftEntry = PerformanceEntry & {
  value: number;
  hadRecentInput: boolean;
  sources?: LayoutShiftAttribution[];
};

type ClsShiftRecord = {
  ts: number;
  value: number;
  sessionValue: number;
  sources: Array<{
    node: string;
    previousRect?: DOMRectReadOnly;
    currentRect?: DOMRectReadOnly;
  }>;
};

export default function LayoutShiftLogger({ enabled = false }: LayoutShiftLoggerProps) {
  const [recent, setRecent] = useState<ClsShiftRecord[]>([]);
  const [total, setTotal] = useState(0);

  const lines = useMemo(() => {
    if (!enabled) return [];
    const out: string[] = [];
    out.push(`CLS total: ${total.toFixed(3)}`);
    out.push("\u2014\u2014\u2014");
    for (const r of recent) {
      const topNode = r.sources[0]?.node ?? "(unknown)";
      out.push(`${r.value.toFixed(3)}  session:${r.sessionValue.toFixed(3)}  ${topNode}`);
    }
    return out;
  }, [enabled, recent, total]);

  useEffect(() => {
    if (!enabled) return;
    if (typeof window === "undefined") return;
    if (typeof PerformanceObserver === "undefined") return;

    let sessionValue = 0;
    let lastTs = 0;
    let totalValue = 0;

    const po = new PerformanceObserver((list) => {
      for (const rawEntry of list.getEntries()) {
        const entry = rawEntry as LayoutShiftEntry;
        // Ignore shifts after user input.
        if (entry.hadRecentInput) continue;

        const ts = entry.startTime as number;
        const withinSession = ts - lastTs < 1000;
        lastTs = ts;

        if (!withinSession) {
          sessionValue = 0;
        }

        sessionValue += entry.value;
        totalValue += entry.value;
        const record: ClsShiftRecord = {
          ts,
          value: entry.value,
          sessionValue,
          sources:
            entry.sources?.map((s) => {
              const node = s.node;
              const tag = node?.tagName?.toLowerCase?.();
              const id = node?.id ? `#${node.id}` : "";
              const cls = node?.className
                ? `.${String(node.className).replace(/\s+/g, ".")}`
                : "";
              return {
                node: tag ? `${tag}${id}${cls}` : "(unknown)",
                previousRect: s.previousRect,
                currentRect: s.currentRect,
              };
            }) ?? [],
        };

        // Stash for quick copy/paste without DevTools.
        (window as unknown as { __slowdrag_cls?: ClsShiftRecord[] }).__slowdrag_cls ??= [];
        (window as unknown as { __slowdrag_cls?: ClsShiftRecord[] }).__slowdrag_cls!.push(record);

        setTotal(totalValue);
        setRecent((prev) => {
          const next = [record, ...prev];
          return next.slice(0, 6);
        });

        console.log("[CLS shift]", {
          value: entry.value,
          sessionValue,
          sources: record.sources,
        });
      }
    });

    try {
      po.observe({ type: "layout-shift", buffered: true } as unknown as PerformanceObserverInit);
    } catch {
      // Older browsers
      po.observe({ entryTypes: ["layout-shift"] } as PerformanceObserverInit);
    }

    return () => po.disconnect();
  }, [enabled]);

  if (!enabled) return null;

  return (
    <pre
      aria-hidden="true"
      style={{
        position: "fixed",
        left: 10,
        bottom: 10,
        zIndex: 2147483647,
        margin: 0,
        padding: "10px 12px",
        maxWidth: "min(92vw, 720px)",
        background: "rgba(0,0,0,0.70)",
        color: "#fff",
        border: "1px solid rgba(255,255,255,0.14)",
        borderRadius: 10,
        fontSize: 12,
        lineHeight: 1.35,
        pointerEvents: "none",
        whiteSpace: "pre-wrap",
      }}
    >
      {lines.join("\n")}
    </pre>
  );
}
