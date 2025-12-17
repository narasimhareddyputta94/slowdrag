'use client';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

interface MenuOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MenuOverlay({ isOpen, onClose }: MenuOverlayProps) {
  const menuItems = ['HOME', 'ABOUT', 'WORK', 'MEET THE TEAM', 'CONTACT'];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ duration: 0.6, ease: [0.76, 0, 0.24, 1] }} // Luxury easing
          className="fixed inset-0 bg-[#720e1e] z-[60] flex items-center justify-end pr-8 md:pr-24"
        >
          {/* Close Button (Hidden here because Navbar handles it, but good to have) */}
          
          <div className="flex flex-col gap-6 text-right">
            {menuItems.map((item, index) => (
              <motion.div
                key={item}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + (index * 0.1) }}
              >
                <Link 
                  href={`#`} 
                  onClick={onClose}
                  className="text-4xl md:text-7xl font-bold uppercase tracking-tighter text-[#ededed] hover:text-black transition-colors"
                >
                  {item}
                </Link>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}