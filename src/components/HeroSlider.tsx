"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

interface Slide {
  id: number;
  image: string;
  heading: string;
  subheading: string;
  ctaText: string;
  action: string;
}

const SLIDES: Slide[] = [
  {
    id: 1,
    image: "/hero-boys-fashion.png",
    heading: "Premium Boys Fashion",
    subheading: "Curated streetwear collection for modern trendsetters.",
    ctaText: "Shop Now",
    action: "#products",
  },
  {
    id: 2,
    image: "/hero-new-arrivals.png",
    heading: "New Arrivals",
    subheading: "Freshly dropped designs to elevate his daily style.",
    ctaText: "Shop Now",
    action: "#new-arrivals",
  },
  {
    id: 3,
    image: "/hero-summer-collection.png",
    heading: "Summer Collection",
    subheading: "Breezy cotton tees & shorts for fun in the sun.",
    ctaText: "Shop Now",
    action: "/products/t-shirt",
  },
  {
    id: 4,
    image: "/hero-best-sellers.png",
    heading: "Best Sellers",
    subheading: "Our most-loved denim wear, trousers, and coordinates.",
    ctaText: "Shop Now",
    action: "#best-sellers",
  },
];

export default function HeroSlider() {
  const router = useRouter();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % SLIDES.length);
  }, []);

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + SLIDES.length) % SLIDES.length);
  }, []);

  const selectSlide = (index: number) => {
    setCurrentSlide(index);
  };

  // Autoplay Logic
  useEffect(() => {
    if (!isHovered) {
      timerRef.current = setInterval(() => {
        nextSlide();
      }, 5000);
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isHovered, nextSlide]);

  const handleCtaClick = (action: string) => {
    if (action.startsWith("#")) {
      const targetId = action.substring(1);
      const element = document.getElementById(targetId);
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    } else {
      router.push(action);
    }
  };

  return (
    <section
      className="relative w-full h-[65vh] md:h-[80vh] min-h-[480px] md:min-h-[600px] overflow-hidden bg-neutral-900 select-none"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Slides Container */}
      <div className="absolute inset-0 w-full h-full">
        {SLIDES.map((slide, index) => {
          const isActive = index === currentSlide;
          return (
            <div
              key={slide.id}
              className={`absolute inset-0 w-full h-full transition-opacity duration-1000 ease-in-out ${
                isActive ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
              }`}
            >
              {/* Background Image */}
              <div className="absolute inset-0 w-full h-full">
                <Image
                  src={slide.image}
                  alt={slide.heading}
                  fill
                  priority={index === 0}
                  sizes="100vw"
                  className={`object-cover transition-transform duration-[8000ms] ease-out ${
                    isActive ? "scale-105" : "scale-100"
                  }`}
                />
                {/* Premium Dark Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/35" />
              </div>

              {/* Slide Content */}
              <div className="relative z-20 flex flex-col items-center justify-center h-full text-center text-white px-6 md:px-12">
                <div className="max-w-3xl flex flex-col items-center">
                  {/* Subtle Sub-label */}
                  <span
                    className={`text-xs md:text-sm font-bold uppercase tracking-[0.25em] text-[#38BDF8] mb-4 md:mb-5 transform transition-all duration-700 delay-300 ${
                      isActive ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
                    }`}
                  >
                    Denim Dynasty Studio
                  </span>

                  {/* Main Heading */}
                  <h1
                    className={`text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-black mb-5 md:mb-6 tracking-tight uppercase leading-tight transform transition-all duration-700 delay-500 ${
                      isActive ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
                    }`}
                  >
                    {slide.heading}
                  </h1>

                  {/* Subheading */}
                  <p
                    className={`text-[#E5E5E5] text-sm sm:text-base md:text-lg max-w-2xl mb-8 md:mb-10 font-medium leading-relaxed transform transition-all duration-700 delay-700 ${
                      isActive ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
                    }`}
                  >
                    {slide.subheading}
                  </p>

                  {/* Shop Now Action Button */}
                  <div
                    className={`transform transition-all duration-700 delay-900 ${
                      isActive ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
                    }`}
                  >
                    <button
                      onClick={() => handleCtaClick(slide.action)}
                      className="bg-[#38BDF8] text-black px-8 py-3.5 md:px-10 md:py-4 rounded-full font-extrabold text-sm uppercase tracking-wider hover:bg-[#0ea5e9] hover:text-white transition duration-300 cursor-pointer shadow-lg hover:shadow-sky-500/20 active:scale-95"
                    >
                      {slide.ctaText}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Manual Navigation Arrows */}
      <button
        onClick={prevSlide}
        aria-label="Previous Slide"
        className="absolute left-4 md:left-6 top-1/2 -translate-y-1/2 z-20 flex items-center justify-center w-11 h-11 md:w-13 md:h-13 bg-black/20 hover:bg-black/40 backdrop-blur-sm border border-white/10 hover:border-white/20 text-white rounded-full transition cursor-pointer select-none active:scale-90"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2.5}
          stroke="currentColor"
          className="w-5 h-5"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
      </button>
      <button
        onClick={nextSlide}
        aria-label="Next Slide"
        className="absolute right-4 md:right-6 top-1/2 -translate-y-1/2 z-20 flex items-center justify-center w-11 h-11 md:w-13 md:h-13 bg-black/20 hover:bg-black/40 backdrop-blur-sm border border-white/10 hover:border-white/20 text-white rounded-full transition cursor-pointer select-none active:scale-90"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2.5}
          stroke="currentColor"
          className="w-5 h-5"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
        </svg>
      </button>

      {/* Dots Indicator */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2.5">
        {SLIDES.map((_, index) => {
          const isActive = index === currentSlide;
          return (
            <button
              key={index}
              onClick={() => selectSlide(index)}
              aria-label={`Go to slide ${index + 1}`}
              className={`h-2.5 rounded-full transition-all duration-300 cursor-pointer ${
                isActive ? "w-8 bg-[#38BDF8]" : "w-2.5 bg-white/40 hover:bg-white/70"
              }`}
            />
          );
        })}
      </div>
    </section>
  );
}
