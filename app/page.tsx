import FilmsShowcaseResponsive from "@/components/sections/FilmsShowcaseResponsive";
import Manifesto2 from "@/components/sections/Manifesto2";
import DesignsShowcaseResponsive from "@/components/sections/DesignsShowcaseResponsive";
import RotatedVideoSection from "@/components/sections/RotatedVideoSection";
import Footer from "@/components/footer/Footer";
import HomeClient from "@/app/HomeClient";

export default function Home() {
  const brandColor = "#c6376c";

  return (
    <main>
      <HomeClient brandColor={brandColor} />

        {/* ✅ Films section switches by breakpoint */}
        <FilmsShowcaseResponsive />

      <Manifesto2 />

      {/* ✅ Designs section switches by breakpoint */}
      <DesignsShowcaseResponsive />

      <RotatedVideoSection />
      <Footer />
    </main>
  );
}
