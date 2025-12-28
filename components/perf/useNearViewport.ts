"use client";

import type { RefObject } from "react";
import { useEffect, useState } from "react";

type Options = {
  rootMargin?: string;
  threshold?: number | number[];
};

export default function useNearViewport<T extends Element>(
  ref: RefObject<T>,
  { rootMargin = "300px 0px", threshold = 0.01 }: Options = {}
) {
  const [near, setNear] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const obs = new IntersectionObserver(
      (entries) => {
        setNear(entries[0]?.isIntersecting ?? false);
      },
      { rootMargin, threshold }
    );

    obs.observe(el);
    return () => obs.disconnect();
  }, [ref, rootMargin, threshold]);

  return near;
}
