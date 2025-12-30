"use client";

import { useReportWebVitals } from "next/web-vitals";

type WebVitalsReporterProps = {
  /** Enable console logging in production (e.g. via query param gate). */
  enabled?: boolean;
};

declare global {
  interface Window {
    __slowdrag_vitals?: Array<{
      name: string;
      value: number;
      id: string;
      delta: number;
      rating?: string;
      navigationType?: string;
    }>;
  }
}

export default function WebVitalsReporter({ enabled = false }: WebVitalsReporterProps) {
  useReportWebVitals((metric) => {
    if (typeof window === "undefined") return;

    window.__slowdrag_vitals ??= [];
    window.__slowdrag_vitals.push({
      name: metric.name,
      value: metric.value,
      id: metric.id,
      delta: metric.delta,
      rating: (metric as any).rating,
      navigationType: (metric as any).navigationType,
    });

    if (enabled || process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.log("[WebVitals]", metric.name, {
        value: metric.value,
        delta: metric.delta,
        id: metric.id,
        rating: (metric as any).rating,
        nav: (metric as any).navigationType,
      });
    }
  });

  return null;

}
