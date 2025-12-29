import Manifesto2 from "@/components/sections/Manifesto2";
import Footer from "@/components/footer/Footer";
import HomeClient from "@/app/HomeClient";
import FilmsSectionClient from "./FilmsSectionClient";
import DesignsSectionClient from "./DesignsSectionClient";
import RotatedVideoSection from "@/components/sections/RotatedVideoSection";
import InitialLoadingOverlay from "@/components/perf/InitialLoadingOverlay";

export default function Home() {
  const brandColor = "#c6376c";

  return (
    <main>
      <InitialLoadingOverlay
        src="/website_videos/loading%20video.mp4"
      />

      <HomeClient brandColor={brandColor} />

        {/* ✅ Films section switches by breakpoint */}
      <FilmsSectionClient />

      <Manifesto2 />

      {/* ✅ Designs section switches by breakpoint */}
      <DesignsSectionClient />

      <RotatedVideoSection />
      <Footer />
    </main>
  );
}
