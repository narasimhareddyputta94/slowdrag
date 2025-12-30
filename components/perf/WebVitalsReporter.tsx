"use client";

import { useReportWebVitals } from "next/web-vitals";

type VitalsRating = "good" | "needs-improvement" | "poor";
type VitalsNavigationType = "navigate" | "reload" | "back-forward" | "prerender";
type MetricExtras = {
  rating?: VitalsRating;
  navigationType?: VitalsNavigationType;
};

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

    const extras = metric as typeof metric & MetricExtras;

    window.__slowdrag_vitals ??= [];
    window.__slowdrag_vitals.push({
      name: metric.name,
      value: metric.value,
      id: metric.id,
      delta: metric.delta,
      rating: extras.rating,
      navigationType: extras.navigationType,
    });

    if (enabled || process.env.NODE_ENV !== "production") {
      console.log("[WebVitals]", metric.name, {
        value: metric.value,
        delta: metric.delta,
        id: metric.id,
        rating: extras.rating,
        nav: extras.navigationType,
      });
    }
  });

  return null;
}
