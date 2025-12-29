"use client";

import { useEffect, useState } from "react";

export default function useAfterFirstPaint() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let raf1 = 0;
    let raf2 = 0;

    raf1 = window.requestAnimationFrame(() => {
      raf2 = window.requestAnimationFrame(() => setReady(true));
    });

    return () => {
      window.cancelAnimationFrame(raf1);
      window.cancelAnimationFrame(raf2);
    };
  }, []);

  return ready;
}
