"use client";

import { useState } from "react";
import Hero from "@/components/hero/Hero";
import Navbar from "@/components/nav/Navbar";

export default function Home() {
  const [showNav, setShowNav] = useState(false);

  return (
    <main>
      <Navbar
        logoSrc="/images/logo.png"
        show={showNav}
        brandColor="#c6376c"
      />

      <Hero
        imageSrc="/images/titleimage.png"
        onScrolledChange={(v) => setShowNav(v)}
      />

      {/* extra height so you can scroll and see navbar appear */}
      <div style={{ height: "200vh", background: "#000" }} />
    </main>
  );
}
