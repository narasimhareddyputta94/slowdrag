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
      {!ready ? (
        <InitialLoadingOverlay
          src={loaderSrc}
          minVisibleMs={2000}
          waitForDocumentComplete
          onDismissed={() => setReady(true)}
        />
      ) : null}

      {/*
        Keep the page mounted behind the overlay so the hero can boot and emit
        `slowdrag:heroReady`. We only *reveal* the page once the overlay dismisses.
      */}
      <div
        aria-hidden={!ready}
        style={{
          opacity: ready ? 1 : 0,
          visibility: ready ? "visible" : "hidden",
          pointerEvents: ready ? "auto" : "none",
          transition: "opacity 420ms ease",
        }}
      >
        {children}
      </div>
    </>
  );
}
