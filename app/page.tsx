import Manifesto2 from "@/components/sections/Manifesto2";
import Footer from "@/components/footer/Footer";
import HomeClient from "@/app/HomeClient";
import FilmsSectionClient from "./FilmsSectionClient";
import DesignsSectionClient from "./DesignsSectionClient";
import RotatedVideoSectionClient from "./RotatedVideoSectionClient";

export default function Home() {
  const brandColor = "#c6376c";

  return (
    <main>
      <HomeClient brandColor={brandColor} />

        {/* ✅ Films section switches by breakpoint */}
      <FilmsSectionClient />

      <Manifesto2 />

      {/* ✅ Designs section switches by breakpoint */}
      <DesignsSectionClient />

      <RotatedVideoSectionClient />
      <Footer />
    </main>
  );
}
