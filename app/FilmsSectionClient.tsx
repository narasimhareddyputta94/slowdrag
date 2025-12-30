"use client";

import dynamic from "next/dynamic";
import MountWhenNearViewport from "@/components/perf/MountWhenNearViewport";

const FilmsShowcaseResponsive = dynamic(
  () => import("@/components/sections/FilmsShowcaseResponsive"),
  {
    ssr: false,
    // Critical for CLS: dynamic() renders null while chunk loads unless we provide a placeholder.
    loading: () => <section aria-hidden="true" className="relative w-full min-h-screen bg-black" />,
  }
);

export default function FilmsSectionClient() {
  return (
    <MountWhenNearViewport
      placeholder={<section aria-hidden="true" className="relative w-full min-h-screen bg-black" />}
      rootMargin="150px 0px"
    >
      <FilmsShowcaseResponsive />
    </MountWhenNearViewport>
  );
}
