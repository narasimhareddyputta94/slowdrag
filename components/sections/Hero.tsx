import React from 'react';

const HeroSection = () => {
  return (
    // Main container
    <section className="relative flex h-screen w-full items-center justify-center bg-black overflow-hidden px-4">

      {/* 1. Main Graphic Container */}
      <div className="w-full flex flex-col items-center justify-center">
        {/* IMPORTANT: This image should NOT have the 'Register' button inside it */}
        <img
          src="/images/titleimage.png" 
          alt="SLOW DRAG"
          className="w-full h-auto object-contain"
        />
      </div>

      {/* 2. Register Button - Pinned to Bottom Right */}
      {/* Force fixed positioning to viewport bottom-right */}
      <div
        className="z-[100]"
        style={{ position: 'fixed', bottom: '1.5rem', right: '1.5rem' }}
      >
        <button className="rounded-full bg-[#a83254] border-2 border-white px-8 py-3 text-sm font-bold text-white transition-all hover:bg-[#c13a60] hover:scale-105 active:scale-95 shadow-lg">
          REGISTER
        </button>
      </div>
    </section>
  );
};

export default HeroSection;