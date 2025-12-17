'use client';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import MenuOverlay from './MenuOverlay';

export default function Navbar() {
  const [isVisible, setIsVisible] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // 1. Detect Scroll to show/hide navbar
  useEffect(() => {
    const handleScroll = () => {
      // Show navbar only after scrolling 100px
      if (window.scrollY > 100) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      {/* The Fixed Navbar */}
      <motion.nav 
        // Animate opacity based on scroll state
        animate={{ opacity: isVisible || isMenuOpen ? 1 : 0, y: isVisible || isMenuOpen ? 0 : -20 }}
        transition={{ duration: 0.5 }}
        className="fixed top-0 left-0 w-full px-6 py-6 flex justify-between items-center z-[70] mix-blend-difference"
      >
        {/* Left: Eye Logo */}
        <div className="w-12 h-auto cursor-pointer">
          <Image 
            src="/images/logo.png" 
            alt="Slow Drag Logo" 
            width={60} 
            height={40} 
            className="w-full h-auto object-contain"
          />
        </div>

        {/* Right: Hamburger Menu */}
        <button 
          onClick={() => setIsMenuOpen(!isMenuOpen)} 
          className="flex flex-col gap-2 group"
        >
           {/* Animated Lines */}
           <motion.span 
             animate={isMenuOpen ? { rotate: 45, y: 10 } : { rotate: 0, y: 0 }}
             className="w-10 h-0.5 bg-white block transition-transform" 
           />
           <motion.span 
             animate={isMenuOpen ? { opacity: 0 } : { opacity: 1 }}
             className="w-10 h-0.5 bg-white block" 
           />
           <motion.span 
             animate={isMenuOpen ? { rotate: -45, y: -10 } : { rotate: 0, y: 0 }}
             className="w-10 h-0.5 bg-white block transition-transform" 
           />
        </button>
      </motion.nav>

      {/* The Red Overlay Component */}
      <MenuOverlay isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
    </>
  );
}