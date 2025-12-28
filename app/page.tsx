import dynamic from "next/dynamic";
import Manifesto2 from "@/components/sections/Manifesto2";
import Footer from "@/components/footer/Footer";
import HomeClient from "@/app/HomeClient";

const FilmsShowcaseResponsive = dynamic(
  () => import("@/components/sections/FilmsShowcaseResponsive"),
  { ssr: true }
);
const DesignsShowcaseResponsive = dynamic(
  () => import("@/components/sections/DesignsShowcaseResponsive"),
  { ssr: true }
);
const RotatedVideoSection = dynamic(() => import("@/components/sections/RotatedVideoSection"), {
  ssr: true,
});

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
