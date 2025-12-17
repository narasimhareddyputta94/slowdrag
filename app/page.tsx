import Navbar from '@/components/layout/Navbar';
import Hero from '@/components/sections/Hero';

export default function Home() {
  return (
    <main className="bg-[#0a0a0a] min-h-screen text-white">
      {/* The Intelligent Navbar */}
      <Navbar />
      
      {/* The Melting Hero Section */}
      <Hero />

      {/* Extra space to allow scrolling so the effect works */}
      <section className="h-screen w-full flex items-center justify-center border-t border-gray-800">
        <p className="text-gray-500 tracking-widest">SCROLL FOR MORE MAGIC</p>
      </section>
    </main>
  );
}