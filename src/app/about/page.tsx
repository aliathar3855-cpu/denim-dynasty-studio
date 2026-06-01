"use client";

import Link from "next/link";
import Image from "next/image";

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-white text-[#111111] p-6 md:p-12 font-sans">
      
      {/* Top Navbar */}
      <nav className="flex items-center justify-between max-w-4xl mx-auto mb-16 border-b border-neutral-200 pb-5">
        <Link href="/" className="flex items-center shrink-0">
          {/* Full Logo - Desktop and Tablet */}
          <div className="hidden sm:block">
            <Image
              src="/logo-full.png"
              alt="Denim Dynasty Studio"
              width={200}
              height={50}
              priority
              className="w-auto h-9 md:h-11 object-contain"
            />
          </div>
          {/* Icon Logo - Mobile */}
          <div className="block sm:hidden">
            <Image
              src="/logo-icon.png"
              alt="Denim Dynasty Studio"
              width={50}
              height={50}
              priority
              className="w-10 h-10 object-contain"
            />
          </div>
        </Link>
        <Link href="/" className="text-sm text-neutral-500 hover:text-[#38BDF8] transition">
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

        {/* Social Card */}
        <div className="my-10 bg-[#f8f8f8] border border-neutral-200/80 p-8 rounded-3xl text-center space-y-4">
          <h3 className="text-xl font-bold text-[#111111]">Join Our Community</h3>
          <p className="text-sm max-w-xl mx-auto text-[#666666] leading-relaxed">
            Follow us on Instagram for the latest product releases, size guides, behind-the-scenes content at our Kolkata workshop, and streetwear styling inspiration.
          </p>
          <a
            href="https://www.instagram.com/denimdynastystudio?utm_source=qr&igsh=dWZiYTZqNjF4ODNm"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-[#833AB4] via-[#FD1D1D] to-[#F56040] hover:opacity-90 text-white font-bold px-6 py-2.5 rounded-xl shadow-md transition text-sm cursor-pointer"
          >
            📸 Follow @denimdynastystudio
          </a>
        </div>

        <div className="text-center pt-8">
          <Link href="/#products" className="inline-block bg-[#38BDF8] text-black px-8 py-3.5 rounded-xl font-bold hover:bg-[#0ea5e9] hover:text-white transition shadow-sm">
            Explore Collection
          </Link>
        </div>
      </article>

    </main>
  );
}
