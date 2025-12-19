"use client";

import { useState } from "react";
import Navbar from "@/components/nav/Navbar";
import Manifesto from "@/components/sections/Manifesto";
import FilmsShowcase from "@/components/sections/FilmsShowcase";
import Manifesto2 from "@/components/sections/Manifesto2";
import DesignsShowcase from "@/components/sections/DesignsShowcase";
import Footer from "@/components/footer/Footer";

import HeroMeltWebGL from "@/components/hero/HeroMeltWebGL";

export default function Home() {
  const [showNav, setShowNav] = useState(false);

  return (
    <main>
      <Navbar logoSrc="/images/logo.png" show={showNav} brandColor="#c6376c" />
      {/* Use SVG for best crispness, PNG also works */}
      <HeroMeltWebGL imageSrc="/images/titleimage.svg" onScrolledChange={setShowNav} />
      <Manifesto />
      <FilmsShowcase />
      <Manifesto2 />
      <DesignsShowcase />
      <Footer />
    </main>
  );
}
