"use client";

import dynamic from "next/dynamic";
import MountWhenNearViewport from "@/components/perf/MountWhenNearViewport";

const RotatedVideoSection = dynamic(
  () => import("@/components/sections/RotatedVideoSection"),
  { ssr: false }
);

export default function RotatedVideoSectionClient() {
  return (
    <MountWhenNearViewport
      placeholder={
        <section
          aria-hidden
          className="relative w-full bg-black"
          style={{ width: "100vw", aspectRatio: "3194 / 766" }}
        />
      }
      rootMargin="800px 0px"
    >
      <RotatedVideoSection />
    </MountWhenNearViewport>
  );
}
