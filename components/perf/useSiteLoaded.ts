"use client";

/**
 * Previously gated on the loading overlay dismissal.
 * Now returns true immediately — no loading gate.
 */
export default function useSiteLoaded() {
  return true;
}
