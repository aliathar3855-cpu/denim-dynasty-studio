"use client";

import React, { useState } from "react";
import { getOptimizedImageUrl } from "@/lib/cloudinaryHelper";

interface HoverMagnifierProps {
  src: string;
  alt: string;
  onClick?: () => void;
}

export default function HoverMagnifier({ src, alt, onClick }: HoverMagnifierProps) {
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    
    // Calculate cursor percentage coordinates inside the image boundary
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    
    // Clamp coordinates to prevent jumping at the boundary edge
    const clampedX = Math.max(0, Math.min(100, x));
    const clampedY = Math.max(0, Math.min(100, y));
    
    setMousePos({ x: clampedX, y: clampedY });
  };

  const optimizedSrc = getOptimizedImageUrl(src, 1000);

  const checkPointerAndSetHover = (hoverState: boolean) => {
    if (typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches) {
      return; // Do not apply hover scaling on touch screens
    }
    setIsHovered(hoverState);
  };

  return (
    <div
      className="relative w-full h-full overflow-hidden cursor-zoom-in group select-none"
      onMouseMove={handleMouseMove}
      onMouseEnter={() => checkPointerAndSetHover(true)}
      onMouseLeave={() => checkPointerAndSetHover(false)}
      onClick={onClick}
    >
      <img
        src={optimizedSrc}
        alt={alt}
        // The scaling applies on devices supporting hover, scaling 2x
        className={`w-full h-full object-cover transition-transform duration-100 ease-out pointer-events-none`}
        style={{
          transformOrigin: `${mousePos.x}% ${mousePos.y}%`,
          transform: isHovered ? "scale(2.2)" : "scale(1)",
        }}
        loading="lazy"
      />
      {/* Visual cue to click and expand */}
      <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none hidden md:block">
        🔍 Click to expand
      </div>
    </div>
  );
}
