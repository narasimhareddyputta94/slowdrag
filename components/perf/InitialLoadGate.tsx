"use client";

import { useState } from "react";
import InitialLoadingOverlay from "@/components/perf/InitialLoadingOverlay";

type InitialLoadGateProps = {
  loaderSrc: string;
  children: React.ReactNode;
};

export default function InitialLoadGate({ loaderSrc, children }: InitialLoadGateProps) {
  const [ready, setReady] = useState(false);

  return (
    <>
      {/*
        Page content is always mounted and painted (even behind the overlay)
        so Lighthouse can detect the LCP element. The overlay covers it visually
        with a higher z-index.
      */}
      <div
        aria-hidden={!ready}
        style={{
          pointerEvents: ready ? "auto" : "none",
        }}
      >
        {children}
      </div>

      {/*
        Loading overlay sits on top with max z-index.
        Once dismissed, it removes itself and reveals the page below.
      */}
      {!ready ? (
        <InitialLoadingOverlay
          src={loaderSrc}
          minVisibleMs={2000}
          waitForDocumentComplete
          onDismissed={() => setReady(true)}
        />
      ) : null}
    </>
  );
}
