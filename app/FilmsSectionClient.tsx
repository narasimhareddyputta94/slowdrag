"use client";

import dynamic from "next/dynamic";
import MountWhenNearViewport from "@/components/perf/MountWhenNearViewport";

const FilmsShowcaseResponsive = dynamic(
  () => import("@/components/sections/FilmsShowcaseResponsive"),
  { ssr: false }
);

export default function FilmsSectionClient() {
  return (
    <MountWhenNearViewport
      placeholder={<section aria-hidden className="relative w-full min-h-screen bg-black" />}
      rootMargin="150px 0px"
    >
      <FilmsShowcaseResponsive />
    </MountWhenNearViewport>
  );
}
