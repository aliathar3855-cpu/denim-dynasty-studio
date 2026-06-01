"use client";

import Link from "next/link";

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-white text-[#111111] p-6 md:p-12 font-sans">
      
      {/* Top Navbar */}
      <nav className="flex items-center justify-between max-w-4xl mx-auto mb-16 border-b border-neutral-200 pb-5">
        <Link href="/" className="text-xl font-bold tracking-wide text-[#111111]">
          DENIM DYNASTY STUDIO
        </Link>
        <Link href="/" className="text-sm text-neutral-500 hover:text-black transition">
          ➔ Back to Shop
        </Link>
      </nav>

      {/* Main Content */}
      <article className="max-w-3xl mx-auto space-y-12">
        <header className="text-center space-y-4">
          <span className="text-xs font-bold uppercase tracking-widest text-[#666666]">About Us</span>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-[#111111]">
            Our Story & Craft
          </h1>
          <div className="w-16 h-0.5 bg-[#111111] mx-auto mt-4"></div>
        </header>

        <section className="space-y-6 text-[#666666] text-base leading-relaxed md:text-lg">
          <p>
            Welcome to <strong className="text-[#111111]">Denim Dynasty Studio</strong>, a premium streetwear and boys fashion label managed under the legacy of <strong className="text-[#111111]">JS Faisal Dresses</strong>. Nestled in Kolkata's historic garment hub of Metiabruz, we take pride in designing top-tier apparel that blends everyday comfort with contemporary styles.
          </p>

          <p>
            Founded by <strong className="text-[#111111]">Shaban Azim</strong>, our mission has always been straightforward: to deliver exceptional denim products and streetwear that represent individuality, confidence, and unparalleled comfort for boys and modern young adults.
          </p>

          <div className="my-10 bg-[#f8f8f8] border border-neutral-200/80 p-8 rounded-3xl text-center space-y-3">
            <h3 className="text-xl font-bold text-[#111111]">Our Manufacturing Heritage</h3>
            <p className="text-sm max-w-xl mx-auto">
              Every fabric, thread, and cut is curated carefully in our local workshop. Drawing from Kolkata’s rich tailoring tradition, we strive to design high-quality cord sets, shirts, pants, and premium outerwear.
            </p>
          </div>

          <p>
            At Denim Dynasty Studio, we believe that premium quality fashion shouldn’t be out of reach. By managing our manufacturing pipeline directly from Metiabruz, we deliver premium fits and long-lasting garments without the markup of middle distributors.
          </p>

          <p>
            Thank you for being part of our fashion journey. We look forward to dressing the next generation of streetwear enthusiasts.
          </p>
        </section>

        <div className="text-center pt-8">
          <Link href="/#products" className="inline-block bg-[#111111] text-white px-8 py-3.5 rounded-xl font-bold hover:bg-neutral-800 transition">
            Explore Collection
          </Link>
        </div>
      </article>

    </main>
  );
}
