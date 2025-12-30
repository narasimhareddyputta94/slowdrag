import Footer from "@/components/footer/Footer";
import HomeClient from "@/app/HomeClient";
import FilmsSectionClient from "./FilmsSectionClient";
import DesignsSectionClient from "./DesignsSectionClient";
import InitialLoadingOverlay from "@/components/perf/InitialLoadingOverlay";
import MountWhenNearViewport from "@/components/perf/MountWhenNearViewport";
import ManifestoFlowWebGL from "@/components/sections/ManifestoFlowWebGL";
import Manifesto2 from "@/components/sections/Manifesto2";

export default function Home() {
  const brandColor = "#c6376c";

  return (
    <main>
      <InitialLoadingOverlay
        src="/website_videos/loading%20video.mp4"
      />

      <HomeClient brandColor={brandColor} />

      <MountWhenNearViewport
        placeholder={<section aria-hidden style={{ minHeight: "70vh", background: "#000" }} />}
        rootMargin="0px"
      >
        <ManifestoFlowWebGL brandColor={brandColor} />
      </MountWhenNearViewport>

        {/* ✅ Films section switches by breakpoint */}
      <FilmsSectionClient />
      <Manifesto2/>

      {/* ✅ Designs section switches by breakpoint */}
      <DesignsSectionClient />
      <Footer />
    </main>
  );
}
