"use client";

import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

type DesignItem = {
  title: string;
  src: string;
};

export default function MobileDesignsShowcase() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);

  const designs: DesignItem[] = useMemo(
    () =>
      [
        // Put mobile-optimized images in:
        //   public/mobile_images/branding/
        // Then update the file names here.
        { title: "image1.jpg", src: "/mobile_images/branding/image1.jpg" },
        { title: "image2.jpg", src: "/mobile_images/branding/image2.jpg" },
        { title: "image3.jpg", src: "/mobile_images/branding/image3.jpg" },
        { title: "image4.jpg", src: "/mobile_images/branding/image4.jpg" },
        { title: "image5.jpg", src: "/mobile_images/branding/image5.jpg" },
        { title: "image6.jpg", src: "/mobile_images/branding/image6.jpg" },
        { title: "image7.jpg", src: "/mobile_images/branding/image7.jpg" },
        { title: "image8.jpg", src: "/mobile_images/branding/image8.jpg" },
        { title: "image12.jpg", src: "/mobile_images/branding/image12.jpg" },
        { title: "image13.jpg", src: "/mobile_images/branding/image13.jpg" },
        { title: "image14.jpg", src: "/mobile_images/branding/image14.jpg" },
        { title: "image15.jpg", src: "/mobile_images/branding/image15.jpg" },
        { title: "image16.jpg", src: "/mobile_images/branding/image16.jpg" },
        { title: "image17.jpg", src: "/mobile_images/branding/image17.jpg" },
        { title: "image19.jpg", src: "/mobile_images/branding/image19.jpg" },
        { title: "image20.jpg", src: "/mobile_images/branding/image20.jpg" },
        { title: "image21.jpg", src: "/mobile_images/branding/image21.jpg" },
        { title: "image22.jpg", src: "/mobile_images/branding/image22.jpg" },
        { title: "image23.jpg", src: "/mobile_images/branding/image23.jpg" },
        { title: "image24.jpg", src: "/mobile_images/branding/image24.jpg" },
        { title: "image25.jpg", src: "/mobile_images/branding/image25.jpg" },
        { title: "image26.jpg", src: "/mobile_images/branding/image26.jpg" },
        { title: "image27.jpg", src: "/mobile_images/branding/image27.jpg" },
        { title: "image28.jpg", src: "/mobile_images/branding/image28.jpg" }
      ],
    []
  );

  const hasDesigns = designs.length > 0;

  const handleNext = () => {
    if (!hasDesigns) return;
    setActiveIndex((prev) => (prev + 1) % designs.length);
  };

  const handlePrev = () => {
    if (!hasDesigns) return;
    setActiveIndex((prev) => (prev - 1 + designs.length) % designs.length);
  };

  // Fast, continuous autoplay (mobile-only section; desktop remains unchanged elsewhere)
  useEffect(() => {
    if (!hasDesigns) return;
    const id = window.setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % designs.length);
    }, 1400);
    return () => window.clearInterval(id);
  }, [hasDesigns, designs.length]);

  const currentDesign = hasDesigns ? designs[activeIndex] : undefined;

  return (
    <section className="relative w-full h-[100svh] bg-[#020202] text-white flex flex-col overflow-hidden select-none font-sans">
      <header className="h-[12vh] flex flex-col items-center justify-center z-50 px-6 relative">
        <motion.div
          initial={{ opacity: 0, letterSpacing: "1em" }}
          animate={{ opacity: 1, letterSpacing: "0.5em" }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className="flex flex-col items-center"
        >
          <h2 className="text-3xl font-black uppercase italic tracking-[0.5em] text-white/90">
            Designs
          </h2>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: "40px" }}
            transition={{ delay: 0.8, duration: 1 }}
            className="h-[1px] bg-teal-500 mt-3"
          />
        </motion.div>
      </header>

      <main
        className="relative h-[76vh] w-full overflow-hidden"
        onTouchStart={(e) => setTouchStart(e.targetTouches[0].clientX)}
        onTouchEnd={(e) => {
          if (!touchStart) return;
          const dist = touchStart - e.changedTouches[0].clientX;
          if (dist > 50) handleNext();
          else if (dist < -50) handlePrev();
          setTouchStart(null);
        }}
      >
        <div className="absolute inset-0 bg-black" />
        <div className="absolute inset-0 pointer-events-none opacity-[0.10] mix-blend-overlay bg-[url('https://upload.wikimedia.org/wikipedia/commons/7/76/1k_Grain.jpg')]" />

        <AnimatePresence mode="wait">
          {currentDesign ? (
            <motion.div
              key={activeIndex}
              initial={{ opacity: 0, x: 36, rotate: 2, scale: 0.98, filter: "brightness(0.3) contrast(1.15)" }}
              animate={{ opacity: 1, x: 0, rotate: 0, scale: 1, filter: "brightness(1) contrast(1)" }}
              exit={{ opacity: 0, x: -36, rotate: -2, scale: 1.02, filter: "blur(14px)" }}
              transition={{ duration: 0.45, ease: [0.19, 1, 0.22, 1] }}
              className="absolute inset-0 w-full h-full"
            >
              <motion.img
                src={currentDesign.src}
                alt={currentDesign.title}
                className="absolute inset-0 w-full h-full object-contain"
                draggable={false}
                animate={{
                  y: [0, -10, 0, 8, 0],
                  rotate: [0, -0.6, 0.5, 0, 0],
                }}
                transition={{
                  duration: 2.2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />

              <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-[#020202] to-transparent z-10" />
              <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#020202] to-transparent z-10" />
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center text-white/60 px-8 text-center"
            >
              Add images to <span className="text-white/80">public/images/mobile_images/branding</span> and update the
              list in this component.
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="h-[12vh] w-full px-8 flex items-center justify-between z-50 bg-[#020202]">
        <div className="flex gap-2 items-center">
          {designs.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Go to design ${i + 1}`}
              onClick={() => setActiveIndex(i)}
              className="h-0.5 bg-white/10 w-8 rounded-full overflow-hidden"
            >
              {i === activeIndex && <div className="h-full bg-teal-500 w-full" />}
              {i < activeIndex && <div className="h-full bg-white/40 w-full" />}
            </button>
          ))}
        </div>

        <div className="text-[10px] font-bold tracking-[0.2em] text-white/40 uppercase">Swipe</div>
      </footer>
    </section>
  );
}
