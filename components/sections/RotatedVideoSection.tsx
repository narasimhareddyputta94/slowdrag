export default function RotatedVideoSection() {
  return (
    <section
      aria-label="Rotated video"
      className="relative overflow-hidden"
      // Size the wrapper to the video's *rotated* aspect ratio.
      // Source video is 766x3194 (portrait). Rotated 90deg => 3194x766 (very wide).
      // Using the correct aspect ratio removes the extra vertical whitespace.
      style={{ width: "100vw", aspectRatio: "3194 / 766" }}
    >
      <video
        className="absolute left-1/2 top-1/2"
        style={{
          // With rotate(90deg), the bounding-box width equals the element's height.
          // So setting element height to 100vw guarantees the rotated video spans full screen width.
          height: "100vw",
          width: "auto",
          maxWidth: "none",
          maxHeight: "none",
          display: "block",
          transform: "translate(-50%, -50%) rotate(90deg)",
          transformOrigin: "center",
          objectFit: "contain",
        }}
        src="/images/IMG_2293.MP4"
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
      />
    </section>
  );
}
