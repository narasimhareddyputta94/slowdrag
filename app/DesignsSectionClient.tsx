"use client";

import dynamic from "next/dynamic";
import MountWhenNearViewport from "@/components/perf/MountWhenNearViewport";

const DesignsShowcaseResponsive = dynamic(
  () => import("@/components/sections/DesignsShowcaseResponsive"),
  { ssr: false }
);

export default function DesignsSectionClient() {
  return (
    <MountWhenNearViewport
      placeholder={<section aria-hidden className="relative w-full min-h-screen bg-black" />}
      rootMargin="1400px 0px"
    >
      <DesignsShowcaseResponsive />
    </MountWhenNearViewport>
  );
}
