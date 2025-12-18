"use client";

import { useState } from "react";
import Hero from "@/components/hero/Hero";
import Navbar from "@/components/nav/Navbar";
import Manifesto from "@/components/sections/Manifesto";
import FilmsShowcase from "@/components/sections/FilmsShowcase";

export default function Home() {
  const [showNav, setShowNav] = useState(false);

  return (
    <main>
      <Navbar logoSrc="/images/logo.png" show={showNav} brandColor="#c6376c" />

      <Hero imageSrc="/images/titleimage.png" onScrolledChange={setShowNav} />

      <Manifesto />

      <FilmsShowcase />
    </main>
  );
}
